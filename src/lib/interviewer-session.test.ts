import { test } from "node:test";
import assert from "node:assert/strict";
import {
  issueSession,
  passwordMatches,
  readInterviewerPassword,
  sessionExpiry,
  sessionIsValid,
} from "./interviewer-session.ts";

const SECRET = "test-secret-one";
const NOW = new Date("2026-11-28T09:00:00Z");
const LATER = new Date("2026-11-28T21:00:00Z");

test("the right password matches", () => {
  assert.equal(passwordMatches("correct horse", "correct horse"), true);
});

test("a wrong password of any length does not match", () => {
  assert.equal(passwordMatches("wrong", "correct horse"), false);
  assert.equal(passwordMatches("correct horse battery", "correct horse"), false);
  assert.equal(passwordMatches("", "correct horse"), false);
});

test("an unset or empty expected password matches nothing", () => {
  assert.equal(passwordMatches("", ""), false);
  assert.equal(passwordMatches("anything", ""), false);
});

test("a fresh session is valid until its expiry", () => {
  const session = issueSession(LATER, SECRET);
  assert.equal(sessionIsValid(session, NOW, SECRET), true);
});

test("an expired session is refused", () => {
  const session = issueSession(NOW, SECRET);
  assert.equal(sessionIsValid(session, LATER, SECRET), false);
});

test("a missing, forged or foreign session is refused", () => {
  assert.equal(sessionIsValid(undefined, NOW, SECRET), false);
  assert.equal(sessionIsValid("nonsense", NOW, SECRET), false);
  assert.equal(sessionIsValid(issueSession(LATER, "other"), NOW, SECRET), false);
});

test("a signed booking reference is not an interviewer session", () => {
  const stray = Buffer.from("a@example.com").toString("base64url");
  assert.equal(sessionIsValid(`${stray}.AAAA`, NOW, SECRET), false);
});

test("the password is read when asked for, not at import", () => {
  const saved = process.env.INTERVIEWER_PASSWORD;
  try {
    delete process.env.INTERVIEWER_PASSWORD;
    assert.equal(readInterviewerPassword(), "");
    process.env.INTERVIEWER_PASSWORD = "late-value";
    assert.equal(readInterviewerPassword(), "late-value");
  } finally {
    if (saved === undefined) {
      delete process.env.INTERVIEWER_PASSWORD;
    } else {
      process.env.INTERVIEWER_PASSWORD = saved;
    }
  }
});

test("a session opened before the first interview outlasts the last one", () => {
  const earlySignIn = new Date("2026-11-28T06:30:00Z");
  const lastInterviewEnds = new Date("2026-11-28T19:00:00Z");
  const session = issueSession(sessionExpiry(earlySignIn), SECRET);
  assert.equal(sessionIsValid(session, lastInterviewEnds, SECRET), true);
});

test("a session runs twenty-four hours from sign-in, whatever the date", () => {
  const afterTheEvent = new Date("2027-01-15T09:00:00Z");
  const expiry = sessionExpiry(afterTheEvent);
  assert.equal(expiry.getTime() - afterTheEvent.getTime(), 24 * 60 * 60 * 1000);
  const session = issueSession(expiry, SECRET);
  assert.equal(sessionIsValid(session, afterTheEvent, SECRET), true);
  assert.equal(
    sessionIsValid(session, new Date(expiry.getTime() + 1), SECRET),
    false,
  );
});
