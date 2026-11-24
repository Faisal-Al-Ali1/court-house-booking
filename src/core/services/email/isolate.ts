import { splitLtrRuns } from "../../../lib/split-ltr-runs.ts";
import type { Locale } from "../../i18n/routing.ts";

const LEFT_TO_RIGHT_MARK = "‎";
const MARK_PATTERN = /‎/g;

const HTML_ESCAPES: Readonly<Record<string, string>> = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
});

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

export function isolateHtml(text: string, locale: Locale): string {
  if (locale !== "ar") {
    return escapeHtml(text);
  }
  return splitLtrRuns(text)
    .map((run) =>
      run.isLtr
        ? `<span dir="ltr">${escapeHtml(run.text.replace(MARK_PATTERN, ""))}</span>`
        : escapeHtml(run.text),
    )
    .join("");
}

export function isolateText(text: string, locale: Locale): string {
  if (locale !== "ar") {
    return text;
  }
  return splitLtrRuns(text)
    .map((run) =>
      run.isLtr
        ? `${LEFT_TO_RIGHT_MARK}${run.text.replace(MARK_PATTERN, "")}${LEFT_TO_RIGHT_MARK}`
        : run.text,
    )
    .join("");
}
