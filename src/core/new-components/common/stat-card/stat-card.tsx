import { LtrRun } from "../ltr-run";
import type { StatCardProps, StatCardTone } from "./stat-card-props";

const RULE: Record<StatCardTone, string> = {
  accent: "bg-accent",
  ink: "bg-rule-strong",
  muted: "bg-rule",
};

export function StatCard({ label, value, tone }: StatCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-ground shadow-sm">
      <span aria-hidden="true" className={`block h-1 ${RULE[tone]}`} />
      <div className="px-4 py-3">
        <p className="text-3xl leading-none font-bold tabular-nums text-ink">
          <LtrRun>{String(value)}</LtrRun>
        </p>
        <p className="mt-1.5 text-xs font-semibold text-ink-muted">{label}</p>
      </div>
    </div>
  );
}
