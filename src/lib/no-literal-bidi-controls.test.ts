import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const BIDI_CONTROL = /[\uFEFF\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
const SOURCE_FILE = /\.tsx?$/;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(path);
    }
    return SOURCE_FILE.test(entry.name) ? [path] : [];
  });
}

test("no source file contains a literal bidi control character", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const files = sourceFiles(root);
  assert.ok(files.length > 20);
  const offenders: string[] = [];
  for (const file of files) {
    readFileSync(file, "utf8")
      .split(String.fromCharCode(10))
      .forEach((line, index) => {
        if (BIDI_CONTROL.test(line)) {
          offenders.push(`${file}:${index + 1}`);
        }
      });
  }
  assert.deepEqual(offenders, []);
});

test("the guard itself detects a literal mark", () => {
  assert.ok(BIDI_CONTROL.test(String.fromCharCode(0x200e)));
  assert.ok(BIDI_CONTROL.test(String.fromCharCode(0x061c)));
  assert.ok(BIDI_CONTROL.test(String.fromCharCode(0xfeff)));
  assert.ok(!BIDI_CONTROL.test("plain text 10:00"));
});
