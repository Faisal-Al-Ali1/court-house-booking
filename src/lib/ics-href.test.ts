import { test } from "node:test";
import assert from "node:assert/strict";
import { ICS_SLOT_PARAM, icsHref } from "./ics-href.ts";
import { isPlaceholderContent } from "./placeholder-content.ts";

test("the download href encodes the slot and uses the shared parameter name", () => {
  assert.equal(
    icsHref("ar", "2026-11-28T10:00"),
    `/ar/api/ics?${ICS_SLOT_PARAM}=2026-11-28T10%3A00`,
  );
});

test("TODO-prefixed content is a placeholder, real content is not", () => {
  assert.equal(isPlaceholderContent("TODO-AR: https://maps.example/x"), true);
  assert.equal(isPlaceholderContent("TODO: paste the venue map URL here"), true);
  assert.equal(isPlaceholderContent("https://maps.app.goo.gl/abc"), false);
  assert.equal(isPlaceholderContent("  "), true);
});
