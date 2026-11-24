import { splitLtrRuns } from "@/lib/split-ltr-runs";
import type { LtrRunProps, RichTextProps } from "./ltr-run-props";

export function LtrRun({ children, className }: LtrRunProps) {
  return (
    <span dir="ltr" className={className}>
      {children}
    </span>
  );
}

export function RichText({ children }: RichTextProps) {
  return (
    <>
      {splitLtrRuns(children).map((run, index) =>
        run.isLtr ? <LtrRun key={index}>{run.text}</LtrRun> : run.text,
      )}
    </>
  );
}
