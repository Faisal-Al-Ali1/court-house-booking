import type { Locale } from "../../../i18n/routing.ts";
import { escapeHtml, isolateHtml, isolateText } from "../isolate.ts";

export type EmailRow = { label: string; value: string };
export type EmailLink = { label: string; url: string };

export type EmailContent = {
  locale: Locale;
  heading: string;
  paragraphs: readonly string[];
  rows: readonly EmailRow[];
  links: readonly EmailLink[];
  footer: string;
};

const FONT_STACK = "Tahoma, Arial, sans-serif";

export function renderHtml(content: EmailContent): string {
  const { locale } = content;
  const direction = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  const paragraphs = content.paragraphs
    .map((text) => `<p style="margin:0 0 16px">${isolateHtml(text, locale)}</p>`)
    .join("");
  const rows = content.rows
    .map(
      (row) =>
        `<tr><td style="padding:6px 0 6px 16px;color:#555;vertical-align:top;text-align:${align}">${isolateHtml(row.label, locale)}</td><td style="padding:6px 0;font-weight:bold;text-align:${align}">${isolateHtml(row.value, locale)}</td></tr>`,
    )
    .join("");
  const table = rows
    ? `<table role="presentation" dir="${direction}" style="border-collapse:collapse;margin:8px 0 16px">${rows}</table>`
    : "";
  const links = content.links
    .map(
      (link) =>
        `<p style="margin:16px 0 0"><a href="${escapeHtml(link.url)}">${isolateHtml(link.label, locale)}</a></p>`,
    )
    .join("");
  return [
    "<!doctype html>",
    `<html lang="${locale}" dir="${direction}">`,
    `<body style="margin:0;padding:24px;font-family:${FONT_STACK};font-size:16px;line-height:1.6;color:#111;text-align:${align}">`,
    `<div dir="${direction}" style="max-width:560px;margin:0 auto;text-align:${align}">`,
    `<h1 style="margin:0 0 16px;font-size:22px">${isolateHtml(content.heading, locale)}</h1>`,
    paragraphs,
    table,
    links,
    `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #ddd;font-size:13px;color:#555">${isolateHtml(content.footer, locale)}</p>`,
    "</div>",
    "</body>",
    "</html>",
  ].join("");
}

export function renderText(content: EmailContent): string {
  const { locale } = content;
  const blocks: string[] = [isolateText(content.heading, locale)];
  blocks.push(...content.paragraphs.map((text) => isolateText(text, locale)));
  if (content.rows.length > 0) {
    blocks.push(
      content.rows
        .map((row) => isolateText(`${row.label}: ${row.value}`, locale))
        .join("\n"),
    );
  }
  for (const link of content.links) {
    blocks.push(`${isolateText(link.label, locale)}\n${link.url}`);
  }
  blocks.push(isolateText(content.footer, locale));
  return blocks.join("\n\n");
}
