import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, isolateHtml, isolateText } from "./isolate.ts";

const SENTENCE = "موعدك الساعة 11:00 ص في 28 تشرين الثاني 2026";

test("Arabic HTML wraps each Latin or numeric run in an ltr span", () => {
  const html = isolateHtml(SENTENCE, "ar");
  assert.ok(html.includes('<span dir="ltr">11:00</span>'));
  assert.ok(html.includes('<span dir="ltr">28</span>'));
  assert.ok(html.includes('<span dir="ltr">2026</span>'));
  assert.ok(html.includes("موعدك الساعة "));
});

test("Arabic text wraps each run with left-to-right marks", () => {
  const text = isolateText(SENTENCE, "ar");
  assert.ok(text.includes("\u200E11:00\u200E"));
  assert.ok(text.includes("\u200E2026\u200E"));
});

test("an email address and phone number stay whole", () => {
  assert.ok(isolateText("البريد a.b@example.com", "ar").includes("\u200Ea.b@example.com\u200E"));
  assert.ok(isolateHtml("الهاتف +962 79 123 4567", "ar").includes('<span dir="ltr">+962 79 123 4567</span>'));
});

test("English is escaped but never wrapped", () => {
  assert.equal(isolateHtml("10:00 AM", "en"), "10:00 AM");
  assert.equal(isolateText("10:00 AM", "en"), "10:00 AM");
});

test("markup inside an isolated run is escaped", () => {
  assert.equal(escapeHtml(`<a href="x">&'`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  assert.ok(!isolateHtml("اسم <b>x</b>", "ar").includes("<b>"));
});
