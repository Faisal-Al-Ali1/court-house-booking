# Court House+ Booking Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A bilingual portal where prospective Court House+ organisers give their name, email and phone, book one of 30 interview slots on Saturday 28 November 2026, and receive a confirmation — plus a password-gated view where the interviewer sees the day and exports it.

**Architecture:** One Next.js 16 App Router application, Arabic-first, deployed to Vercel with MongoDB Atlas. Slots are derived in code from a single config object and never stored; a `bookings` collection with two partial unique indexes makes double-booking and multi-booking impossible at the database level. Data access goes through the house repository shape (`bookings_repo` / `bookings_impl` / `Result<T>`) with a Mongo implementation in place of the usual HTTP client.

**Tech Stack:** Next.js 16.1.6, React 19.2.3, TypeScript 5, Tailwind v4.1.14, next-intl 4.6.1, Zod 4.3.6, `rtl-detect`, `mongodb` driver, `resend`, Cairo and Livvic via `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-11-24-booking-portal-design.md`

**Project directory:** `C:\Users\user\Desktop\Projects\court-house-booking`

---

## Global Constraints

Every task's requirements implicitly include this section.

- **Read `node_modules/next/dist/docs/` before writing App Router code.** Next.js 16 departs from older conventions; the `AGENTS.md` block in the sibling projects says so explicitly.
- **Governing conventions:** `C:\Users\user\Desktop\Projects\aldallah-group-landingpage\CLAUDE.md`. Read it before Task 1.
- **No code comments, ever.** Anything learned goes in this project's own `CLAUDE.md`.
- **No `any`, no `@ts-ignore`, no `React.FC`.**
- **Server Components by default**, `"use client"` on leaves only.
- **Logical properties only** (`ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`), never `left`/`right`.
- **Naming:** files and folders `kebab-case`, components `PascalCase`, functions `camelCase`, frozen lookups `SCREAMING_SNAKE_CASE`. Repositories keep snake_case suffixes (`bookings_repo.ts`, `bookings_impl.ts`). Prop types in `types/<component>-props.ts`.
- **Locales:** `["ar", "en"]`, `defaultLocale: "ar"`.
- **Brand colours, exact:** red `#A32731`, charcoal `#3F3F3D`, white `#FFFFFF`.
- **Fonts:** Livvic for English, Cairo for Arabic. **Livvic must never appear in an Arabic page's font stack, in any position.** `adjustFontFallback: false` with explicit `Segoe UI`, `Tahoma`, `system-ui` fallbacks.
- **Red text on charcoal is banned** (1.45:1). Red on white and white on red are both 7.26:1 and fine.
- **Opacity is never a text colour.** Disabled and taken states use solved tokens.
- **Every Latin or numeric run on an Arabic page is wrapped in `LtrRun`** — times, dates, counts, phone numbers, addresses. No case-by-case judgement.
- **`setRequestLocale` in every layout and every page.**
- **Event config, exact:** date `2026-11-28`, timezone `Asia/Amman`, windows `10:00–14:00` and `16:00–22:00`, interview 15 minutes, gap 5 minutes. This yields 30 slots and must.
- **Short name is `Court House+`** for tab titles and email sender display name.

### Testing deviation, flagged deliberately

The sibling projects have **no test runner, by design** — they are marketing sites whose verification is `npm run gitcheck` plus browser audits. That reasoning does not transfer here: this project has real logic in slot derivation, timezone handling and concurrency, where a silent off-by-one costs an interview slot.

This plan therefore adds **`node --test`** — built into Node, zero new dependencies — for pure functions only (`src/lib/slots.ts`, `src/lib/format-time.ts`, `src/lib/ics.ts`, `src/lib/csv.ts`). Everything else is verified the house way: `npm run gitcheck`, the contrast audit, the LTR-run walk, and provoked concurrency against the deployed instance. Record this deviation in the project's `CLAUDE.md`.

---

## Review Focus

Five things the spec implies, that no task's happy path exercises, and that will bite a real person. Each has a test added to the task that owns the code.

1. **Arabic-Indic digits in the phone field.** An applicant on an Arabic page with an Arabic keyboard types `٠٧٩١٢٣٤٥٦٧`. It passes a 7–24 character length check and leaves the interviewer with a number they cannot dial. → Task 5 normalises Arabic-Indic and Eastern Arabic-Indic digits to ASCII before validation.
2. **A past slot booked on the day.** If the availability cut-off is computed client-side or forgotten, someone opening the portal at 3 PM Saturday books the 10 AM slot. → Task 2 and Task 4.
3. **Double-tap on Confirm.** A slow connection on a phone invites a second tap. The second request hits the unique email index and tells the person who just succeeded that they already have a booking. → Task 6 disables the control on submit; Task 5 treats an email collision whose existing booking matches the submitted slot as success, not error.
4. **A visitor in another timezone.** Times must render from the fixed config server-side, never from `Date` in the browser. A Gulf or European applicant must see Amman times. → Task 2.
5. **Arabic text in the `.ics` file.** Unfolded long lines, missing `CHARSET`, or unescaped commas in the venue address make the calendar file fail to import silently. → Task 7.

---

## File Structure

| File | Responsibility |
| ---- | -------------- |
| `src/core/config/event.ts` | The slot grid config. Single source of truth for date, timezone, windows, durations |
| `src/core/config/fonts.ts` | Cairo and Livvic declarations |
| `src/core/i18n/{routing,request,navigation}.ts` | next-intl wiring |
| `src/core/types/results/{results,failures}.ts` | `Result<T>`, `isSuccess`, `isFailure` |
| `src/lib/slots.ts` | Pure slot derivation and availability |
| `src/lib/format-time.ts` | Pure 12-hour formatting with locale meridiem |
| `src/lib/split-ltr-runs.ts` | Pure Latin/numeric run splitting |
| `src/lib/normalise-digits.ts` | Pure Arabic-Indic → ASCII digit mapping |
| `src/lib/ics.ts` | Pure calendar file generation |
| `src/lib/csv.ts` | Pure CSV generation with BOM |
| `src/lib/mongo.ts` | Cached `MongoClient` promise |
| `src/core/new-components/common/ltr-run.tsx` | `LtrRun`, `RichText` |
| `src/repositories/bookings/*` | Data access, house shape |
| `src/core/services/email/*` | Resend client and three templates |
| `src/app/[locale]/page.tsx` + `page-client.tsx` | Apply and pick, two steps |
| `src/app/[locale]/interviewer/*` | Gated schedule view |
| `messages/{ar,en}.json` | All copy |

---

## Task 1: Scaffold, i18n, fonts and colour tokens

**Files:**
- Create: the project at `court-house-booking` via `create-next-app`
- Create: `src/core/i18n/routing.ts`, `request.ts`, `navigation.ts`
- Create: `proxy.ts`, `src/app/[locale]/layout.tsx`, `src/app/not-found.tsx`, `src/app/tailwind.css`
- Create: `src/core/config/fonts.ts`, `src/core/constants/site.ts`
- Create: `scripts/solve-tokens.mjs`
- Create: `messages/ar.json`, `messages/en.json` with a `common` namespace

**Interfaces:**
- Produces: `routing` (locales `["ar","en"]`, default `"ar"`), `Locale` type, `cairo` and `livvic` font objects, the full token set in `tailwind.css`

- [ ] **Step 1: Read the governing conventions**

Read `C:\Users\user\Desktop\Projects\aldallah-group-landingpage\CLAUDE.md` in full, and `node_modules/next/dist/docs/` for App Router specifics once the project exists.

- [ ] **Step 2: Scaffold and pin versions**

`create-next-app` with TypeScript, Tailwind, App Router, `src/` directory. Then pin exactly: `next@16.1.6`, `react@19.2.3`, `react-dom@19.2.3`, `next-intl@4.6.1`, `tailwindcss@4.1.14`, `zod@4.3.6`, plus `rtl-detect`, `mongodb`, `resend`.

- [ ] **Step 3: Wire next-intl**

`routing.ts` exports `defineRouting({ locales: ["ar","en"], defaultLocale: "ar" })` and `type Locale`. Copy `request.ts`, `navigation.ts` and `proxy.ts` from `aldallah-group-landingpage`.

**The proxy matcher needs the double backslash** (`.*\\..*`). A single one collapses to `.` and rejects every non-empty path; lint, types and build all stay green while `/apply` 404s.

- [ ] **Step 4: Verify the proxy by testing a path, not the source**

Run: `npm run dev`, then `curl -sI http://localhost:3000/interviewer`
Expected: `307` to `/ar/interviewer`. A `404` means the matcher collapsed.

- [ ] **Step 5: Declare the fonts**

`src/core/config/fonts.ts` exports `cairo` (subsets `["arabic","latin"]`, variable weight, `--font-cairo`) and `livvic` (subsets `["latin"]`, weights `["400","500","700"]`, `--font-livvic`). Both take `adjustFontFallback: false` and the explicit `Segoe UI`, `Tahoma`, `system-ui`, `sans-serif` fallback.

In `[locale]/layout.tsx`, apply `dir` from `getLangDir(locale)` and select the family by locale: Cairo alone for `ar`, Livvic with Cairo beneath it for `en`. **Livvic must not be in the `ar` stack at all.**

- [ ] **Step 6: Solve the colour tokens**

Port `scripts/solve-tokens.mjs` from the Al-Dallah project. Derive and emit, as Tailwind v4 `@theme` tokens:

| Token | Anchored on | Required ratio |
| ----- | ----------- | -------------- |
| `--color-ground` | `#FFFFFF` | — |
| `--color-ground-raised` | light grey card surface | — |
| `--color-ink` | `#3F3F3D` | ≥ 10:1 on `ground-raised` |
| `--color-ink-muted` | derived from charcoal | ≥ 4.5:1 on `ground-raised` |
| `--color-accent` | `#A32731` | ≥ 4.5:1 on `ground` (measures 7.26:1) |
| `--color-accent-ink` | `#FFFFFF` | ≥ 4.5:1 on `accent` (measures 7.26:1) |
| `--color-rule` | decorative hairline | no text |
| `--color-rule-strong` | control edges | ≥ 3:1 on `ground` |
| `--color-slot-taken-surface` | derived | — |
| `--color-slot-taken-ink` | derived | ≥ 4.5:1 on `slot-taken-surface` |

A value that must change per element goes in an `@utility` rule, never through a `:root` theme token — `@theme` declares on `:root`, so a `var()` inside one resolves against `:root`.

- [ ] **Step 7: Verify the shell**

Run: `npm run build && npx next start -p 3100`, then open `/ar` and `/en`.
Expected: Arabic renders RTL in Cairo, English LTR in Livvic, both with a white ground. Route table shows `●` for both locales.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold bilingual Next.js app with brand tokens"
```

---

## Task 2: The slot grid

**Files:**
- Create: `src/core/config/event.ts`, `src/lib/slots.ts`, `src/lib/format-time.ts`
- Test: `src/lib/slots.test.ts`, `src/lib/format-time.test.ts`

**Interfaces:**
- Produces:
  - `EVENT_CONFIG` — frozen object with `date: "2026-11-28"`, `timeZone: "Asia/Amman"`, `utcOffsetMinutes: 180`, `windows: [["10:00","14:00"],["16:00","22:00"]]`, `interviewMinutes: 15`, `gapMinutes: 5`
  - `type Slot = { id: string; startMinutes: number }` where `id` is `"2026-11-28T10:00"`
  - `generateSlots(): readonly Slot[]`
  - `isValidSlotId(id: string): boolean`
  - `slotStartUtc(slot: Slot): Date`
  - `isSlotPast(slot: Slot, now: Date): boolean`
  - `formatSlotTime(slot: Slot, locale: Locale): string`

- [ ] **Step 1: Write the failing tests for slot generation**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

test("generates exactly 30 slots", () => {
  assert.equal(generateSlots().length, 30);
});

test("morning window runs 10:00 to 13:40 inclusive", () => {
  const morning = generateSlots().filter((s) => s.startMinutes < 14 * 60);
  assert.equal(morning.length, 12);
  assert.equal(morning[0].id, "2026-11-28T10:00");
  assert.equal(morning[11].id, "2026-11-28T13:40");
});

test("no slot starts during the break", () => {
  const inBreak = generateSlots().filter(
    (s) => s.startMinutes >= 14 * 60 && s.startMinutes < 16 * 60,
  );
  assert.equal(inBreak.length, 0);
});

test("evening window runs 16:00 to 21:40 inclusive", () => {
  const evening = generateSlots().filter((s) => s.startMinutes >= 16 * 60);
  assert.equal(evening.length, 18);
  assert.equal(evening[17].id, "2026-11-28T21:40");
});

test("every interview finishes inside its window", () => {
  for (const slot of generateSlots()) {
    const end = slot.startMinutes + EVENT_CONFIG.interviewMinutes;
    assert.ok(end <= 14 * 60 || (slot.startMinutes >= 16 * 60 && end <= 22 * 60));
  }
});

test("slot ids round-trip through validation", () => {
  assert.ok(isValidSlotId("2026-11-28T10:00"));
  assert.ok(!isValidSlotId("2026-11-28T14:00"));
  assert.ok(!isValidSlotId("2026-11-28T10:01"));
  assert.ok(!isValidSlotId("nonsense"));
});

test("start times convert to UTC at a fixed +03:00", () => {
  const [first] = generateSlots();
  assert.equal(slotStartUtc(first).toISOString(), "2026-11-28T07:00:00.000Z");
});

test("a slot is past only when Amman wall-clock has gone by", () => {
  const [first] = generateSlots();
  assert.ok(isSlotPast(first, new Date("2026-11-28T08:00:00.000Z")));
  assert.ok(!isSlotPast(first, new Date("2026-11-28T06:00:00.000Z")));
});
```

- [ ] **Step 2: Write the failing tests for time formatting**

```ts
test("formats 12-hour times with Western digits", () => {
  const [first] = generateSlots();
  assert.equal(formatSlotTime(first, "en"), "10:00 AM");
  assert.equal(formatSlotTime(first, "ar"), "10:00 ص");
});

test("afternoon and evening take the PM marker", () => {
  const slots = generateSlots();
  const oneForty = slots.find((s) => s.id === "2026-11-28T13:40");
  const nineForty = slots.find((s) => s.id === "2026-11-28T21:40");
  assert.equal(formatSlotTime(oneForty, "en"), "1:40 PM");
  assert.equal(formatSlotTime(nineForty, "ar"), "9:40 م");
});

test("noon and midnight boundaries read as 12, not 0", () => {
  const noon = generateSlots().find((s) => s.id === "2026-11-28T12:00");
  assert.equal(formatSlotTime(noon, "en"), "12:00 PM");
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `node --test src/lib/`
Expected: FAIL, `generateSlots is not defined`.

- [ ] **Step 4: Implement `EVENT_CONFIG`, `generateSlots`, `isValidSlotId`, `slotStartUtc`, `isSlotPast` in `src/lib/slots.ts`**

Generation steps by `interviewMinutes + gapMinutes` from each window start and keeps a slot only while `start + interviewMinutes <= windowEnd`. `isValidSlotId` compares against the generated set rather than parsing — the generated list is the authority. `isSlotPast` compares against `slotStartUtc`, so it is correct whatever timezone the server runs in.

- [ ] **Step 5: Implement `formatSlotTime` in `src/lib/format-time.ts`**

Western digits in both locales; meridiem is `AM`/`PM` for `en` and `ص`/`م` for `ar`. Derive from `startMinutes` arithmetic, not from `Intl.DateTimeFormat` with a runtime timezone — the point is that output does not depend on where this runs.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node --test src/lib/`
Expected: PASS, 11 tests.

- [ ] **Step 7: Add the test script and commit**

Add `"test": "node --test src/lib/"` to `package.json` scripts.

```bash
git add -A
git commit -m "feat: derive the 30-slot interview grid from config"
```

---

## Task 3: LTR isolation primitives

**Files:**
- Create: `src/lib/split-ltr-runs.ts`, `src/core/new-components/common/ltr-run.tsx`
- Test: `src/lib/split-ltr-runs.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `splitLtrRuns(text: string): readonly { text: string; isLtr: boolean }[]`, `<LtrRun>{children}</LtrRun>`, `<RichText>{string}</RichText>`

This task exists because this interface is almost entirely numbers. Treat it as load-bearing, not as a utility.

- [ ] **Step 1: Write the failing tests**

```ts
test("splits Latin and numeric runs out of Arabic text", () => {
  const runs = splitLtrRuns("الموعد 10:00 ص");
  assert.deepEqual(runs.map((r) => r.isLtr), [false, true, false]);
  assert.equal(runs[1].text, "10:00");
});

test("treats a phone number as a single run", () => {
  const runs = splitLtrRuns("هاتف 079 123 4567");
  assert.equal(runs.filter((r) => r.isLtr).length, 1);
  assert.equal(runs.find((r) => r.isLtr).text, "079 123 4567");
});

test("leaves pure Arabic untouched", () => {
  const runs = splitLtrRuns("مرحبا بك");
  assert.deepEqual(runs, [{ text: "مرحبا بك", isLtr: false }]);
});

test("leaves pure Latin as one run", () => {
  assert.deepEqual(splitLtrRuns("Court House+"), [
    { text: "Court House+", isLtr: true },
  ]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test src/lib/split-ltr-runs.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `splitLtrRuns`**

Port from `aldallah-group-landingpage/src/lib/split-ltr-runs.ts`. Internal whitespace between Latin or numeric tokens belongs inside the run, so `079 123 4567` stays whole.

- [ ] **Step 4: Implement `LtrRun` and `RichText`**

`LtrRun` renders a `<span dir="ltr">`. `RichText` runs `splitLtrRuns` over a string and wraps each LTR run in `LtrRun`.

The Arabic letter-spacing reset is scoped `html[lang="ar"] *:not([dir="ltr"]):not([dir="ltr"] *)` in `tailwind.css`, so explicit LTR runs keep their tracking. **Arabic is a connected script and never takes letter-spacing.**

- [ ] **Step 5: Run the tests and the build**

Run: `node --test src/lib/ && npm run build`
Expected: PASS, clean build.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add LTR run isolation for numbers in Arabic text"
```

---

## Task 4: Mongo connection and the bookings repository

**Files:**
- Create: `src/lib/mongo.ts`
- Create: `src/repositories/bookings/{bookings_repo.ts,bookings_impl.ts,types.ts,index.ts}`
- Create: `src/core/types/results/{results.ts,failures.ts}`
- Create: `scripts/ensure-indexes.mjs`

**Interfaces:**
- Consumes: `Slot`, `generateSlots`, `isSlotPast` from Task 2
- Produces:
  - `type Booking = { slotId: string; name: string; email: string; phone: string; locale: Locale; createdAt: Date; cancelledAt: Date | null }`
  - `type SlotClaim = "created" | "slot-taken" | "already-booked" | "idempotent"`
  - `bookingsRepo.create(booking): Promise<Result<SlotClaim>>`
  - `bookingsRepo.listActive(): Promise<Result<Booking[]>>`
  - `bookingsRepo.listAll(): Promise<Result<Booking[]>>`
  - `bookingsRepo.cancel(slotId: string): Promise<Result<null>>`
  - `bookingsRepo.takenSlotIds(): Promise<Result<string[]>>`
  - `Result<T>`, `isSuccess`, `isFailure` copied verbatim from the Al-Dallah project

- [ ] **Step 1: Copy the Result types**

Copy `src/core/types/results/` from `aldallah-group-landingpage` unchanged. The repository contract across these projects depends on it being identical.

- [ ] **Step 2: Implement the cached client in `src/lib/mongo.ts`**

Export `getDb(): Promise<Db>`. Cache the `MongoClient` promise on `globalThis` so serverless invocations reuse one pool — without this, Vercel opens a connection per request and exhausts the M0 cluster. Read `MONGODB_URI` and `MONGODB_DB` from the environment and throw at module load if either is missing.

- [ ] **Step 3: Write the index script**

`scripts/ensure-indexes.mjs` creates both indexes on `bookings`:

```js
await bookings.createIndex(
  { slotId: 1 },
  { unique: true, partialFilterExpression: { cancelledAt: null } },
);
await bookings.createIndex(
  { email: 1 },
  { unique: true, partialFilterExpression: { cancelledAt: null } },
);
```

The partial filter is what lets a cancelled booking release both its slot and its email while the row survives.

- [ ] **Step 4: Implement `BookingsImpl`**

`create` inserts and catches duplicate-key errors (`code === 11000`), reading `error.keyPattern` to decide the outcome:

- `keyPattern.slotId` → `"slot-taken"`
- `keyPattern.email` → look up the existing active booking; if its `slotId` equals the submitted one, return `"idempotent"`, otherwise `"already-booked"`

That `"idempotent"` branch is Review Focus item 3: a double-tap must not tell the person who just succeeded that they failed.

`create` also rejects a `slotId` that fails `isValidSlotId` or that `isSlotPast` reports as gone, both as failures — Review Focus item 2, enforced server-side where a client cannot skip it.

`cancel` sets `cancelledAt` rather than deleting.

- [ ] **Step 5: Verify against a real cluster**

Run `node scripts/ensure-indexes.mjs` against the Atlas cluster, then from a scratch script: insert a booking, insert the same slot again, insert the same email against a different slot, insert the same email against the same slot, cancel, re-insert the freed slot.
Expected: `created`, `slot-taken`, `already-booked`, `idempotent`, then a successful re-insert after cancellation.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add bookings repository with partial unique indexes"
```

---

## Task 5: Booking schema and the create action

**Files:**
- Create: `src/lib/normalise-digits.ts`
- Create: `src/app/[locale]/schemas/booking-schema.ts`, `src/app/[locale]/actions/create-booking.ts`
- Create: `src/app/[locale]/types/booking-action-state.ts`, `src/app/[locale]/utils/parse-form-errors.ts`
- Modify: `messages/ar.json`, `messages/en.json` — add a `booking.errors` namespace
- Test: `src/lib/normalise-digits.test.ts`

**Interfaces:**
- Consumes: `bookingsRepo` and `SlotClaim` from Task 4, `isValidSlotId` from Task 2
- Produces:
  - `bookingSchema` — Zod object carrying translation keys as messages
  - `type BookingActionState = { status: "idle" | "invalid" | "error" | "success"; errors?: Record<string,string>; message?: string; slotId?: string }`
  - `createBooking(prev: BookingActionState, formData: FormData): Promise<BookingActionState>`

- [ ] **Step 1: Write the failing digit-normalisation tests**

```ts
test("maps Arabic-Indic digits to ASCII", () => {
  assert.equal(normaliseDigits("٠٧٩١٢٣٤٥٦٧"), "0791234567");
});

test("maps Eastern Arabic-Indic digits to ASCII", () => {
  assert.equal(normaliseDigits("۰۷۹۱۲۳۴۵۶۷"), "0791234567");
});

test("leaves ASCII digits and separators alone", () => {
  assert.equal(normaliseDigits("079 123 4567"), "079 123 4567");
});
```

- [ ] **Step 2: Run to verify failure, then implement `normaliseDigits(input: string): string`**

Run: `node --test src/lib/normalise-digits.test.ts` → FAIL, then implement, then PASS.

This is Review Focus item 1. An Arabic keyboard produces `٠٧٩…`, which passes a length check and leaves the interviewer unable to dial.

- [ ] **Step 3: Write `bookingSchema`**

Mirror the house pattern in `aldallah-group-landingpage/.../enquiry-schema.ts`: **error messages are translation keys, not sentences.**

```ts
export const bookingSchema = z.object({
  name: z.string().trim().min(2, "nameRequired").max(120, "nameTooLong"),
  email: z.email("emailInvalid").transform((v) => v.trim().toLowerCase()),
  phone: z
    .string()
    .transform(normaliseDigits)
    .pipe(z.string().trim().min(7, "phoneRequired").max(24, "phoneTooLong")),
  slotId: z.string().refine(isValidSlotId, "slotInvalid"),
  consent: z.literal("on", { error: "consentRequired" }),
});
```

- [ ] **Step 4: Implement `createBooking`**

Follow `send-enquiry.ts` exactly in shape. **Read a hidden `locale` field from the FormData and validate it against `routing.locales`** — server actions do not receive the `[locale]` param, and `getTranslations()` without an explicit locale falls back to `ar` and answers an English form in Arabic.

Map the `SlotClaim` outcomes to state: `"created"` and `"idempotent"` → `success` carrying `slotId`; `"slot-taken"` → `error` with `booking.errors.slotTaken`; `"already-booked"` → `error` with `booking.errors.alreadyBooked`.

No email is sent yet — Task 8 wires the sender into this action once it exists.

- [ ] **Step 5: Add both message files' `booking.errors` keys**

Keys: `nameRequired`, `nameTooLong`, `emailInvalid`, `phoneRequired`, `phoneTooLong`, `slotInvalid`, `consentRequired`, `slotTaken`, `alreadyBooked`, `unexpected`. English wording is the developer's; **Arabic wording comes from the client** and is placeholdered until it arrives.

- [ ] **Step 6: Verify and commit**

Run: `npm run lint && npm run build`

```bash
git add -A
git commit -m "feat: add booking validation and create action"
```

---

## Task 6: The apply and pick flow

**Files:**
- Create: `src/app/[locale]/page.tsx`, `page-client.tsx`, `loading.tsx`
- Create: `src/app/[locale]/components/{applicant-form,slot-grid,slot-button,fully-booked,index}.tsx`
- Create: `src/app/[locale]/types/{applicant-form-props,slot-grid-props}.ts`
- Modify: `messages/{ar,en}.json` — `booking` namespace

**Interfaces:**
- Consumes: `createBooking`, `BookingActionState` (Task 5), `generateSlots`, `formatSlotTime`, `isSlotPast` (Task 2), `bookingsRepo.takenSlotIds` (Task 4), `LtrRun` (Task 3)
- Produces: the booking journey; sets `?step=slot` and `?booked=<slotId>` in the URL

- [ ] **Step 1: Server page fetches availability**

`page.tsx` calls `setRequestLocale`, reads `takenSlotIds()` and the current Amman time, and passes `generateSlots()` with `taken` and `past` flags to `page-client.tsx`. **Availability is computed on the server.** Review Focus item 4: nothing about which slots exist or what they are called may come from the browser's clock.

- [ ] **Step 2: Build `ApplicantForm`**

Name, email, phone, and the consent checkbox carrying the data-protection notice. A hidden `locale` input. Values held in component state with a `sessionStorage` mirror so a refresh does not lose typing.

Advancing to step two is client-side only and writes nothing.

- [ ] **Step 3: Build `SlotGrid`**

Morning and evening groups with a labelled divider reading `2:00 – 4:00 PM` / `٢:٠٠ – ٤:٠٠ م` in place of a gap, so the two-hour hole reads as deliberate.

Each slot button renders its time through `LtrRun`. Four states — available, selected, taken, past — drawn with the solved tokens from Task 1. **A taken slot stays readable: no `opacity-50`.**

When every slot is taken or past, render `FullyBooked` instead of the grid.

- [ ] **Step 4: Wire submission through `startTransition`**

`onSubmit` prevents the default, builds `FormData` by hand and calls `formAction` inside `startTransition`; reset only on success. Keep `action={formAction}` for the no-JavaScript path.

**React 19 resets an uncontrolled form after every server action, including one returning validation errors.** This cost the Al-Dallah enquiry form all nine fields and its attachment.

Disable the confirm control while the transition is pending — Review Focus item 3, the client half of it.

- [ ] **Step 5: Handle a lost race**

On `slotTaken`, re-fetch availability via `router.refresh()`, keep the applicant's details, and show the message with the newly-taken slot now marked. The person should never have to retype anything.

- [ ] **Step 6: Verify the whole journey**

Run: `npm run build && npx next start -p 3100`. In both locales: complete a booking; submit with an empty name and confirm the other fields survive; book the same slot from two browsers; disable JavaScript and submit.
Expected: booking succeeds, fields survive validation errors, the second browser gets the taken message, the no-JS path still books.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add applicant form and slot picker"
```

---

## Task 7: Confirmation and calendar file

**Files:**
- Create: `src/lib/ics.ts`, `src/app/[locale]/components/confirmation.tsx`
- Create: `src/app/[locale]/api/ics/[slotId]/route.ts`
- Modify: `messages/{ar,en}.json` — `venue` and `confirmation` namespaces
- Test: `src/lib/ics.test.ts`

**Interfaces:**
- Consumes: `Slot`, `slotStartUtc`, `formatSlotTime` (Task 2), `LtrRun` (Task 3)
- Produces: `buildIcs(input: { slotId: string; summary: string; location: string; locale: Locale }): string`

- [ ] **Step 1: Write the failing `.ics` tests**

```ts
test("emits a valid VEVENT with UTC times", () => {
  const ics = buildIcs({ slotId: "2026-11-28T10:00", summary: "Interview", location: "Amman", locale: "en" });
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART:20261128T070000Z/);
  assert.match(ics, /DTEND:20261128T071500Z/);
});

test("escapes commas and semicolons in the location", () => {
  const ics = buildIcs({ slotId: "2026-11-28T10:00", summary: "Interview", location: "Queen Rania St, Amman", locale: "en" });
  assert.match(ics, /LOCATION:Queen Rania St\\, Amman/);
});

test("folds lines longer than 75 octets", () => {
  const ics = buildIcs({ slotId: "2026-11-28T10:00", summary: "Interview", location: "ش".repeat(120), locale: "ar" });
  for (const line of ics.split("\r\n")) {
    assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  }
});

test("uses CRLF line endings throughout", () => {
  const ics = buildIcs({ slotId: "2026-11-28T10:00", summary: "مقابلة", location: "عمّان", locale: "ar" });
  assert.ok(!/[^\r]\n/.test(ics));
});
```

This is Review Focus item 5. Arabic is multi-byte, so a 75-character line can be 150 octets; unfolded lines make the file fail to import with no error anyone sees.

- [ ] **Step 2: Run to verify failure, implement `buildIcs`, run to verify pass**

Run: `node --test src/lib/ics.test.ts`

Fold on octets, not characters, and never split a multi-byte sequence.

- [ ] **Step 3: Build the confirmation view**

Applicant name, the date, the time via `LtrRun`, the 15-minute duration, **the venue address and a map link**, and a download button hitting the `.ics` route. Prominent enough to screenshot — this is the authoritative confirmation, not the email.

Venue strings live in `messages/{ar,en}.json` under `venue`; the map URL is a constant. The address renders through `RichText`, since building numbers and postal codes are numeric runs.

- [ ] **Step 4: Verify in both locales and commit**

Download the file in each locale and import it into a real calendar app.
Expected: correct date, 10:00–10:15 Amman, venue intact, Arabic legible.

```bash
git add -A
git commit -m "feat: add confirmation screen and calendar download"
```

---

## Task 8: Email

**Files:**
- Create: `src/core/services/email/{client.ts,send-booking-emails.ts,templates/*.tsx,index.ts}`
- Modify: `src/app/[locale]/actions/create-booking.ts` — call the sender
- Modify: `messages/{ar,en}.json` — `email` namespace

**Interfaces:**
- Consumes: `Slot`, `formatSlotTime` (Task 2), `buildIcs` (Task 7)
- Produces: `sendBookingConfirmation`, `sendInterviewerNotification`, `sendCancellation` — all returning `Promise<void>` and never throwing

- [ ] **Step 1: Wrap the Resend client**

Read `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_REPLY_TO`, `INTERVIEWER_EMAIL` from the environment. **Display name is `Court House+`** even though the domain is the developer's, and **`Reply-To` is the Court House+ address** so replies reach the organisation. Applicants apply to Court House+ and receive mail from another domain; without these two headers it reads as phishing.

- [ ] **Step 2: Write the three templates**

Confirmation to the applicant, in their locale, carrying the same facts as the confirmation screen plus the venue, with the `.ics` attached. Notification to the interviewer. Cancellation to the applicant when a slot is freed.

Arabic copy comes from the client; placeholder until it arrives.

- [ ] **Step 3: Make failure harmless**

Every send is wrapped so a rejection is logged and swallowed. **A failed send never changes a booking's outcome.** Verify by setting `RESEND_API_KEY` to a bad value and completing a booking.
Expected: booking succeeds, confirmation screen renders, error appears in the log only.

- [ ] **Step 4: Publish SPF and DKIM**

Add the Resend records to the sending domain's DNS. The developer holds this DNS, so it is a task rather than a dependency — but verification can take most of a day, so do it before the rest of Task 8.

- [ ] **Step 5: Verify deliverability and commit**

Send to a Gmail and an Outlook address.
Expected: inbox, not spam; sender reads `Court House+`; replying addresses the Court House+ address.

```bash
git add -A
git commit -m "feat: add booking, notification and cancellation emails"
```

---

## Task 9: The interviewer view

**Files:**
- Create: `src/app/[locale]/interviewer/{layout.tsx,page.tsx,page-client.tsx,loading.tsx}`
- Create: `src/app/[locale]/interviewer/actions/{sign-in.ts,cancel-booking.ts}`
- Create: `src/app/[locale]/interviewer/components/{sign-in-form,schedule-table,cancel-confirm,index}.tsx`
- Create: `src/app/[locale]/interviewer/api/export/route.ts`, `src/lib/csv.ts`
- Test: `src/lib/csv.test.ts`

**Interfaces:**
- Consumes: `bookingsRepo` (Task 4), `generateSlots`, `formatSlotTime` (Task 2), `LtrRun` (Task 3), `sendCancellation` (Task 8)
- Produces: `toCsv(bookings: Booking[]): string`

- [ ] **Step 1: Write the failing CSV tests**

```ts
test("prefixes a UTF-8 BOM so Excel reads Arabic", () => {
  assert.ok(toCsv([]).startsWith("\uFEFF"));
});

test("quotes fields containing commas", () => {
  const csv = toCsv([{ ...base, name: "Haddad, Layla" }]);
  assert.match(csv, /"Haddad, Layla"/);
});

test("marks cancelled bookings rather than omitting them", () => {
  const csv = toCsv([{ ...base, cancelledAt: new Date("2026-11-27T10:00:00Z") }]);
  assert.match(csv, /cancelled/);
  assert.equal(csv.trim().split("\n").length, 2);
});
```

Without the BOM, Excel renders Arabic names as mojibake — and the export is how the data outlives the portal.

- [ ] **Step 2: Run to verify failure, implement `toCsv`, run to verify pass**

Columns: slot time, name, email, phone, locale, booked at, status.

- [ ] **Step 3: Gate the route in the layout**

`interviewer/layout.tsx` checks a signed `httpOnly` cookie and renders the sign-in form when it is absent. `sign-in.ts` compares the submitted password with `INTERVIEWER_PASSWORD` using `crypto.timingSafeEqual` and sets the cookie, HMAC-signed with `SESSION_SECRET`, expiring after the event.

**The guard goes here, not in the next-intl proxy.** The proxy matcher is where this codebase has been bitten before, and that failure stays green through lint, types and build.

- [ ] **Step 4: Build the schedule table**

Every slot in order, booked or open, with the break as a labelled divider. A `22 of 30 booked` counter. Every time, count and phone number through `LtrRun`. Export button hitting the CSV route.

- [ ] **Step 5: Build cancellation**

`⨯` opens a confirmation naming the applicant. On confirm, `cancel-booking.ts` sets `cancelledAt` and calls `sendCancellation`. The slot returns to the grid immediately.

- [ ] **Step 6: Verify and commit**

Wrong password rejected; right password admits; cancel frees the slot and emails the applicant; the cancelled row still appears in the export marked cancelled; the CSV opens in Excel with Arabic names intact.

```bash
git add -A
git commit -m "feat: add gated interviewer schedule with export"
```

---

## Task 10: Launch readiness

**Files:**
- Create: `CLAUDE.md` for this project, `README.md`
- Create: `scripts/audit-contrast.js`, `scripts/check-ltr-runs.js`

- [ ] **Step 1: Run the project gate**

Run: `npm run lint && npm run build && npm run test`
Expected: clean.

- [ ] **Step 2: Walk the Arabic pages for unisolated runs**

Port `check-ltr-runs.js`: walk the text nodes of `html[lang="ar"] main` for `[A-Za-z0-9]` with no `dir="ltr"` ancestor.
Expected: empty list, on every page including the confirmation and the interviewer table.

Wait for `readyState === "complete"` and decode images before measuring — and foreground the tab. A backgrounded tab pauses `requestAnimationFrame` and reports a broken page that is not broken.

- [ ] **Step 3: Audit contrast**

Run `auditContrast(document)` on every page in both locales at 360, 768 and 1440.
Expected: no failures. Normalise computed colours through a canvas, not a regex — Chrome returns `lab()`/`oklab()` and parsing those as RGB makes every figure garbage.

- [ ] **Step 4: Check 360px overflow**

Find elements where `el.scrollWidth > el.clientWidth`, in both locales.
Expected: none. Titles take `hyphens-auto [overflow-wrap:anywhere]`.

- [ ] **Step 5: Deploy and provoke concurrency on the deployed instance**

Deploy to Vercel with all environment variables set and `ensure-indexes.mjs` run against production. Then fire ~30 concurrent claims at the same few early slots.
Expected: exactly one success per slot, every loser gets the refreshed grid, no connection-pool errors, cold-start latency tolerable. This is the burst check — localhost does not exercise it.

- [ ] **Step 6: Rehearse end to end on a phone**

In Arabic and in English: apply, book, read the confirmation, download the calendar file, receive the email. Then as the interviewer: sign in, see the booking, cancel it, confirm the applicant is emailed, export the CSV.

- [ ] **Step 7: Write the project's `CLAUDE.md`**

Record the testing deviation, the slot config as source of truth, the partial-index design, the `LtrRun` rule, the server-action locale trap, the proxy matcher trap, and the shutdown date.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: launch checks, audits and project documentation"
```

---

## Before Saturday, outside the code

- The venue address, the four client-supplied strings and the Reply-To address, all due **Thursday 26 November** — Friday is the Jordanian weekend.
- One plain sentence to the client about the Calendly fallback.
- A written date for deleting the Atlas cluster and the Vercel project.
- Thursday afternoon: the Calendly go/no-go, while someone at Court House+ can still be reached.
