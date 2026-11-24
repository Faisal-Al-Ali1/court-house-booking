import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const MARKER = /\bTODO\b|Example Street/;
const LOCALES = ["ar", "en"] as const;

type Tree = { [key: string]: string | Tree };

function load(locale: string): Tree {
  const path = new URL(`../../messages/${locale}.json`, import.meta.url);
  return JSON.parse(readFileSync(path, "utf8")) as Tree;
}

function flatten(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[`${prefix}${key}`, value] as [string, string]]
      : flatten(value, `${prefix}${key}.`),
  );
}

function leftover(locale: string): string[] {
  return flatten(load(locale))
    .filter(([, value]) => MARKER.test(value))
    .map(([key]) => key);
}

test("the marker pattern detects both placeholder spellings and spares real copy", () => {
  assert.ok(MARKER.test("TODO-AR: Choose a time"));
  assert.ok(MARKER.test("TODO: paste the venue map URL here"));
  assert.ok(MARKER.test("Building 12, Example Street, Amman 11118"));
  assert.ok(!MARKER.test("Court House+ interview"));
  assert.ok(!MARKER.test("اختر موعدا"));
});

for (const locale of LOCALES) {
  test(`LAUNCH GATE (expected to fail until the client copy lands, not a broken test): messages/${locale}.json has no TODO marker or sample value`, () => {
    const keys = leftover(locale);
    assert.equal(
      keys.length,
      0,
      [
        "",
        `LAUNCH GATE: ${keys.length} placeholder string(s) remain in messages/${locale}.json.`,
        "This failure is intentional. It clears only when the client's real copy replaces every one.",
        "See docs/client-copy-needed.md. Keys still to replace:",
        ...keys.map((key) => `  - ${key}`),
      ].join(String.fromCharCode(10)),
    );
  });
}
