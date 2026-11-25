import { test } from "node:test";
import assert from "node:assert/strict";
import { renderHtml, renderText } from "./templates/layout.ts";
import { SITE_NAME } from "../../constants/site.ts";

const content = {
  locale: "ar",
  heading: "heading",
  paragraphs: ["body"],
  rows: [],
  links: [],
  footer: "footer",
} as const;

test("the html email leads with the brand logo at an absolute url", () => {
  const html = renderHtml(content);
  assert.match(html, /<img[^>]+src="https?:\/\/[^"]+\.png"/);
});

test("the logo falls back to the brand name when images are blocked", () => {
  const html = renderHtml(content);
  assert.match(html, /<img[^>]+alt="Court House\+"/);
  assert.equal(SITE_NAME, "Court House+");
});

test("the plain-text email carries no image markup", () => {
  assert.equal(renderText(content).includes("<img"), false);
});
