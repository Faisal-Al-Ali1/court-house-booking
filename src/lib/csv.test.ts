import { test } from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "./csv.ts";
import type { Booking } from "../repositories/bookings/types.ts";

const base: Booking = {
  slotId: "2026-11-28T10:00",
  name: "Layla Haddad",
  email: "layla@example.com",
  phone: "+962791234567",
  locale: "en",
  createdAt: new Date("2026-11-25T08:30:00Z"),
  cancelledAt: null,
};

test("prefixes a UTF-8 BOM so Excel reads Arabic", () => {
  assert.ok(toCsv([]).startsWith("﻿"));
});

test("quotes fields containing commas", () => {
  const csv = toCsv([{ ...base, name: "Haddad, Layla" }]);
  assert.match(csv, /"Haddad, Layla"/);
});

test("marks cancelled bookings rather than omitting them", () => {
  const csv = toCsv([{ ...base, cancelledAt: new Date("2026-11-27T10:00:00Z") }]);
  assert.match(csv, /cancelled/);
  assert.equal(csv.trim().split("\n").length, 2);
});

test("writes the seven columns in order", () => {
  const [header, row] = toCsv([base]).replace("﻿", "").trim().split("\r\n");
  assert.equal(header, "slot time,name,email,phone,locale,booked at,status");
  assert.equal(
    row,
    "2026-11-28 10:00,Layla Haddad,layla@example.com,\"=\"\"+962791234567\"\"\",en,2026-11-25T08:30:00.000Z,booked",
  );
});

test("keeps Arabic names as they are", () => {
  const csv = toCsv([{ ...base, name: "ليلى حداد", locale: "ar" }]);
  assert.ok(csv.includes("ليلى حداد"));
});

test("doubles embedded quotes and quotes embedded line breaks", () => {
  const csv = toCsv([{ ...base, name: 'Layla "Lulu"\nHaddad' }]);
  assert.ok(csv.includes('"Layla ""Lulu""\nHaddad"'));
});

test("defuses spreadsheet formulas in applicant-supplied text", () => {
  const csv = toCsv([
    { ...base, name: "=HYPERLINK(\"http://evil\")", email: "@sum@example.com" },
  ]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes("'@sum@example.com"));
});

test("keeps a phone number as text so Excel does not turn it into a number", () => {
  const csv = toCsv([{ ...base, phone: "0791112222" }]);
  assert.ok(csv.includes(`,"=""0791112222""",`));
});

test("defuses a phone field that is not shaped like a phone number", () => {
  const csv = toCsv([{ ...base, phone: "=1+1" }]);
  assert.ok(csv.includes(",'=1+1,"));
});
