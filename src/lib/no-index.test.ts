import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const APP = fileURLToPath(new URL("../app", import.meta.url));
const NO_INDEX = /robots:\s*\{[^}]*index:\s*false/;

function read(...segments: string[]): string {
  const path = join(APP, ...segments);
  assert.ok(existsSync(path), `missing layout: ${path}`);
  return readFileSync(path, "utf8");
}

test("the applicant pages ask search engines not to index them", () => {
  assert.match(read("[locale]", "layout.tsx"), NO_INDEX);
});

test("the interviewer pages ask the same", () => {
  assert.match(read("[locale]", "interviewer", "layout.tsx"), NO_INDEX);
});

test("the guard would notice if the directive were dropped", () => {
  assert.equal(NO_INDEX.test("export const metadata = {};"), false);
  assert.equal(
    NO_INDEX.test("robots: { index: true, follow: false },"),
    false,
  );
  assert.equal(NO_INDEX.test("robots: { index: false, follow: false },"), true);
});
