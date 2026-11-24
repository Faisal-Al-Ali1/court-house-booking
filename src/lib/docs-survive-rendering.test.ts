import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const MARKDOWN_FILE = /\.md$/;
const SKIPPED_DIRECTORY = /^(?:node_modules|\.next|\.git|\.superpowers)$/;
const CODE_SPAN = /`[^`]*`/g;
const FENCE = /^\s*```/;
const NEWLINE = String.fromCharCode(10);

const HTML_TAG = /<\/?[A-Za-z][A-Za-z0-9.-]*(?:\s[^>]*)?\/?>/g;
const ASTERISK_BETWEEN_WORDS = /[A-Za-z0-9]\*[A-Za-z0-9]/g;

export function eatenByRendering(line: string): readonly string[] {
  const prose = line.replace(CODE_SPAN, "");
  return [
    ...[...prose.matchAll(HTML_TAG)].map((match) => match[0]),
    ...[...prose.matchAll(ASTERISK_BETWEEN_WORDS)].map((match) => match[0]),
  ];
}

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return SKIPPED_DIRECTORY.test(entry.name) ? [] : markdownFiles(join(directory, entry.name));
    }
    return MARKDOWN_FILE.test(entry.name) ? [join(directory, entry.name)] : [];
  });
}

test("no committed Markdown hides text inside markup a renderer would eat", () => {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const files = markdownFiles(root);
  assert.ok(files.length >= 4);

  const offenders: string[] = [];
  for (const file of files) {
    let inFence = false;
    readFileSync(file, "utf8")
      .split(NEWLINE)
      .forEach((line, index) => {
        if (FENCE.test(line)) {
          inFence = !inFence;
          return;
        }
        if (inFence) {
          return;
        }
        for (const eaten of eatenByRendering(line)) {
          offenders.push(`${relative(root, file)}:${index + 1} ${eaten}`);
        }
      });
  }
  assert.deepEqual(offenders, []);
});

test("the guard catches every fragment this project has actually lost to a renderer", () => {
  assert.deepEqual(eatenByRendering("| 4 | `booking.stepOf` | Step <n>{current}</n> of <n>{total}</n> |"), [
    "<n>",
    "</n>",
    "<n>",
    "</n>",
  ]);
  assert.deepEqual(eatenByRendering("- Success<T>.data is optional and ServerFailure.code is undefined"), [
    "<T>",
  ]);
  assert.deepEqual(eatenByRendering("- slots tests hardcode 14*60 / 16*60 / 22*60 rather than the config"), [
    "4*6",
    "6*6",
    "2*6",
  ]);
  assert.deepEqual(eatenByRendering("wrap them in <who>{name}</who> as well"), ["<who>", "</who>"]);
});

test("the guard spares real prose, real emphasis and real code spans", () => {
  assert.deepEqual(eatenByRendering("**Do not add a tag to a string that has none in English.**"), []);
  assert.deepEqual(eatenByRendering("A few English strings contain tags such as `<n>...</n>` or `<call>...</call>`."), []);
  assert.deepEqual(eatenByRendering("wrap that site in `<RichText>`, or add the tag to **both** files"), []);
  assert.deepEqual(eatenByRendering("- `14*60 / 16*60 / 22*60` rather than reading EVENT_CONFIG.windows"), []);
  assert.deepEqual(eatenByRendering("Some *emphasis* and @types/* and a 3*4 grid is caught, not this"), ["3*4"]);
  assert.deepEqual(eatenByRendering("Send a <https://maps.app.goo.gl/x> short link"), []);
  assert.deepEqual(eatenByRendering("Reply-To is set to mail@example.com and 10:00–10:15 is the slot"), []);
});
