import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const APP = fileURLToPath(new URL("../app", import.meta.url));

function read(...segments: string[]): string {
  const path = join(APP, ...segments);
  assert.ok(existsSync(path), `missing error boundary: ${path}`);
  return readFileSync(path, "utf8");
}

test("the booking segment has a client error boundary offering a retry", () => {
  const source = read("[locale]", "error.tsx");
  assert.match(source, /^"use client";/);
  assert.match(source, /reset/);
});

test("the interviewer segment has its own error boundary", () => {
  const source = read("[locale]", "interviewer", "error.tsx");
  assert.match(source, /^"use client";/);
  assert.match(source, /reset/);
});

test("a global boundary catches failures in the root layout", () => {
  const source = read("global-error.tsx");
  assert.match(source, /^"use client";/);
  assert.match(source, /<html/);
  assert.match(source, /<body/);
});

test("no boundary leaks the raw error message to the applicant", () => {
  for (const segments of [
    ["[locale]", "error.tsx"],
    ["[locale]", "interviewer", "error.tsx"],
    ["global-error.tsx"],
  ]) {
    const source = read(...segments);
    assert.equal(
      /\{\s*error\.message\s*\}/.test(source),
      false,
      `${segments.join("/")} renders error.message`,
    );
  }
});
