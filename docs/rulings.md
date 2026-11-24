# Decisions taken on your behalf

Every judgement call made during the build, in the order made, with what it costs if wrong. Read it and reverse anything you disagree with — several of these overrode the approved spec or plan, and a few overrode each other.

The execution ledger these come from lives at `.superpowers/sdd/2026-11-24-court-house-booking-portal/progress.md` (git-ignored) and carries the full reasoning for each. The findings that ledger parked as minor are in `docs/deferred-findings.md`.

---

## Setup

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 1 | A feature branch rather than a git worktree — the repo was created empty for this plan and nothing else touches it | Nil; a worktree can be cut from this branch at any time |
| 2 | Project lives at `Desktop\Projects\court-house-booking`, beside the sibling bilingual projects, so their `CLAUDE.md` conventions are readable | One `mv` |

## Plan defects found before any code was written

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 3 | The `.ics` route takes the slot as a query parameter, not a path segment — a slot id contains a colon, legal in a path per the RFC but handled inconsistently across proxies | One route signature and one href |
| 4 | Task 4's Interfaces block binds over its Steps, so all five repository methods ship, not the two the steps detailed | A later task blocks on a missing method |
| 5 | Every task adding UI copy writes to **both** locale files; Task 9 adds an `interviewer` namespace the plan omitted | A missing string surfaces at the bilingual walkthrough |
| 6 | `tailwind.css` created by Task 1, appended by Task 3 with the Arabic letter-spacing reset, unlayered at the end — the house rule is that an `@utility` beats `@layer base` | Arabic headings take letter-spacing; review catches it |

## Dependencies and conventions

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 7 | **Re-pin every dependency to what `aldallah-group-landingpage` actually runs** (Next 16.3.3, next-intl 4.14.0, Tailwind 4.3.3, Zod 4.4.3). The plan transcribed the siblings' caret *floors* as exact pins — a version none of them has ever run, and one that ships no `dist/docs/`, making the "read the docs first" rule unsatisfiable | One reinstall; caught at one task in |
| 8 | Accept the solver's `ground-raised` at `#fafafa` rather than the sibling's 0.97 — brand charcoal is the fixed point, so the surface moves to hold 10:1 | Cards read flat; a border is one line |
| 9 | Pin `mongodb` and `resend` exactly in the tasks that first depend on them, rather than resuming Task 1 | A caret drift at the next clean install |
| 10 | Keep `SITE_NAME` despite being unused at the time — it is the untranslated brand string for places with no next-intl provider | One file to delete |
| 11 | **Accept relative `.ts` imports inside the node:test reachability graph**, with `allowImportingTsExtensions`. Node's type stripping cannot resolve tsconfig `paths`, so the alternative was abandoning the tests or taking a test-runner dependency | A later `@/` import in a tested module fails loudly at `npm test` |
| 12 | `node --test src/lib/` corrected to a glob — Node 24.15 treats the bare directory as a file | Plan defect; correction stands |
| 13 | The plan's test code passed possibly-undefined `find()` results into `formatSlotTime`, failing `tsc`. Accepted the implementer's `assert.ok` narrowing | My error; fix is minimal |
| 17 | Add an `engines` field declaring Node ≥ 21 at Task 10 — the test glob needs it | Low; `npm test` is not part of the Vercel build |

## The LTR / bidi work

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 14 | Fold the missing `isSlotPast` exact-boundary test into Task 4, the consumer that depends on it | Task 4's review catches an untested boundary |
| 15 | Accept tests hardcoding the window minutes rather than reading config — single-date event | A config change passes stale tests |
| 16 | Accept `Slot` without `Readonly<>` — instances are frozen at runtime | Cosmetic |
| 18 | Restructure to `common/ltr-run/{...}` matching the sibling layout; delete `common/types/` | Three-file move |
| 19 | Add regression tests for a leading-`+` international number and `1145-A` beside an Arabic comma | Two redundant tests |
| 20 | Accept `RichText` always wrapping, with no locale prop — on a page that is mostly numbers, forgetting a prop is worse than redundant markup | Inert spans on English pages |
| 21 | Accept ASCII-digit-only isolation — Arabic-Indic digits inside Arabic text are already correctly directional | Isolating them would be wrong |
| 22 | **Escalate the ASCII-only character class to a required fix.** Accented names shredded into fragments — `محمد José Müller` became five pieces with `é` and `ü` loose. Fixed with `\p{Script=Latin}` | Broader class than needed, which costs nothing |
| 23 | **Escalate the missing en dash to a required fix.** `2:00 – 4:00 PM` split into two isolates, which render in RTL order — the break divider would have read backwards, and my own plan mandated that exact string | Rendering bug on the default locale |
| 25 | Fix NFD at the input boundary (`normalize("NFC")` in the schema), not in the regex — one transform fixes rendering, storage, CSV and email together | A decomposed name renders split; same as before |

## The database layer

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 26 | Verify against `mongodb-memory-server`, a real `mongod`, not a mock — a mock cannot prove a unique index works, which is the only thing this task had to prove | Task 10 re-verifies against the real cluster |
| 27 | `MONGODB_URI` and `MONGODB_DB` added to the open items — the plan named the interviewer password but omitted the database credentials entirely | Plan defect, caught |
| 28 | **Override my own "byte-identical" requirement** on the shared `Result` types. The contract needs identical *type shapes*, not an identical module specifier | Reverting is one character |
| 29 | **Add a once-per-cold-start index-existence guard.** Without it, a missing index means `create` inserts duplicates silently — every caller gets "created", nothing raises, two strangers hold the same slot | One query per cold start |
| 30 | Fold eight Minors into one fix round against the usual rule, because all sat in the correctness core and each would cost more once three tasks depended on it | Eight cheap changes on proven code |
| 31 | The blank-email lockout goes to Task 5's brief — the fix belongs in validation | Task 5's review catches it |
| 32 | Take three of five new Minors; the guard's **wiring** was untested, so deleting the `await` kept 42 tests green | Three cheap changes |
| 36 | **Escalate the silent catch.** A failed Mongo connection became "something went wrong" with nothing logged — a dead form for the interviewer and no signal for you | Debuggability on the day |
| 37 | Extract the claim-to-state mapper into `src/lib` so the most emphasised outcome in the build is testable rather than read | Marginal |

## Validation and the booking action

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 33 | Require unit tests for the schema rather than accepting that `@/` imports put it out of reach — the blank-email rule is load-bearing for availability | A few tests in a slightly odd location |
| 34 | Accept the `slotPast` message key beyond my brief's list — collapsing it into "unexpected" would misinform | Nil |
| 35 | Accept trimming the email **before** validation with a 254-char cap, overriding the brief's order | My error; correction stands |
| 50 | **Send email only on `created`, never `idempotent`.** A double-tap must not produce two emails; the cost is that a silently failed first send plus a retry yields no mail at all, tolerable only because the on-screen confirmation is authoritative | An applicant gets no email in a rare path |

## The confirmation gate — four rounds, each overturning the last

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 38 | **The confirmation screen was forgeable** — any valid slot id in `?booked=` rendered a confirmation, so a forwarded URL produced a false confirmation for someone else's slot | Someone turns up to a slot they never booked |
| 39 | **The cookie fix was only half a fix** — it proved "this browser once booked slot X", not that a live booking exists, so a cancelled booking still said "you are booked" | Same failure, narrowed |
| 40 | Accept email-in-cookie over a random token — the attack seemed to need both the email and the slot | **Overturned, see 41** |
| 41 | **Overturn 40.** With only thirty enumerable slot ids, someone knowing just an email can walk `?booked=` through all thirty and learn whether that person booked and when | A narrow privacy leak |
| 42 | Close it by **signing the cookie** rather than switching to a stored token — a token means reopening the repository and handling the idempotency case where a double-tap keeps the first row | Token can be added later; the resolve logic is now pure |
| 43 | On the **read** path a missing `SESSION_SECRET` renders the booking form, not an error page. The applicant cannot fix an env var; the developer needs a log line | Loud failure moves to the log |

## The calendar file and venue

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 44 | **Gate the `.ics` route behind the same confirmation check** — not asked for by the plan, but the venue is shown only to confirmed applicants and thirty slot ids are guessable | Free now; a retrofit later would not be |
| 45 | The `.ics` 200 path must be tested — the 404s are the security half, the 200 is the half an applicant uses | A route that always 404s would have passed |
| 46 | Accept that the route has no committed test, guarded at deployment instead — unlike the index guard, the gate it calls is well covered and the route is thin glue | A broken route surfaces at the rehearsal |
| 47 | **The guessed map URL had to fail visibly.** `maps.google.com/?q=Court+House+Amman` was a working-looking link to the wrong place with no marker — every applicant navigated to a search result for the wrong venue, on the day | A wrong map is worse than none |
| 48 | One more round for three items, two of them placeholders failing where nobody looks — a fail-open URL check, and a `TODO-AR:` prefix reaching only the `.ics` file | Cheap |
| 24, 49 | Accept remaining Minors; `INTERVIEWER_LOCALE` from the environment defaulting to `ar` — only you know the interviewer's preference, so the answer costs a setting rather than a release | One env var |

## Email

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 51 | Take seven Minors, three restoring invariants already established — English label cells touching, a literal U+200E, and no `onError` on the translator | Cheap |
| 52 | A **fourth** literal invisible character, in the phone-stripping regex — if a tool drops one, the strip quietly stops covering that control and nothing fails | Silent; the thing stripping exists to prevent |
| 53 | **Add a repo-wide guard** against literal bidi controls. Four occurrences across three tasks is a property of writing them by hand, and every one is invisible in review | Makes the next one impossible to commit |
| 54 | **Do not** extend that guard to the message JSON. In source a literal is always a bug; in content it may be deliberate — Arabic copy legitimately uses RLM/LRM, and the client's text arrives from Word or WhatsApp | A guard there would reject correct Arabic typography |

## The interviewer view

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 55 | **Report whether the cancellation email actually sent**, rather than chasing atomicity. A swallowed failure showed success, so the interviewer believed the applicant was told | They now get the phone number as a tap-to-call link |
| 56 | **No sign-in rate limit; the control is password entropy.** On serverless an in-memory counter is near useless and a database-backed one means a write per attempt. A four-day portal with thirty records. **This holds only if the password is generated, not memorable** | Weak password plus no rate limit would be negligent |
| 57 | Accept the `="+962..."` CSV wrapper — messier for a Python or Sheets consumer, but an undiallable number is the worse failure. Excel had stripped the leading zero from `0791112222` | A human strips the wrapper |
| 58 | **The session expired at midnight after the event**, taking the CSV export — the thing the spec calls "how the data outlives the portal" — with it, silently | Decoupled from the event date |
| 59 | The event date rendered as bare text on the interviewer page — invisible today only because the Arabic is a placeholder, so it would first misrender **on the day the real copy lands** | Caught before that |

## Launch readiness

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 60 | **Split the launch gate out of `npm test`** — my error, caught by the implementer. A suite red for three days destroys the signal it exists to give | The gate is missable; it is step 1 of the checklist |
| 61 | The data-protection notice must exist, not merely be referenced by the consent text | Spec requirement |
| 62 | **Build its display now**, with the placeholder in it — the whole placeholder design rests on the client's copy landing as a message-file edit and nothing more | Otherwise someone writes UI on Thursday under deadline |
| 63 | **The `SESSION_SECRET` section described the wrong failure** — it said only the cookie breaks, when a missing secret also breaks interviewer sign-in and the calendar download. A wrong document is worse than none, because it gets followed | The interviewer cannot sign in on Saturday |

## Final review

| # | Decision | Cost if wrong |
| - | -------- | ------------- |
| 64 | **My translator guidance was wrong for 88 of 106 keys.** I told the client to wrap Latin runs in `<n>`; that is correct for the 10 tag-aware strings and renders as literal markup everywhere else — on the confirmation screen, in the emails, in the calendar title | Narrowed, and tag parity now gates it mechanically |
| 65 | Decline routing the ~70 bare strings through `RichText` — dozens of mechanical edits four days out, and the unconditional LTR walk catches under-isolation once copy lands | A translator writes bare Latin; Thursday's walk flags it |
| 66 | **The 24-hour session** replaces twelve hours — twelve only covered the day if sign-in coincided with the first interview, so signing in at 09:30 killed it at 21:30, mid-interview | My ruling, wrong on the number |
| 67 | Fold the scoped re-review of one fix round into the final whole-branch review, naming the findings explicitly rather than running a duplicate seat | The final review reports them unverified |
| 68 | **Declined to run `git checkout CLAUDE.md`** for a subagent whose own attempt the permission system refused. Performing an action a subagent was denied is permission laundering regardless of how benign it looks | The file is left exactly as it was, for you to decide |
