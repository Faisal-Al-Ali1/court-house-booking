export type LtrSplitRun = { text: string; isLtr: boolean };

const LTR_RUN =
  /‎?[\p{Script=Latin}0-9+@](?:[\p{Script=Latin}0-9 .,:/\-–—+&@'’%_]*[\p{Script=Latin}0-9%+])?/gu;

export function splitLtrRuns(text: string): readonly LtrSplitRun[] {
  const runs: LtrSplitRun[] = [];
  let cursor = 0;

  for (const match of text.matchAll(LTR_RUN)) {
    const start = match.index;
    if (start > cursor) {
      runs.push({ text: text.slice(cursor, start), isLtr: false });
    }
    runs.push({ text: match[0], isLtr: true });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    runs.push({ text: text.slice(cursor), isLtr: false });
  }

  return runs;
}
