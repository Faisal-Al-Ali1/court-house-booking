import type { Booking } from "../repositories/bookings/types.ts";

const BOM = "\uFEFF";
const LINE_BREAK = "\r\n";
const HEADER = [
  "slot time",
  "name",
  "email",
  "phone",
  "locale",
  "booked at",
  "status",
];
const FORMULA_START = /^[=+\-@\t\r]/;
const PHONE_SHAPE = /^\+?[\d\s()-]+$/;
const NEEDS_QUOTES = /[",\r\n]/;

function defuse(value: string): string {
  return FORMULA_START.test(value) ? `'${value}` : value;
}

function field(value: string): string {
  return NEEDS_QUOTES.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function phoneField(value: string): string {
  return PHONE_SHAPE.test(value) ? field(`="${value}"`) : field(defuse(value));
}

function row(booking: Booking): string {
  return [
    field(booking.slotId.replace("T", " ")),
    field(defuse(booking.name)),
    field(defuse(booking.email)),
    phoneField(booking.phone),
    field(booking.locale),
    field(booking.createdAt.toISOString()),
    field(booking.cancelledAt ? "cancelled" : "booked"),
  ].join(",");
}

export function toCsv(bookings: Booking[]): string {
  const lines = [HEADER.join(","), ...bookings.map(row)];
  return BOM + lines.join(LINE_BREAK) + LINE_BREAK;
}
