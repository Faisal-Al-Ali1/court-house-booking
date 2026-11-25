import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isHttpUrl } from "../src/lib/placeholder-content.ts";

const MARKER = /\btodo\b|Example Street/i;
const LOCALES = ["ar", "en"] as const;
const NEWLINE = String.fromCharCode(10);

type Tree = { [key: string]: string | Tree };

function load(locale: string): Tree {
  const path = new URL(`../messages/${locale}.json`, import.meta.url);
  return JSON.parse(readFileSync(path, "utf8")) as Tree;
}

function flatten(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[`${prefix}${key}`, value] as [string, string]]
      : flatten(value, `${prefix}${key}.`),
  );
}

function entries(locale: string): Map<string, string> {
  return new Map(flatten(load(locale)));
}

function report(heading: string, keys: string[]): string {
  return [
    "",
    `LAUNCH GATE: ${heading}`,
    "This failure is intentional. It is npm run launch-check, not npm test.",
    "See docs/client-copy-needed.md. Keys involved:",
    ...keys.map((key) => `  - ${key}`),
  ].join(NEWLINE);
}

test("the marker pattern detects every placeholder spelling and spares real copy", () => {
  assert.ok(MARKER.test("TODO-AR: Choose a time"));
  assert.ok(MARKER.test("TODO: paste the venue map URL here"));
  assert.ok(MARKER.test("todo: later"));
  assert.ok(MARKER.test("Building 12, Example Street, Amman 11118"));
  assert.ok(!MARKER.test("Court House+ interview"));
  assert.ok(!MARKER.test("اختر موعدا"));
});

for (const locale of LOCALES) {
  test(`LAUNCH GATE (expected to fail until the client copy lands, not a broken test): messages/${locale}.json has no TODO marker or sample value`, () => {
    const keys = [...entries(locale)]
      .filter(([, value]) => MARKER.test(value))
      .map(([key]) => key);
    assert.equal(
      keys.length,
      0,
      report(`${keys.length} placeholder string(s) remain in messages/${locale}.json.`, keys),
    );
  });

  test(`LAUNCH GATE (expected to fail until the client copy lands, not a broken test): messages/${locale}.json venue.mapUrl is a real http(s) link`, () => {
    const value = entries(locale).get("venue.mapUrl") ?? "";
    assert.ok(
      isHttpUrl(value),
      report(
        `venue.mapUrl in messages/${locale}.json is not an http(s) URL, so the map link would be silently suppressed.`,
        ["venue.mapUrl"],
      ),
    );
  });
}

test("LAUNCH GATE: ar.json and en.json define exactly the same keys", () => {
  const ar = new Set(entries("ar").keys());
  const en = new Set(entries("en").keys());
  const mismatched = [
    ...[...ar].filter((key) => !en.has(key)).map((key) => `${key} (only in ar.json)`),
    ...[...en].filter((key) => !ar.has(key)).map((key) => `${key} (only in en.json)`),
  ];
  assert.equal(
    mismatched.length,
    0,
    report("the message files disagree on their keys.", mismatched),
  );
});

const TAG = /<\/?(?:n|who|call|mail)>/g;

function tagsOf(value: string): string {
  return (value.match(TAG) ?? []).sort().join(" ");
}

test("LAUNCH GATE: ar.json and en.json carry the same <n>, <who>, <call> and <mail> tags in every string", () => {
  const ar = entries("ar");
  const mismatched: string[] = [];
  for (const [key, english] of entries("en")) {
    const arabic = ar.get(key);
    if (arabic === undefined) {
      continue;
    }
    const expected = tagsOf(english);
    const actual = tagsOf(arabic);
    if (expected !== actual) {
      mismatched.push(`${key} (en: [${expected}] ar: [${actual}])`);
    }
  }
  assert.equal(
    mismatched.length,
    0,
    report(
      "an Arabic string adds, drops or changes a tag. Keep exactly the tags the English has.",
      mismatched,
    ),
  );
});

test("LAUNCH GATE: the fully-booked screen tells an applicant how to make contact", () => {
  const missing = ["ar", "en"].filter(
    (locale) =>
      !(entries(locale).get("booking.fullyBooked.body") ?? "").includes(
        "{email}",
      ),
  );
  assert.deepEqual(
    missing,
    [],
    report(
      "the fully-booked screen is the only thing a 31st applicant sees, so it must carry {email}.",
      missing,
    ),
  );
});

test("LAUNCH GATE: the privacy notice names the date the details are deleted", () => {
  const DATED = /\d{1,2}[^0-9]{1,24}20\d{2}/;
  const missing = ["ar", "en"].filter(
    (locale) =>
      !DATED.test(entries(locale).get("booking.fields.privacyNotice") ?? ""),
  );
  assert.deepEqual(
    missing,
    [],
    report(
      "the privacy notice promises deletion, so it must state the date.",
      missing,
    ),
  );
});
