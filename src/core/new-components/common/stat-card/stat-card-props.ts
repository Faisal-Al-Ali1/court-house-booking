export type StatCardTone = "accent" | "ink" | "muted";

export type StatCardProps = {
  label: string;
  value: number;
  tone: StatCardTone;
};
