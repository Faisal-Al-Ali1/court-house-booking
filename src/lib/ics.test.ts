import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIcs } from "./ics.ts";

const NOW = new Date("2026-11-24T08:00:00Z");

function build(overrides: Partial<Parameters<typeof buildIcs>[0]> = {}): string {
  return buildIcs({
    slotId: "2026-11-28T10:00",
    summary: "Interview",
    location: "Amman",
    locale: "en",
    now: NOW,
    ...overrides,
  });
}

function unfold(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, "");
}

test("emits a valid VEVENT with UTC times", () => {
  const ics = build();
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART:20261128T070000Z/);
  assert.match(ics, /DTEND:20261128T071500Z/);
});

test("escapes commas and semicolons in the location", () => {
  const ics = build({ location: "Queen Rania St, Amman" });
  assert.match(ics, /LOCATION:Queen Rania St\\, Amman/);
  assert.match(build({ location: "A;B" }), /LOCATION:A\\;B/);
});

test("escapes backslashes and newlines in text values", () => {
  const ics = unfold(build({ location: "a\\b\nc\r\nd" }));
  assert.match(ics, /LOCATION:a\\\\b\\nc\\nd\r\n/);
});

test("folds lines longer than 75 octets", () => {
  const ics = build({ summary: "مقابلة", location: "ش".repeat(120), locale: "ar" });
  const lines = ics.split("\r\n");
  assert.ok(lines.some((line) => line.startsWith(" ")));
  for (const line of lines) {
    assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  }
});

test("folding never splits a UTF-8 sequence and unfolds losslessly", () => {
  const location = "عمّان، شارع الملكة رانيا, ".repeat(12) + "😀".repeat(30);
  const ics = build({ location, locale: "ar" });
  for (const line of ics.split("\r\n")) {
    assert.ok(!line.includes("�"));
    assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  }
  const unfolded = unfold(ics);
  const escaped = location.replace(/,/g, "\\,");
  assert.ok(unfolded.includes(`LOCATION:${escaped}\r\n`));
});

test("uses CRLF line endings throughout", () => {
  const ics = build({ summary: "مقابلة", location: "عمّان", locale: "ar" });
  assert.ok(!/[^\r]\n/.test(ics));
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("carries a stable UID and a DTSTAMP", () => {
  const ics = build();
  assert.match(ics, /UID:2026-11-28T10:00@/);
  assert.match(ics, /DTSTAMP:20261124T080000Z/);
});

test("evening slots convert from Amman time", () => {
  const ics = build({ slotId: "2026-11-28T21:40" });
  assert.match(ics, /DTSTART:20261128T184000Z/);
  assert.match(ics, /DTEND:20261128T185500Z/);
});

test("an unknown slot is rejected", () => {
  assert.throws(() => build({ slotId: "2026-11-28T10:07" }));
});
