import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isHttpUrl, isPlaceholderContent } from "./placeholder-content.ts";

type VenueMessages = { venue: Record<string, string> };

function load(locale: string): VenueMessages {
  const path = new URL(`../../messages/${locale}.json`, import.meta.url);
  return JSON.parse(readFileSync(path, "utf8")) as VenueMessages;
}

for (const locale of ["ar", "en"]) {
  test(`${locale}: venue.mapUrl is a placeholder or a valid http(s) URL`, () => {
    const value = load(locale).venue.mapUrl;
    if (isPlaceholderContent(value)) {
      assert.equal(isHttpUrl(value), false);
      return;
    }
    assert.ok(isHttpUrl(value), `not a URL: ${value}`);
    assert.doesNotThrow(() => new URL(value));
    assert.ok(!/[{}']/.test(value), "braces or apostrophes can break ICU parsing");
  });

  test(`${locale}: venue.fullLocation is structural and carries no marker`, () => {
    const value = load(locale).venue.fullLocation;
    assert.ok(!isPlaceholderContent(value));
    assert.ok(value.includes("{name}") && value.includes("{address}"));
  });
}

test("only an actual URL can produce a map link", () => {
  for (const value of ["TBD", "todo", "paste the venue map URL here", "", "maps.google.com/x"]) {
    assert.equal(isHttpUrl(value), false, value);
  }
  assert.equal(isHttpUrl("https://maps.app.goo.gl/abc123"), true);
});
