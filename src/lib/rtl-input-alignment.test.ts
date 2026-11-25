import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const COMPONENT_FILE = /\.tsx$/;
const PAGE_ALIGNED = "alignToPage";

function componentFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return componentFiles(path);
    }
    return COMPONENT_FILE.test(entry.name) ? [path] : [];
  });
}

function forcedLtrInputs(source: string): string[] {
  return source
    .split("<input")
    .slice(1)
    .map((chunk) => chunk.slice(0, chunk.indexOf("/>")))
    .filter((element) => element.includes('dir="ltr"'));
}

function misalignedInputs(source: string): number {
  return forcedLtrInputs(source).filter(
    (element) => !element.includes(PAGE_ALIGNED),
  ).length;
}

test("every forced-ltr input aligns with the page, not with its own direction", () => {
  const root = fileURLToPath(new URL("../app", import.meta.url));
  const files = componentFiles(root);
  assert.ok(files.length > 5);

  const offenders = files.filter(
    (file) => misalignedInputs(readFileSync(file, "utf8")) > 0,
  );

  assert.deepEqual(offenders, []);
});

test("the guard accepts an input that follows the page", () => {
  const sample = '<input dir="ltr" className={`${INPUT} ${alignToPage}`} />';
  assert.equal(forcedLtrInputs(sample).length, 1);
  assert.equal(misalignedInputs(sample), 0);
});

test("the guard rejects both ways of getting it wrong", () => {
  assert.equal(
    misalignedInputs('<input dir="ltr" className="foo text-start" />'),
    1,
  );
  assert.equal(misalignedInputs('<input dir="ltr" className="foo" />'), 1);
});

test("inputs that inherit the page direction are not policed", () => {
  assert.equal(misalignedInputs('<input className="text-start" />'), 0);
  assert.equal(forcedLtrInputs('<input type="text" />').length, 0);
});
