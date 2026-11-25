export type WalkInState =
  | { status: "idle" }
  | { status: "added" }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "slot-taken" }
  | { status: "already-booked" }
  | { status: "failed" }
  | { status: "signed-out" };
