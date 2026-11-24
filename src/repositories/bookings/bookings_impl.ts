import type { Collection } from "mongodb";
import { getDb } from "../../lib/mongo.ts";
import { generateSlots, isSlotPast, isValidSlotId } from "../../lib/slots.ts";
import type { Result } from "../../core/types/results/results.ts";
import type { BookingsRepo } from "./bookings_repo.ts";
import {
  BOOKING_ERROR_CODES,
  type Booking,
  type BookingErrorCode,
  type SlotClaim,
} from "./types.ts";

const COLLECTION = "bookings";
const DUPLICATE_KEY_CODE = 11000;
const MAX_INSERT_ATTEMPTS = 2;
const NO_ID = { projection: { _id: 0 }, readPreference: "primary" } as const;

type CollectionProvider = () => Promise<Collection<Booking>>;

function ok<T>(data: T): Result<T> {
  return { type: "success", data };
}

function fail<T>(code: BookingErrorCode, message: string): Result<T> {
  return { type: "failure", failure: { type: "server", code, message } };
}

function databaseFailure<T>(error: unknown): Result<T> {
  const message = error instanceof Error ? error.message : "Unexpected database error";
  return fail(BOOKING_ERROR_CODES.database, message);
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === DUPLICATE_KEY_CODE
  );
}

async function defaultCollection(): Promise<Collection<Booking>> {
  const db = await getDb();
  return db.collection<Booking>(COLLECTION);
}

export class BookingsImpl implements BookingsRepo {
  private readonly now: () => Date;
  private readonly collection: CollectionProvider;

  constructor(
    now: () => Date = () => new Date(),
    collection: CollectionProvider = defaultCollection,
  ) {
    this.now = now;
    this.collection = collection;
  }

  async create(booking: Booking): Promise<Result<SlotClaim>> {
    const slot = generateSlots().find((candidate) => candidate.id === booking.slotId);
    if (!slot || !isValidSlotId(booking.slotId)) {
      return fail(BOOKING_ERROR_CODES.unknownSlot, "Unknown slot");
    }
    const now = this.now();
    if (isSlotPast(slot, now)) {
      return fail(BOOKING_ERROR_CODES.slotPast, "Slot is no longer available");
    }

    const entry: Booking = {
      slotId: booking.slotId,
      name: booking.name,
      email: booking.email.trim().toLowerCase(),
      phone: booking.phone,
      locale: booking.locale,
      createdAt: now,
      cancelledAt: null,
    };

    try {
      const bookings = await this.collection();
      for (let attempt = 0; attempt < MAX_INSERT_ATTEMPTS; attempt += 1) {
        try {
          await bookings.insertOne({ ...entry });
          return ok("created");
        } catch (error) {
          if (!isDuplicateKey(error)) {
            throw error;
          }
          const claim = await this.resolveFromData(bookings, entry);
          if (claim) {
            return ok(claim);
          }
        }
      }
      return fail(BOOKING_ERROR_CODES.retry, "Booking changed while saving, please retry");
    } catch (error) {
      return databaseFailure(error);
    }
  }

  private async resolveFromData(
    bookings: Collection<Booking>,
    submitted: Booking,
  ): Promise<SlotClaim | null> {
    const byEmail = await bookings.findOne(
      { email: submitted.email, cancelledAt: null },
      NO_ID,
    );
    if (byEmail) {
      return byEmail.slotId === submitted.slotId ? "idempotent" : "already-booked";
    }
    const holder = await bookings.findOne(
      { slotId: submitted.slotId, cancelledAt: null },
      NO_ID,
    );
    return holder ? "slot-taken" : null;
  }

  async listActive(): Promise<Result<Booking[]>> {
    return this.list({ cancelledAt: null });
  }

  async listAll(): Promise<Result<Booking[]>> {
    return this.list({});
  }

  private async list(filter: Partial<Pick<Booking, "cancelledAt">>): Promise<Result<Booking[]>> {
    try {
      const bookings = await this.collection();
      const rows = await bookings.find(filter, { projection: { _id: 0 } }).sort({ slotId: 1 }).toArray();
      return ok(rows);
    } catch (error) {
      return databaseFailure(error);
    }
  }

  async cancel(slotId: string): Promise<Result<null>> {
    try {
      const bookings = await this.collection();
      const outcome = await bookings.updateOne(
        { slotId, cancelledAt: null },
        { $set: { cancelledAt: this.now() } },
      );
      if (outcome.matchedCount === 0) {
        return fail(BOOKING_ERROR_CODES.notFound, "No active booking for this slot");
      }
      return ok(null);
    } catch (error) {
      return databaseFailure(error);
    }
  }

  async takenSlotIds(): Promise<Result<string[]>> {
    try {
      const bookings = await this.collection();
      const rows = await bookings
        .find({ cancelledAt: null }, { projection: { _id: 0, slotId: 1 } })
        .toArray();
      return ok(rows.map((row) => row.slotId));
    } catch (error) {
      return databaseFailure(error);
    }
  }
}
