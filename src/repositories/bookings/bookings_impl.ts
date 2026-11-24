import type { Collection } from "mongodb";
import { getDb } from "../../lib/mongo.ts";
import { generateSlots, isSlotPast, isValidSlotId } from "../../lib/slots.ts";
import type { Result } from "../../core/types/results/results.ts";
import type { BookingsRepo } from "./bookings_repo.ts";
import type { Booking, SlotClaim } from "./types.ts";

const COLLECTION = "bookings";
const DUPLICATE_KEY_CODE = 11000;
const NO_ID = { projection: { _id: 0 } } as const;

type DuplicateKeyError = { code: number; keyPattern?: Record<string, unknown> };

function ok<T>(data: T): Result<T> {
  return { type: "success", data };
}

function fail<T>(message: string): Result<T> {
  return { type: "failure", failure: { type: "generic", message } };
}

function isDuplicateKey(error: unknown): error is DuplicateKeyError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === DUPLICATE_KEY_CODE
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected database error";
}

export class BookingsImpl implements BookingsRepo {
  private readonly now: () => Date;

  constructor(now: () => Date = () => new Date()) {
    this.now = now;
  }

  private async collection(): Promise<Collection<Booking>> {
    const db = await getDb();
    return db.collection<Booking>(COLLECTION);
  }

  async create(booking: Booking): Promise<Result<SlotClaim>> {
    const slot = generateSlots().find((candidate) => candidate.id === booking.slotId);
    if (!slot || !isValidSlotId(booking.slotId)) {
      return fail("Unknown slot");
    }
    if (isSlotPast(slot, this.now())) {
      return fail("Slot is no longer available");
    }

    const document: Booking = {
      slotId: booking.slotId,
      name: booking.name,
      email: booking.email.trim().toLowerCase(),
      phone: booking.phone,
      locale: booking.locale,
      createdAt: booking.createdAt,
      cancelledAt: null,
    };

    try {
      const bookings = await this.collection();
      await bookings.insertOne({ ...document });
      return ok("created");
    } catch (error) {
      if (!isDuplicateKey(error)) {
        return fail(messageOf(error));
      }
      try {
        return await this.resolveDuplicate(error, document);
      } catch (lookupError) {
        return fail(messageOf(lookupError));
      }
    }
  }

  private async resolveDuplicate(
    error: DuplicateKeyError,
    submitted: Booking,
  ): Promise<Result<SlotClaim>> {
    const bookings = await this.collection();
    const key = error.keyPattern ?? {};

    if (key.slotId) {
      const holder = await bookings.findOne(
        { slotId: submitted.slotId, cancelledAt: null },
        NO_ID,
      );
      if (!holder) {
        return fail("Slot changed during booking, please retry");
      }
      return ok(holder.email === submitted.email ? "idempotent" : "slot-taken");
    }

    if (key.email) {
      const existing = await bookings.findOne(
        { email: submitted.email, cancelledAt: null },
        NO_ID,
      );
      if (!existing) {
        return fail("Booking changed during booking, please retry");
      }
      return ok(existing.slotId === submitted.slotId ? "idempotent" : "already-booked");
    }

    return fail("Unrecognised duplicate key");
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
      const rows = await bookings.find(filter, NO_ID).sort({ slotId: 1 }).toArray();
      return ok(rows);
    } catch (error) {
      return fail(messageOf(error));
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
        return fail("No active booking for this slot");
      }
      return ok(null);
    } catch (error) {
      return fail(messageOf(error));
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
      return fail(messageOf(error));
    }
  }
}
