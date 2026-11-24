export const EVENT_CONFIG = Object.freeze({
  date: "2026-11-28",
  timeZone: "Asia/Amman",
  utcOffsetMinutes: 180,
  windows: Object.freeze([
    Object.freeze(["10:00", "14:00"] as const),
    Object.freeze(["16:00", "22:00"] as const),
  ]),
  interviewMinutes: 15,
  gapMinutes: 5,
});
