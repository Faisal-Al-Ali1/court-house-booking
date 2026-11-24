# CLAUDE.md

This file guides Claude Code in this repository. It records the reasoning and the traps, not an inventory of files; read the code for what exists.

Arabic-first (RTL), bilingual interview booking portal for Court House+, a Jordanian organisation. Thirty fifteen-minute in-person interview slots on Saturday 28 November 2026, one interviewer, a public link, no applicant login. Next.js 16 App Router, Tailwind v4, next-intl v4, MongoDB (Atlas), Resend. It lives for about four days and is then shut down (see the last section). The toolchain and conventions come from the sibling projects; where this one deviates, the deviation is explained below.

Rules that apply to every change: **no code comments, ever** (a name carries the intent); **no `any`, no `@ts-ignore`**; **logical properties only** (`ms-`, `pe-`, `start-`, never `ml-`, `pr-`, `left-`); applicant-facing text goes through the message files.

## Launch state

`npm test` is correctness only and **stays green**. The launch gate is a separate command, **`npm run launch-check`** (`launch/launch-gate.test.ts`), which is **red on purpose** until the client's copy lands: it fails while any `TODO` marker or the sample English address remains in `messages/ar.json` or `messages/en.json`, and its failure message lists the keys, so the output is the to-do list. It is the launch gate, not a broken test; do not delete it, loosen it or add keys to an allow-list. It is split out because a suite that is red for days teaches everyone to ignore its output, and a real regression would hide among the expected failures. It is **not wired into `prebuild`**, deliberately: that would stop Vercel building previews while placeholders remain, and previews are how the portal is tested in that state. The client's list is `docs/client-copy-needed.md` and the manual launch steps are `docs/deploy-checklist.md`.

## The testing deviation

The sibling projects have no test runner. This one does, and that is a deliberate deviation: **`node --test` for pure functions and the repository only** (`npm test`, globs over `src/lib`, `src/repositories`, `src/core`), no Jest, no Vitest, no React Testing Library. The reason is that a double-booking is the one failure here that cannot be caught by looking at a page, and the concurrency and idempotency of the claim logic, the HMAC signing, the CSV escaping, the ICS output and the email templates are all pure or database-level and cheap to prove exhaustively. The repository tests run against a real `mongod` (`mongodb-memory-server`), including 20-way concurrent bursts.

Consequences to respect:

- **UI is not unit tested.** It is checked in a browser (the audits below). Keep components thin: logic worth testing belongs in `src/lib` or `src/core/services` as a pure function with injected dependencies (see `cancel-flow.ts`, `confirm-from-request.ts`), so `node --test` can reach it.
- Server actions are thin wrappers over those functions. A server action that cannot be tested directly gets its logic extracted, not a test harness.
- A new directory with tests must be added to the glob in `package.json`, or the tests silently never run. `launch/` is the one directory that must **not** be in that glob.
- When a fix is driven by an observed bug, write the failing test first. When a test cannot discriminate (it passes with the code broken), mutate the code and watch it fail before trusting it.

## The `.ts`-extension import rule

**Anything `node:test` can reach uses relative imports with an explicit `.ts` extension** (`import { x } from "./slots.ts"`), because Node runs the TypeScript directly and resolves neither the `@/` alias nor extensionless paths. That covers everything under `src/lib`, `src/repositories`, `src/core/services` and their transitive imports, plus the JSON imports (`with { type: "json" }`). The `@/` alias is fine everywhere else (components, routes, actions). `tsconfig.json` has `allowImportingTsExtensions` for this. A single `@/` import in a file reachable by a test makes `npm test` fail at module resolution, far from the cause; when tests fail with `ERR_MODULE_NOT_FOUND`, look for one.

## Environment: lazy reads, never at module load

**Read `process.env` inside a function, at request time, never at module load.** A module-level read becomes a Vercel *build-time* requirement (the build imports the module to collect page data), which breaks Preview builds that do not have the production secrets, and fails the build for anyone without a `.env`. This nearly shipped twice (the Mongo URI, then the session secret). The pattern is `requireEnv(name)` called from inside `getDb()`, `requireSessionSecret()`, `readMailConfig(env = process.env)`, and the interviewer password read. The mail module even has a test that importing it reads no configuration.

The check: `npm run build` in a shell with **none** of the variables set must succeed. Do it after touching anything that imports a variable. The one deliberate exception is `NEXT_PUBLIC_SITE_URL` in `src/core/constants/site.ts`: Next inlines it at build, and its fallback is `http://localhost:3000`, which would become the production `metadataBase`. Set it to the production URL before the production build; changing it needs a rebuild.

`SESSION_SECRET` is needed by far more than the booking cookie: interviewer sign-in and session checks, the calendar download and the confirmation gate all call `requireSessionSecret()`. Missing, the interviewer cannot sign in.

Runtime variables: `MONGODB_URI`, `MONGODB_DB`, `SESSION_SECRET`, `INTERVIEWER_PASSWORD`, `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_REPLY_TO`, `INTERVIEWER_EMAIL`, optional `INTERVIEWER_LOCALE`. Their meaning and the trade-offs are in `docs/deploy-checklist.md`.

## Literal invisible characters in source

Bidi marks (U+200E, U+200F, U+061C, U+202A to U+202E, U+2066 to U+2069) and the BOM (U+FEFF) must appear in source **only as escapes** (`‎`, or `String.fromCharCode`), never as the literal character. A literal one is invisible in review, survives copy-paste, and changes how neighbouring text renders. `src/lib/no-literal-bidi-controls.test.ts` walks every `.ts` and `.tsx` file under `src` and **fails the suite** on any literal one. It also asserts that the guard detects each class, so the guard cannot go vacuously green.

The trap: **editing tooling has twice converted a typed `\uXXXX` escape into the literal character on write** (an editor, then a script that built the backslash from a char code). The escape you typed is not the byte that lands on disk. So **write such files programmatically, building the escape from `String.fromCharCode(92)` or a code point, and let the guard catch any failure.** Never trust that the text you typed is the text that was saved; run `npm test` after any change that touches these characters. The CSV BOM check asserts `charCodeAt(0) === 0xFEFF` for the same reason.

## The slot config is the single source of truth, and slots are never stored

`src/core/config/event.ts` (`EVENT_CONFIG`) defines the date, the two windows (10:00 to 14:00, 16:00 to 22:00), the 15-minute interview and 5-minute gap, the time zone (`Asia/Amman`) and its fixed UTC offset. `generateSlots()` derives all thirty slots from it. **Slots are never stored in the database.** The database holds only bookings, each pointing at a slot id like `2026-11-28T11:20`. Whether a slot is free is "no active booking has this id"; whether it is past is computed from the clock. Consequences: changing a window or the date is a one-file change that needs no migration; a slot cannot be "out of sync" with the config; and the schedule's open rows are computed, not queried. Never add a slots collection, a cached slot list, or a second copy of the times (the tests were written to follow the config; a few still hardcode times and would need updating if the windows change).

The offset is a constant because Jordan stopped observing daylight saving; do not replace it with a time-zone library without a reason.

## The two partial unique indexes are the no-double-booking guarantee

There is no application-level lock, no transaction and no check-then-insert that is relied upon. The whole guarantee is two unique indexes on `bookings`, each partial on `cancelledAt: null`:

- `{ slotId: 1 }` unique where `cancelledAt` is null: one active booking per slot.
- `{ email: 1 }` unique where `cancelledAt` is null: one active booking per person.

Partial, so that a cancelled booking stays in the collection for the export while freeing both the slot and the email. The repository inserts and, on a duplicate-key error, **resolves from the data** (idempotent re-submit of the identical booking, slot taken by someone else, email already holding another slot, or a conflict that vanished and is retried) rather than inferring from the error text.

`scripts/ensure-indexes.mjs` creates them. **The runtime guard (`assertBookingsIndexes` in `src/lib/mongo.ts`) never creates them**; it verifies on first use and turns a missing, conflicting or plain-unique index into a loud failure. That is deliberate: a deployment without the indexes must fail closed, not run unprotected. Email addresses are lowercased and trimmed before the insert, so case and padding cannot dodge the email index.

## Error codes, never messages

**Only stable error codes (`BOOKING_ERROR_CODES`, the claim outcomes) travel from the repository to the UI and into logs. Never a driver or library message, never `error.message`.** A MongoDB duplicate-key message contains the offending value, which is an applicant's email address; a message that reaches a log, a response or a toast is a personal-data leak. Logs carry error names, codes and counts only (`console.error("createBooking repository failure", { code })`). The user-facing wording is chosen on the UI side by code (`booking-outcome.ts` maps code to a message key), which also makes it translatable.

## Render-by-code and the PII rules

- **Render by code.** The server returns a code or a state (`status: "success" | "invalid" | "error"`, a claim outcome); the client maps it to a translated key. No server-composed sentence is shown to a user.
- **The applicant's email, name and phone never go in a URL, a log line, an error, a toast or the client payload of the interviewer page** (rows carry name and phone only, enforced by a type; the email stays on the server). The only place the email lives besides the database is the HttpOnly booking cookie, which is signed (HMAC), not encrypted, and is only ever sent back to the same browser.
- The `?booked=` URL carries the slot id only; the confirmation is shown only when the signed cookie names a **live** booking for that slot, so a copied link shows nothing to anyone else.
- The interviewer surface is the only authenticated one and is checked in four independent places (layout, page, the cancel action, the export route), because a layout does not wrap a route handler or a server action. Every check calls the same `isSignedIn`. Unset `INTERVIEWER_PASSWORD` rejects everyone.
- **No sign-in rate limit, by design**, because on serverless an in-memory counter is close to useless and a durable one costs a collection and a write per attempt; the compensating control is a **generated, high-entropy password**. Never replace it with a memorable one. This is a judgement about a four-day site with thirty records, not a general position.
- CSV export defuses formula injection in names and wraps phone numbers as `="..."` so Excel keeps the leading `+` and `0`.
- Email failures are swallowed and logged by design, so mail can never block a booking; the interviewer is told on cancellation whether the applicant could be emailed.

## Arabic and bidi

- **Every Latin letter or digit run on an Arabic page sits inside `dir="ltr"`** through `LtrRun` (a `<span dir="ltr">`), or through `RichText`, which splits a message and wraps its runs. Times, counts, phone numbers, dates and the brand all go through one. Do not render a time or number as bare text next to Arabic: the bidi algorithm will move the punctuation to the wrong side, and it only shows with real Arabic.
- **Message strings that contain numbers use `<n>{value}</n>` tags** rendered by `RichText`, not string concatenation. An applicant name is wrapped in `<bdi>` (it may be either script); `scripts/check-ltr-runs.js` accepts `<bdi>` as isolation and reports those separately.
- A link that names the other language carries `lang` **and** `dir` of the language it names (`getLangDir`).
- **The server-action locale trap:** a server action does not reliably know the page's locale, so the form submits `locale` as a field and the action validates it with `hasLocale`, falling back to the default. Never trust the field, never skip the check.
- **The proxy matcher needs a double backslash** (`.*\\..*` inside the string literal in `src/proxy.ts`, which the regex receives as `.*\..*`). With one backslash the lookahead rejects every non-empty path: unprefixed URLs 404 instead of redirecting. Lint, types and build stay green.
- **`setRequestLocale` in every layout and every page**, or the subtree silently leaves static generation.
- The root 404 has no translation provider, so its Arabic is written in `src/app/not-found.tsx`; it needs a native speaker's review.

## Placeholders: text is loud, links are quiet

There is a deliberate asymmetry. **Placeholder text renders visibly** (`TODO-AR: ...` on the page): a visible marker is a loud reminder and a placeholder that looks like copy is the dangerous kind. **A placeholder link is suppressed**: `venue.mapUrl` renders nothing unless it is a real `http(s)` URL (`isHttpUrl`), in the screen, the email and the calendar file. A wrong link is silent and actively harmful (an applicant is sent to the wrong place with full confidence), while a missing link is only an omission. So: visible text, hidden links. The consequence is that a map link's absence is silent too, which is why the deploy checklist has an explicit step to confirm it renders once the client's URL is in. Use a `maps.app.goo.gl` short link: it avoids braces and apostrophes that break ICU message parsing.

Every pending value carries the `TODO` marker, including `venue.address` in `en.json` (which was once an unmarked, finished-looking sample and would have been read to applicants). The launch check also matches `Example Street` as a backstop.

## Audits (browser, by hand)

Three snippets in `scripts/` are evaluated in the browser console (or injected into a same-origin iframe at each width); each returns a result object and is an IIFE:

- `check-ltr-runs.js`: walks the text nodes of `html[lang="ar"] main` for `[A-Za-z0-9]` with no `dir="ltr"` (or `<bdi>`) ancestor. The list must be empty on every Arabic page. Note that while the Arabic copy is still `TODO-AR:` English, every placeholder string is correctly reported; judging the structure with stand-in Arabic filler is sound for **structure only**. The filler contains no Latin, and Latin inside plain message text ("Court House+", "CSV", a number) is exactly what real translation introduces, and `RichText` isolates only the `<n>`, `<who>` and `<call>` tags. **The real Arabic must be re-walked unconditionally when it lands**, and the Arabic emails are outside every automated check (the walk covers `html[lang="ar"] main` only), so they need a manual bidi look.
- `audit-contrast.js`: WCAG contrast for every text node, at 360, 768 and 1440 in both locales.
- `check-overflow.js`: elements that spill at 360. Titles take `hyphens-auto [overflow-wrap:anywhere]`.

Traps, all of which have cost time:

- **Normalise computed colours through a canvas, never a regex.** Chrome returns `lab()`, `oklab()` and `color-mix()` results from `getComputedStyle`; parsing those as RGB makes every figure garbage. Assign the colour to a canvas `fillStyle`, `fillRect` one pixel and read it back (and fail loudly if `fillStyle` did not change, because an unparsed colour is silently ignored). This was got wrong twice in the sibling project.
- **Foreground the tab before measuring anything.** React's streaming reveal runs inside `requestAnimationFrame`, which Chrome pauses while a tab is hidden, so a backgrounded tab (or a hidden browser pane) reports an empty page or two `<main>` elements, and the page is not broken. Also wait for `readyState === "complete"`, for fonts and for image decode.
- A same-origin iframe is the cheap way to measure widths: one page, many widths, shared cookies. The document's vertical scrollbar takes 15px of an iframe's width; compare against `innerWidth`, not `clientWidth`, in RTL.
- Contrast and overflow are checked at 360, 768 and 1440; an audit at one width proves nothing about the others.
- Colours are defined only in `src/app/tailwind.css`; `scripts/solve-tokens.mjs` prints the values that were hand-copied into it, and nothing checks the two agree.

## Shutdown obligation

This portal collects applicants' names, emails and phone numbers for one four-day event and **must not outlive its purpose**. After the event: export the CSV from the interviewer page, and take a database export from Atlas; hand **both** to Court House+ (the data goes to the client, not to us); then, on a date agreed **in writing before launch** (recorded in `docs/deploy-checklist.md`), **delete the Atlas cluster and the Vercel project**, revoke the Resend key, and discard the secrets. The interviewer session runs for twelve hours from sign-in independent of the event date, precisely so the export still works after the event. Deleting the data is the obligation; the only copies that remain are the two the client holds.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
