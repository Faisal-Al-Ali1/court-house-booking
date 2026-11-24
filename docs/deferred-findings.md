# Deferred findings from the build

Fifty-one findings were raised during the build, judged minor, and deliberately not fixed. This file is the
record of them, so the list does not live only on the developer's machine. Each is quoted as it was written
at the time, which is why some refer to "Task 10" — the final task, whose remaining work is the rehearsal in
`docs/deploy-checklist.md` sections 6 and 7.

The final whole-branch review triaged all of them and let them stand, with the three exceptions marked below.
Nothing here blocks launch. None was hidden to make the build look finished: every one was recorded when it was
found, and the cost of leaving it was weighed against fixing it with the event four days away.

The full reasoning for each sits in the execution ledger at
`.superpowers/sdd/2026-11-24-court-house-booking-portal/progress.md`, which is git-ignored and therefore not
on the remote. See also `docs/rulings.md` for the decisions taken during the build.

## The ones that still want a human

These say so in their own words: each needs the deployed instance, a real device, or an eye on the page, and
the rehearsal in the checklist is where they get it.

- **Task 4** — scripts/ensure-indexes.mjs is still invoked by nothing but the test's before hook. The guard converts that from silent double-booking into a loud failure, but someone must still run it against Atlas before Saturday — Task 10 owns this.
- **Task 6** — checkbox and radio names read oddly in the automation accessibility tree; no real screen-reader check was made. Goes to Task 10's accessibility pass.
- **Task 6** — focus is not moved to the heading on confirmation, and the aria-live region is mounted with its content so it may not announce. Task 10 accessibility pass.
- **Task 7** — no committed test covers the .ics route — neither the 200 path nor the four 404 gate cases. Verified once manually; Task 10 re-checks on the deployed instance.
- **Task 7** — no real calendar application import was performed. Closed at parser level by the controller's RFC 5545 unfolding check; a genuine import is part of Task 10's rehearsal.
- **Task 7** — the confirmation screen has not been looked at visually since the venue was added. Task 10's bilingual walkthrough covers it.
- **Task 7** — no new-tab cue on the target="_blank" map link. Task 10 accessibility pass.
- **Task 7** — iOS Safari must still offer "Add to Calendar" despite Content-Disposition: attachment. Task 10 rehearsal, on a real device.
- **Task 7** — the map-link wiring has no test — reverting the component's gate expression would fail nothing. Unverifiable today in any case, since with placeholders no link renders at all. Task 10 checks it once the client's URL lands.

Everything else below is code quality, consistency or a note for a future maintainer.

---

## Task 1

- Livvic @font-face rules ship in the CSS bundle served to /ar, so Arabic visitors download a Latin-only font they never apply. Performance only; computed stack is clean.
- scripts/solve-tokens.mjs prints values that are hand-copied into tailwind.css, with nothing checking the two agree. Verified identical at Task 1; they can drift.
- lightenUntil and darken in solve-tokens.mjs can return null, which would throw an unhelpful TypeError. Unreachable with the current anchors.
- @types/* and typescript remain on scaffold carets while runtime deps are pinned exactly.
- Arabic copy in src/app/not-found.tsx is implementer-written and lives outside the messages files, because the root not-found has no next-intl provider. Needs client review.

## Task 2

- slots tests hardcode `14*60 / 16*60 / 22*60` rather than reading EVENT_CONFIG.windows, so they would not follow a config change.
- Slot is not declared Readonly<>, though instances are frozen at runtime.

## Task 3

- ltr-run/index.ts uses named exports where the sibling default-exports; two components in one folder makes a default awkward.
- key={index} in RichText. Fine for a static split.
- a comma-joined list becomes a single LTR run. Acceptable while Tasks 6 and 9 render slots as separate elements — if either ever joins slot times into one string, render them as separate LtrRuns.

## Task 4

- npm test needs network on first run, because MongoMemoryServer downloads a mongod binary. No CI exists today; it will matter the day a workflow is added.
- the scripted fake's findOne ignores its filter, so the retry tests pin insert arithmetic without proving lookup order. Covered in combination by the real-mongod tests; not worth reworking the fake.
- `Success<T>.data` is optional and ServerFailure.code is string | undefined, so callers need narrowing (errorCodeOf is the intended accessor). Verbatim-copied contract — not to be changed.
- scripts/ensure-indexes.mjs is still invoked by nothing but the test's before hook. The guard converts that from silent double-booking into a loud failure, but someone must still run it against Atlas before Saturday — Task 10 owns this.
- the readPreference "primary" on list() and takenSlotIds() is untested — the pinning could be removed with no test failing. Same shape as the guard-wiring gap but materially lower risk.
- isExpectedShape does not check sparse, collation or expireAfterSeconds. Unchanged in kind from before; not a regression.
- bookingsIndexesVerified is cached on globalThis without being keyed by DB name, which is why the new test clears it by hand. Harmless in production with a single MONGODB_DB.

## Task 5

- the last-resort fallback message, used only when translation loading itself fails, is English-only. If next-intl cannot load messages the page is broken regardless, so a bilingual constant would buy little.
- U+061C (Arabic Letter Mark) is not stripped by normaliseDigits — the bidi control most likely to appear in Arabic text. It cannot bypass the ≥7-digit rule, but it would be stored inside an otherwise valid phone string and could trip a dialer on copy-paste. One codepoint added to an existing set; deferred because a round-trip plus re-review is poor economics for it now, and it is equally cheap to fix at the final review.
  - **FIXED SINCE — U+061C is in `BIDI_CONTROLS` in `src/lib/normalise-digits.ts` at HEAD.**
- a phone shorter than 7 characters triggers both .min(7) and the refine, emitting phoneRequired twice. parseFormErrors takes the first, so it is harmless.
- the t.has fallback in parseFormErrors has no test — the action cannot be loaded under node --test because of its @/ imports. Structural limit, not an omission.

## Task 6

- the English TODO-AR placeholder text misplaces punctuation in RTL. Disappears when the client's Arabic copy lands.
- checkbox and radio names read oddly in the automation accessibility tree; no real screen-reader check was made. Goes to Task 10's accessibility pass.
- page-client.tsx is 260 lines mixing step derivation, effect orchestration, FormData building and layout; a useBookingFlow hook would reduce it to rendering.
- booking.language key is unused, and "Saturday 28 November 2026" is hard-coded in three strings rather than derived from EVENT_CONFIG.
  - **PARTLY FIXED — the unused `booking.language` key is gone; the hard-coded date string remains.**
- focus is not moved to the heading on confirmation, and the aria-live region is mounted with its content so it may not announce. Task 10 accessibility pass.
- with secure set in production, a plain-http next start reached by LAN IP will not store the cookie, so the confirmation survives only in client state. A device-testing note, not a bug.
- a fresh load of ?step=slot renders the slot step server-side then bounces to details after hydration when the draft is blank. Brief flash, harmless.
- Buffer.from(value, "base64url") is lenient, so several distinct cookie strings decode to the same valid MAC. Signature malleability only — forgery still needs the secret.
- the "session secret unusable" log fires on every request carrying both a cookie and ?booked while the secret is unset. Noisy but useful.

## Task 7

- no committed test covers the .ics route — neither the 200 path nor the four 404 gate cases. Verified once manually; Task 10 re-checks on the deployed instance.
- no real calendar application import was performed. Closed at parser level by the controller's RFC 5545 unfolding check; a genuine import is part of Task 10's rehearsal.
- the confirmation screen has not been looked at visually since the venue was added. Task 10's bilingual walkthrough covers it.
- the ar venue shows "TODO-AR:" twice, because the venue name and address are separately prefixed keys. Disappears with the client's real text.
- no new-tab cue on the target="_blank" map link. Task 10 accessibility pass.
- iOS Safari must still offer "Add to Calendar" despite Content-Disposition: attachment. Task 10 rehearsal, on a real device.
- a URL containing an apostrophe or braces could be mangled by ICU parsing. Going into the client handoff as "use a maps.app.goo.gl short link" rather than code.
- the only pre-launch guard against leftover placeholders is a manual grep. Task 10 should make it a launch-check script.
  - **SUPERSEDED — `npm run launch-check` replaced the manual grep.**
- the map-link wiring has no test — reverting the component's gate expression would fail nothing. Unverifiable today in any case, since with placeholders no link renders at all. Task 10 checks it once the client's URL lands.
- the venue-messages test rejects a URL containing an apostrophe. Rare, and it fails loudly rather than silently.

## Task 8

- readMailConfig() runs twice per send. Harmless.
- no test covers swallow-then-continue at the create-booking level; the second send proceeds only because sendBookingConfirmation swallows its own errors. Wrapping the first await in try/catch would make it independent of that contract. Correct today; the coupling is implicit.
- sequential sends are spaced only by their own latency, which is fine for one booking but does not throttle a broadcast burst.
- Bidi assertions were not added to the notification and cancellation email templates (they share the confirmation's layout, which is covered), and `client.ts` was not split into a separate config module.

## Task 9

- a single SESSION_SECRET signs both booking refs and interviewer sessions, with domain separation resting on a payload prefix rather than key separation. Closed today by two independent properties rather than by design. Worth knowing; not worth re-architecting four days out.
- path: "/" sends the session cookie on every public request. Locale prefixes make a path scope awkward, so defensible.
- sign-in.ts hand-builds /{locale}/interviewer instead of using the navigation helpers. Safe — the locale is validated with hasLocale — just inconsistent.
- breakBefore scans windows twice (some, then findIndex). Harmless at thirty rows.
- the {kind:"gone"} notice carries a phone the message never uses. Type looseness.
- the session-not-issuable self-check is dead defensive code — unreachable, because now+12h always validates.

## Task 10

- NEXT_PUBLIC_SITE_URL is the one module-load env read. Optional and build-time only; documented in the checklist and CLAUDE.md.
