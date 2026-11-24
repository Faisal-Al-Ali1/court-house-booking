# Middle East Plus — Organiser Interview Booking Portal

**Date:** 2026-11-24
**Event date:** Saturday 28 November 2026
**Status:** design, awaiting approval

## Intent

Middle East Plus is running an event on Saturday 28 November 2026. People who want to join as organisers need to be interviewed first, and there is one interviewer doing all of them back-to-back on that single day.

Without a portal, those 30 interviews get arranged by hand over WhatsApp and email: the interviewer ends up as a scheduling clerk, two people get told the same time, and nobody has a reliable list on the morning itself. The portal exists so an applicant books their own slot and the interviewer walks in on Saturday with the day already settled.

It is deliberately short-lived. It goes up before Saturday, takes bookings, serves the interviewer through the day, and is retired afterwards. The applicant list must survive that retirement.

## Goals

1. An applicant can give their details and hold a slot in under a minute, on a phone, in Arabic or English.
2. No slot is ever held by two people.
3. The interviewer can see the whole day — times, names, phone numbers, open gaps — without asking the developer for anything.
4. The data outlives the portal.
5. It is live and taking bookings well before Saturday morning.

## Non-goals

- Applicant accounts, login, or password reset. The booking is identified by email, nothing more.
- Self-service rescheduling. An applicant who needs to change contacts Middle East Plus; the interviewer frees the slot and they rebook.
- Interview notes, scoring, or verdicts in the portal (see Decisions).
- More than one interviewer, panel, or parallel track.
- More than one date, or any notion of a recurring event.
- Payments, SMS, reminders, or calendar invitations sent on the interviewer's behalf.
- An admin UI for editing the schedule. The slot grid is defined in code.

## Anti-goals

Things that would make this a failure even if every feature works:

- The interviewer arrives on Saturday and cannot tell who is coming at 11:20.
- Two applicants arrive for the same slot.
- One person books all 30 slots and nobody notices until Saturday.
- The Arabic page renders times or phone numbers reversed or mangled.
- A booking is taken but the applicant never learns their time because an email silently failed.
- The portal is shut down and the applicant list goes with it.

## Constraints

- **Hard deadline, and shorter than it looks.** Interviews begin 10:00 Saturday 28 November; this design was written Tuesday 24 November. **Jordan's working week runs Sunday to Thursday, so Friday 27 November is the weekend.** The client is reachable Wednesday 25 and Thursday 26, then not again before the event. Every client-side open item below is therefore due **Thursday 26 November, not Friday**, and the Calendly go/no-go moves to Thursday afternoon, while someone at Middle East Plus can still be reached. Build time is three days; client-dependency time is two.
- **One developer.**
- **Thirty bookings, total.** Load is irrelevant. Correctness under two simultaneous clicks is not.
- **Bilingual Arabic/English, Arabic-first**, matching every previous Middle East Plus-adjacent project in `Desktop/Projects/`.
- **Temporary hosting**, retired after the interviews.
- **Existing house conventions apply.** This is not a greenfield stack choice; see Conventions.

## Brand

Supplied by the client on 2026-11-24: logo variations, a three-colour palette and two typefaces.

### Identity

The mark is a white classical column on a red square. The full lockup pairs it with **COURT HOUSE+** in charcoal above **MIDDLE EAST PLUS** in grey, with *PLUS* in red. Three variants were supplied: the full lockup for light backgrounds, a reversed lockup, and the column mark alone in solid white for use on red or charcoal.

**The portal leads with the full lockup**, which carries both names and so avoids choosing between them. Short-form references — the browser tab title, the email sender name — use **Court House+**, the dominant element in the mark. Flagged as a call, not a client instruction: the brief was given as "Middle East Plus" and the lockup says otherwise.

### Palette

| Token | Hex | Role |
| ----- | --- | ---- |
| Red | `#A32731` | Brand. Primary actions, selected state, the mark's field |
| Charcoal | `#3F3F3D` | Body text, headings, structure |
| White | `#FFFFFF` | Page ground |

Contrast, calculated from the hex values and to be re-verified against rendered pixels before launch:

- Red on white — **7.26:1**. Passes AAA for body text, which means brand red can carry text here. This is unlike the Al-Dallah gold at 2.39:1, and removes the need for a separate darkened variant.
- White on red — **7.26:1**. Buttons with a red fill and white text are safe.
- Charcoal on white — **10.56:1**. A strong body colour.
- **Red on charcoal — 1.45:1. Banned.** Never place brand red text on the charcoal, in either direction.

**Three colours do not cover this interface.** The slot grid alone needs available, selected, taken, past and break-divider states, and the forms need field borders, placeholder text and disabled controls. That is seven or eight distinct surfaces from three values.

Neutral steps must therefore be derived from the charcoal and solved for contrast before any component is built, exactly as `scripts/solve-tokens.mjs` does in the Al-Dallah project. **The shortcut of `opacity-50` on a disabled slot is banned** by the house rules — opacity as a text colour produced 2.6:1 labels once already and is for disabled states' *affordance*, never their text colour. A taken slot still has to be readable; it is information, not decoration.

### Typefaces

The brand sheet specifies **Livvic** for English and **Nizar Cocon Kurdish** for Arabic. These are not equally obtainable.

**Livvic** is on Google Fonts under the SIL Open Font License, weights 100–900, by Jacques Le Bailly and Baron von Fonthausen. It loads through `next/font/google` with no licensing question. **Its subsets are Latin and Vietnamese — it has no Arabic coverage.**

**Nizar Cocon Kurdish** is a display face by Nizar K. Abdullah in Regular and Bold. No foundry page, no EULA and no licensed distribution could be found; the download sites listing it carry it as a user upload with the license field empty. Two problems follow, and only the first is technical:

1. **There is no webfont to license.** Shipping a font of unverified provenance on a client's public site puts the exposure on the client, not the developer.
2. **It is a display face with two weights.** Display faces are drawn for headlines. This portal is 30 slot times, form labels and a data table at small sizes, which is the work a text face is drawn for. Even fully licensed, it is the wrong tool below about 24px.

**Decided 2026-11-24, delegated to the developer: Livvic for English, Cairo for Arabic.** Livvic is exactly what the brand sheet specifies and carries the English side unchanged. Cairo substitutes for Nizar Cocon Kurdish because there is no licensed webfont to buy, because a two-weight display face is the wrong instrument for a table of thirty times, and because — as below — it removes a whole class of failure rather than merely guarding against it. Cairo is OFL and proven across all four existing projects.

The substitution is worth one sentence to Middle East Plus, since it is their brand sheet being departed from. It is not a question: a font with no traceable licence should not ship on their site.

### The font trap is live again on this project

`CLAUDE.md` records that `next/font`'s synthetic fallback faces cover every codepoint and once swallowed Arabic glyphs when a Latin-only family led the stack, and notes that *with one bilingual family this cannot recur*. That protection is now gone: Livvic is Latin-only, so this project has two families again, exactly the configuration that failed before.

Mitigations, all required:

- `adjustFontFallback: false` with explicit fallbacks, as in the existing `fonts.ts`.
- **Livvic never appears in the font stack of an Arabic page**, in any position.
- Choosing Cairo for Arabic makes the failure structurally impossible rather than merely avoided, because Cairo covers Latin too: the Latin runs inside Arabic text — every time, date and phone number on the page — render in Cairo, and the Arabic stack contains no Latin-only face at all. This is a substantial part of why Cairo is the recommendation.

## Approaches

Three were considered.

**A — One Next.js app on Vercel, MongoDB Atlas free tier. Chosen.**
A single repository: the applicant flow, the interviewer view, and the data access all in one deploy. Slot claiming is a single atomic insert guarded by a unique index. Free on both Vercel's hobby tier and Atlas M0.

Chosen because it matches where the developer is genuinely fast — React/Next.js and MongoDB are his real depth — and because three and a half days makes velocity worth more than architectural preference. It also matches the house frontend stack exactly, so the bilingual, RTL and form-handling work is a known quantity rather than a learning exercise.

**B — The same app with Postgres instead of Mongo.**
A `UNIQUE` constraint on the slot column gives double-booking protection with no reasoning required, and a fixed grid of slots is naturally relational.

Rejected, narrowly. The advantage over A is real but small: Mongo's unique index does the same job correctly. Set against it is a less familiar query surface during a three-day build. Worth revisiting if this ever becomes a recurring product.

**C — Calendly's free tier.**
Fifteen-minute events with 5-minute buffers, a single date, intake questions, deliverable confirmation emails and reminders, automatic timezone handling, automatic cut-off when full. Live in about half an hour with no code.

Rejected as the plan, kept as the fallback. It is the better engineering answer and the worse answer to the brief: Calendly's branding, no Middle East Plus identity, and nothing the organisation owns afterwards. If the build is in trouble by Thursday evening, this is the escape hatch — it is cheaper to abandon a half-built portal than to ship a broken one on Saturday morning.

**Rejected outright:** a Google Sheet or Airtable as the backing store. No way to make two simultaneous claims safe, which is the one correctness requirement that actually matters here.

## The slot grid

Derived in code from configuration, never seeded into the database. The configuration is the single source of truth:

```
date:      2026-11-28
timezone:  Asia/Amman          (UTC+3 year-round, no daylight saving)
windows:   10:00 – 14:00
           16:00 – 22:00
interview: 15 minutes
gap:       5 minutes           (so a 20-minute stride)
```

A slot is generated at each 20-minute step from the window start, and kept only if the interview finishes within the window.

- **Morning:** 10:00 AM to 1:40 PM — **12 slots** (the 1:40 slot ends 1:55; a 2:00 slot would end 2:15, past the window)
- **Break:** 2:00 PM to 4:00 PM, no slots
- **Evening:** 4:00 PM to 9:40 PM — **18 slots** (the 9:40 slot ends 9:55)
- **Total: 30 slots**, which is the hard ceiling on applicants.

**Slot identity** is the local wall-clock time: `2026-11-28T10:00`. Because Jordan has no daylight saving and the date is fixed, a wall-clock identifier is unambiguous and avoids every UTC conversion bug. UTC is derived only where it is actually needed — the calendar file and the email — by adding the fixed +03:00 offset.

**The slot list is never derived from the visitor's clock.** Times are generated server-side from the configuration above and labelled as Amman time in both languages. An applicant opening the page from another country sees Amman times, correctly marked, rather than times silently shifted into their own zone.

**Past slots are not bookable.** Availability is computed against the current time in `Asia/Amman`, so somebody opening the portal at 3 PM on Saturday cannot book the 10 AM slot.

## Data model

One collection, `bookings`. There is no `slots` collection: an unbooked slot is simply the absence of a document.

**Name, email and phone are the whole application**, confirmed by the client on 2026-11-24 after the question was put explicitly. No role, no city, no referral source. The schema is closed.

| Field       | Type   | Notes                                              |
| ----------- | ------ | -------------------------------------------------- |
| `slotId`    | string | `2026-11-28T10:00`, validated against the grid     |
| `name`      | string | 2–120 characters                                   |
| `email`     | string | lowercased and trimmed before write                |
| `phone`     | string | 7–24 characters                                    |
| `locale`    | string | `ar` or `en`, the language used to apply           |
| `createdAt` | Date   |                                                    |
| `cancelledAt` | Date or null | set when the interviewer frees the slot; `null` while live |

**Two unique indexes carry the correctness of the whole system:**

- `{ slotId: 1 }` unique — makes double-booking impossible. Two people submitting the same slot 200 ms apart: one insert succeeds, the other fails with a duplicate-key error.
- `{ email: 1 }` unique — one booking per person, which is what stops a single visitor from taking all 30 slots on a portal with no login.

Both are **partial** indexes, filtered on `cancelledAt: null`, so a cancelled booking releases its slot and its email address while the row itself survives.

On a duplicate-key failure the handler inspects which index was violated and returns the matching translated message: *that slot was just taken, here is the refreshed grid* versus *you already have a booking at this time*. These are different situations and must read differently.

**Cancellation is a soft delete, reversed from the first draft of this document.** Hard deletion frees the slot cleanly, but it destroys the only record that the person ever applied — which contradicts goal 4, since the CSV export would silently omit them, and it makes a misclick on a phone on Saturday morning unrecoverable. Setting `cancelledAt` frees the slot and the email through the partial indexes while keeping the row, and the export carries cancelled applicants marked as such.

**Connection handling.** On Vercel's serverless runtime the `MongoClient` promise is cached on `globalThis` so that repeated invocations reuse one connection pool instead of opening a new one per request. Atlas M0 must allow `0.0.0.0/0` because Vercel functions have no static egress addresses.

## Screens

Three, all under `src/app/[locale]/`.

### 1 & 2. Apply, then pick a slot

One route presenting two steps, with the step reflected in the URL (`?step=slot`) so the back button behaves.

Step one takes name, email and phone. Step two shows the grid.

**This is deliberately two steps but one database write.** The booking is created once, at the end, when the applicant confirms a slot. Nothing is written after step one. The alternative — a "pending applicant" record written at step one and completed at step two — produces orphaned half-applications from everyone who browses the grid and leaves, and gives a worse answer to "how many people applied". Step one's values are held in component state with a `sessionStorage` backup so a refresh does not lose typing.

If the claim fails because the slot went in the meantime, the applicant returns to the grid with their details intact and the taken slot now shown as taken.

**The grid** groups slots morning and evening with the break shown as a labelled divider rather than a gap, so the two-hour hole reads as intentional. Taken slots are visibly disabled, not hidden — seeing that 11:00 is gone explains why 11:20 is the suggestion.

**When all 30 are taken**, the grid is replaced by a full-state message rather than a wall of disabled buttons. The Arabic wording of that message needs Middle East Plus's approval; it is the one screen an applicant sees when the answer is no, and it should point them somewhere rather than just closing the door.

### 3. Confirmation

**The on-screen confirmation is the authoritative one.** Name, date, time, duration, **the venue address and a map link**, in the applicant's language, prominent enough to screenshot, with a downloadable `.ics` calendar file carrying the same address in its `LOCATION` field. The confirmation email is a convenience layered on top and is allowed to fail without the applicant losing anything.

**Interviews are in person at a single venue**, confirmed 2026-11-24; the address is the same for all thirty slots and is therefore content, not a per-booking field. It lives in `messages/ar.json` and `messages/en.json` with the map URL as a constant, and it appears on the confirmation screen, in the confirmation email and in the calendar file. The address needs the same LTR isolation as everything else on the Arabic page — building numbers and postal codes are numeric runs like any other.

### 4. Interviewer view

A password-gated route showing the whole day in order:

```
Middle East Plus — Interviews                       Sat 28 Nov
──────────────────────────────────────────────────────────────
22 of 30 booked                                 [ Export CSV ]

 10:00 AM   Layla Haddad       l.haddad@…    079 123 4567   ⨯
 10:20 AM   Omar Nasser        omar.n@…      078 998 1122   ⨯
 10:40 AM   — open —
 11:00 AM   Rana Khalil        rana.k@…      077 445 2211   ⨯
    ⋮
  1:40 PM   Yousef Barghouti   y.barg@…      079 777 3300   ⨯
─────────────────────  break · 2:00 – 4:00 PM  ────────────────
  4:00 PM   Dana Sweiss        dana.s@…      078 221 9090   ⨯
    ⋮
```

Open slots appear in place so gaps are visible. `⨯` frees a slot **behind a confirmation step naming the applicant** — this is a phone-sized target being tapped during a working day, and the action emails the person that their interview is off. CSV export is how the list outlives the portal, and must be exercised before shutdown rather than discovered to be broken on the day.

**Read-only on substance:** the interviewer can see and cancel, but cannot record notes, scores or verdicts. Adding those means a form, save states and autosave anxiety, written on Thursday night against a Saturday deadline. The exported spreadsheet or a notebook does the job for free on the day. Easy to add later if this becomes recurring.

**Authentication:** a single shared password supplied as an environment variable, no accounts. A server action compares it with a timing-safe comparison and sets a signed, `httpOnly` cookie; the route's layout checks that cookie. A secret URL alone was rejected — those get forwarded, screenshotted and left in browser history.

**The guard lives in `[locale]/interviewer/layout.tsx`, not in the next-intl proxy.** This is deliberate. The proxy matcher is where this codebase has been bitten before (the double-backslash trap recorded in `CLAUDE.md`), and that failure stays green through lint, types and build. Adding an auth branch to it trades a solved problem for an unsolved one.

## Email

Best-effort, never blocking, never able to fail a booking.

Two messages are sent after the insert succeeds: the applicant's confirmation, in the language they applied in, and a notification to the interviewer so a booking reaches them even if the applicant's mail bounces. A send failure is logged and swallowed; the booking stands and the on-screen confirmation already carries everything.

A third template covers cancellation. When the interviewer frees a slot, the applicant is told, in the language they applied in. Without it, somebody is holding a screenshot that says 11:00 for an interview that no longer exists — and since the non-goals route rescheduling through "contact Middle East Plus, the interviewer frees the slot, you rebook", this is the normal path, not an edge case.

**Provider:** Resend. Simplest API, free tier well clear of 30 bookings.

**The deliverability risk is the sending domain, not the volume.** Thirty messages from an unverified sender are filtered as reliably as thirty thousand — spam scoring reads SPF and DKIM, not headcount. Verification can take most of a day, so the records go in immediately, in parallel with the build. The developer controls the DNS, so this is a task rather than a dependency. If it somehow is not ready by Saturday, sending falls back to Resend's shared domain: it works instantly, it may land in spam, and that is tolerable precisely because the on-screen confirmation is the real one.

**The From address will not match the organisation.** Applicants apply to Court House+ and receive mail from the developer's domain, which is the arrangement the client has chosen. To a recipient this is the shape of a phishing email, and some of them will treat it that way. Three mitigations, all cheap:

- the display name is **Court House+**, so the inbox list reads correctly even though the domain does not;
- **Reply-To is a real Court House+ address**, so a reply reaches the organisation rather than the developer, and the header gives a human something recognisable to check;
- the on-screen confirmation remains authoritative, so an applicant who distrusts the email has already been told everything it contains.

A domain in the client's own name is the real fix, and is noted below as the better arrangement if they do this again.

**This is the one piece of the system with no precedent in the existing projects.** The Al-Dallah contact form posts to an endpoint that does not exist, by design, so there is no house email pattern to copy. Budget accordingly.

## Distribution, data protection and shutdown

**The link is public, not an invitation list.** This follows from the brief — anyone who wants to help organise applies — and from the explicit requirement that a 31st applicant gets a proper message. It is recorded here because it is the assumption the abuse defence rests on: with a closed invitee list, the one-booking-per-email rule could be dropped in favour of per-person tokens. It should not be dropped quietly if the distribution model changes.

**How the link is announced affects the experience, not the correctness.** A single broadcast to a large group produces thirty near-simultaneous claims against the same few early slots. The unique index is correct under any burst, but the "just taken, here is the refreshed grid" path stops being rare and becomes the normal first experience. If the announcement is a broadcast rather than a trickle, the grid should offer the next free slot on a failed claim rather than only re-rendering, and the burst needs exercising against the deployed instance rather than reasoned about — cold serverless starts and an M0 cluster are the weak points, not the write path.

**The developer owns the infrastructure.** Confirmed 2026-11-24: the hosting, the domain and the sending domain are all the developer's, because Court House+ has no technical staff and this is being provided as a service. One welcome consequence is that nothing in the DNS chain waits on the client — SPF and DKIM can be published today rather than chased, which removes the single worst schedule risk in this document.

The other consequence needs stating plainly. Thirty people's names, email addresses and phone numbers, collected in Jordan — which has had a personal data protection law since 2023 — will be held on infrastructure belonging to someone who is not the organisation those people think they are dealing with. That is a normal arrangement and a common one, but it only stays clean if it is deliberate:

- **The form's notice says who actually holds the data**, not a vague "we". It names Court House+ as the organisation collecting it and states that it is held by a contracted developer, used only to arrange the interview, and deleted afterwards.
- **No analytics, no third-party scripts, no tracking.** There is nothing here worth measuring and no reason to involve another party.
- **Deletion is a commitment with a date**, not an intention. Goal 4 fails silently if it depends on somebody remembering to click Export. The sequence: the interviewer exports on the day; the developer exports again afterwards as a second copy and hands both to Court House+; the Atlas cluster and the Vercel project are deleted within a week of the interviews, once the client confirms receipt. Write the date down.
- Should Court House+ ever run this again, a domain and accounts in their own name would be the better arrangement. Not worth doing for one Saturday.

## Accepted limitations

Recorded so they are choices rather than oversights:

- **No self-service booking lookup.** An applicant who loses the confirmation and whose email went to spam contacts Middle East Plus, and the interviewer reads their slot off the schedule. A lookup page would need to resist email enumeration, and with thirty applicants and one interviewer holding the full list, a phone call is the cheaper mechanism.
- **Two people sharing one email address cannot both book.** The second is told they already have a booking, which will read as wrong to them. The unique email index is the only thing standing between a public link and one person taking all thirty slots, so it stays; the recourse is to contact Middle East Plus.
- **The Calendly fallback is only a fallback if the client has agreed to it.** Calendly branding on a Court House+ process, and the applicant list living in a third-party account, are the client's decision and not the developer's. How to raise it was delegated to the developer on 2026-11-24, and the answer is: one plain sentence in the Thursday message, not a technical decision handed to people with no technical background. Something to the effect that if anything slips there is a backup booking tool that would look less like their own site, and they should say so now if that is unacceptable. That obtains the consent that matters — third-party branding, and their applicants' details in someone else's system — without asking them to evaluate a trade-off they have no way to judge.

## Conventions

Matched to the four existing bilingual projects, which are consistent with each other. `aldallah-group-landingpage/CLAUDE.md` is the fullest statement and governs.

**Stack:** Next.js 16.1.6 App Router, React 19.2.3, TypeScript 5, Tailwind v4.1.14, next-intl 4.6.1, Zod 4.3.6, `rtl-detect`, Cairo via `next/font/google` with `adjustFontFallback: false` and an explicit `Segoe UI`/`Tahoma`/`system-ui` fallback.

**Note on Next.js 16.** The `AGENTS.md` block in each project warns that this version departs from older conventions, and directs the builder to read `node_modules/next/dist/docs/` before writing code rather than working from memory. That applies here.

**Layout:** `src/app/[locale]/` with route groups; per-feature `components/`, `actions/`, `schemas/`, `types/`, `utils/` folders with `index.ts` barrels; `page.tsx` plus `page-client.tsx`; `loading.tsx` per route. `src/core/{config,constants,i18n,types}`, `src/lib/` for pure helpers, `messages/ar.json` and `messages/en.json` with top-level namespaces.

**Repositories** keep the house shape and the snake_case suffixes: `src/repositories/bookings/{bookings_repo.ts, bookings_impl.ts, types.ts, index.ts}`, returning `Result<T>` with `isSuccess`/`isFailure` rather than throwing.

**This is the one architectural deviation from the existing projects,** and it is intentional. Every previous frontend keeps its repositories as HTTP clients calling a separate .NET API (`callPost`). Here the implementation talks to MongoDB directly, because standing up and deploying a second service is not a three-day proposition and the .NET stack is not where this developer is fastest. The repository interface is unchanged, so swapping in a real backend later remains the one-file change it is in the other projects.

**Code rules:** no comments, ever — anything learned goes in `CLAUDE.md`. No `any`, no `@ts-ignore`, no `React.FC`. Server Components by default, `"use client"` on leaves only. Logical properties only (`ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`), never `left`/`right`. kebab-case files, PascalCase components, camelCase functions, SCREAMING_SNAKE_CASE for frozen lookups. Prop types in `types/<component>-props.ts`.

**Validation:** Zod schemas carry translation *keys* as their error messages, resolved per-locale with `getTranslations` in the server action. Both locales get correctly worded errors from one schema.

## Traps that apply directly

From `CLAUDE.md`, all previously paid for in this codebase:

1. **Server actions do not receive the `[locale]` param.** `getTranslations()` without an explicit locale falls back to `ar` and answers an English form in Arabic. The booking action reads a hidden `locale` field and validates it against `routing.locales`.

2. **React 19 resets an uncontrolled form after every server action, including one returning validation errors.** This cost the Al-Dallah enquiry form all nine fields and its attachment. The booking form prevents the default, builds `FormData` by hand and calls the action inside `startTransition`, resetting only on success — while keeping `action={formAction}` for the no-JavaScript path.

3. **Number isolation dominates this interface.** Every Latin or numeric run on an Arabic page needs `dir="ltr"`, and this portal is almost nothing but numbers: 30 slot times, the date, phone numbers, the "22 of 30" counter, the duration. In previous projects this rule covered a handful of figures; here it covers most of the markup. Times, counts and phone numbers all go through the `LtrRun` treatment, with no case-by-case reasoning about which ones "look fine".

4. **`setRequestLocale` in every layout and every page**, or the subtree silently drops out of static generation.

5. **`notFound()` thrown from `[locale]/layout.tsx` bubbles past that segment's boundary**, so `src/app/not-found.tsx` must exist.

6. **Arabic takes no letter-spacing**, and no Latin-only font face may appear in an Arabic page's stack. See "The font trap is live again on this project" above — the single-bilingual-family protection that made this impossible in the previous projects does not hold here.

7. **The next-intl proxy matcher needs the double backslash.** Not touched by this project, and deliberately not touched by the auth guard.

## Decisions taken here, not by the client

Flagged so they can be overruled on sight:

- **12-hour times with Western digits and Arabic meridiem markers** — `10:00 ص`, `4:00 م` — rather than Arabic-Indic numerals. Matches how the existing projects render figures inside Arabic text (`6,000 برميل`), and keeps the times legible to anyone reading the exported CSV.
- **One booking per email address.** The practical defence against a public, loginless portal being filled by one person.
- **Two steps, one write.** Described above.
- **The on-screen confirmation is authoritative; email is a convenience.** This is what takes the DNS verification risk off the critical path.
- **Interviewer view is read-only on substance.** Scope protection against the deadline.
- **Shared password, not accounts,** for the interviewer.
- **Soft delete over hard delete**, with partial unique indexes, so cancelling frees the slot without destroying the applicant record.
- **Cancellation emails the applicant**, and `⨯` asks for confirmation first.
- **A data-protection notice on the form**, and a shutdown sequence with a named owner.
- **No self-service lookup page.** See Accepted limitations.
- **Cairo replaces Nizar Cocon Kurdish for Arabic**, Livvic stays for English. Delegated by the client on 2026-11-24; reasoning under Brand.

## Left to the builder

- Component decomposition and Tailwind structure within the house conventions.
- Whether the grid re-checks availability on an interval or only on a failed claim. Thirty slots and one interviewer make polling hard to justify; a failed claim already refreshes.
- `.ics` generation by hand or by library.
- CSV column order and filename.
- Exact error copy, subject to the Arabic approval noted below.

## Open items

| Item | Owner | Needed by |
| ---- | ----- | --------- |
Everything marked for the client is due **Thursday 26 November**, since Friday is the Jordanian weekend.

| Item | Owner | Needed by |
| ---- | ----- | --------- |
Only three things are still owed by the client, and the build is not blocked on any of them until the end.

| Item | Owner | Needed by |
| ---- | ----- | --------- |
| **The venue address**, in Arabic and English, plus a map link. Interviews are in person, and this is the one part of the confirmation that cannot be written without them | Client | Thursday 26, before the confirmation screen is finished |
| **Wording for four strings**, which the client is supplying: the fully-booked message, the confirmation email, the cancellation email, and the data-protection notice | Client | Thursday 26 |
| **A Court House+ email address for Reply-To**, so replies reach the organisation rather than the developer | Client | Thursday 26 |
| SPF and DKIM published for the sending domain. No longer a client dependency — the developer holds the DNS | Developer | immediately |
| One plain sentence to the client about the Calendly fallback, per Accepted limitations | Developer | with the Thursday message |
| Neutral steps derived from the charcoal and solved for contrast | Developer | before any component |
| Interviewer password, set as an environment variable | Developer | before launch |
| A written date for deleting the Atlas cluster and Vercel project | Developer | at handover |

**Resolved 2026-11-24:** interviews are in person; the schema is closed at name, email and phone; Cairo replaces Nizar Cocon Kurdish; Court House+ is the short name; hosting, domain and sending domain are the developer's.

## Verification

There is no test runner in these projects, by design. The gate is `npm run gitcheck` — lint, format, clean build, then start — plus, for this project specifically:

- Two concurrent claims on the same slot: one succeeds, one gets the "just taken" message. Worth actually provoking, not reasoning about.
- A burst of roughly thirty concurrent claims against the deployed instance, not localhost, if the link is being broadcast rather than trickled. What this is looking for is cold-start latency and M0 behaviour under a thundering herd, not the write path, which the index already settles.
- Cancellation: the slot returns to the grid, the email address can book again, the row survives in the export marked cancelled, and the applicant is emailed.
- A second booking attempt from an email that already has one.
- The 31st applicant's experience with all 30 slots taken.
- Every time, date, phone number and counter on `/ar` isolated as an LTR run — walk the text nodes of `html[lang="ar"] main` for `[A-Za-z0-9]` without a `dir="ltr"` ancestor; the list must be empty.
- The booking form keeping its values after a validation error, in both locales.
- Interviewer view: password rejected when wrong, cancellation frees the slot, CSV export opens correctly in Excel with Arabic names intact (a BOM is needed for that).
- A full rehearsal on the deployed URL, from a phone, in both languages, before Saturday.
