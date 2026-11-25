import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const COMPONENT_FILE = /\.tsx$/;

function componentFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return componentFiles(path);
    }
    return COMPONENT_FILE.test(entry.name) ? [path] : [];
  });
}

function misalignedInputs(source: string): number {
  return source
    .split("<input")
    .slice(1)
    .map((chunk) => chunk.slice(0, chunk.indexOf("/>")))
    .filter(
      (element) =>
        element.includes('dir="ltr"') && element.includes("text-start"),
    ).length;
}

test("no forced-ltr input aligns text to its own start edge", () => {
  const root = fileURLToPath(new URL("../app", import.meta.url));
  const files = componentFiles(root);
  assert.ok(files.length > 5);

  const offenders = files.filter(
    (file) => misalignedInputs(readFileSync(file, "utf8")) > 0,
  );

  assert.deepEqual(offenders, []);
});

test("the guard itself detects a misaligned input", () => {
  assert.equal(
    misalignedInputs('<input dir="ltr" className="foo text-start" />'),
    1,
  );
  assert.equal(
    misalignedInputs('<input dir="ltr" className="foo text-right" />'),
    0,
  );
  assert.equal(misalignedInputs('<input className="text-start" />'), 0);
});
