import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Tree = { [key: string]: string | Tree };

function load(locale: string): Tree {
  const path = new URL(`../../../../messages/${locale}.json`, import.meta.url);
  return (JSON.parse(readFileSync(path, "utf8")) as { email: Tree }).email;
}

function flatten(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[`${prefix}${key}`, value] as [string, string]]
      : flatten(value, `${prefix}${key}.`),
  );
}

test("email keys match across locales", () => {
  const en = flatten(load("en")).map(([key]) => key).sort();
  const ar = flatten(load("ar")).map(([key]) => key).sort();
  assert.deepEqual(ar, en);
});

test("English email copy carries no placeholder marker", () => {
  for (const [key, value] of flatten(load("en"))) {
    assert.ok(!value.startsWith("TODO"), key);
  }
});

test("no email string is only interpolation and punctuation", () => {
  for (const [key, value] of flatten(load("en"))) {
    const words = value.replace(/\{[^}]*\}/g, "").replace(/[^\p{L}]/gu, "");
    assert.ok(words.length > 0, key);
  }
});
