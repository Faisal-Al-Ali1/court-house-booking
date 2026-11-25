# Deployment checklist

Everything here is something the code cannot do for you. Nothing was deployed or sent from the build machine; every item that needs the live instance, real credentials, a real inbox or a real phone is written down here to be done by hand.

The event is **Saturday 28 November 2026**. Jordan's working week is Sunday to Thursday, so Friday is the weekend: the client can be reached **Wednesday 25 and Thursday 26 November only** before the event. Work backwards from that.

## 1. Run the launch check

```
npm run launch-check
```

This is step one. It fails while any `TODO` marker (or the sample English address) remains in `messages/ar.json` or `messages/en.json`, and its failure message names every offending key, so the output is the to-do list. The full list for the client, with the open questions and the data-protection notice, is `docs/client-copy-needed.md`. Send it first; everything else can proceed in parallel.

It is deliberately **not** part of `npm test` (which stays green and tests correctness only, so a real regression is never lost among expected failures), and deliberately **not** wired into `prebuild`. Wiring it in would make Vercel refuse to build with placeholders, which would also block the preview deploys needed this week to test the portal while placeholders are still in place. The omission is a decision, not an oversight. Do not launch to the public with it red unless the client has agreed in writing to the fallback.

## 2. Environment variables

Set all of these in Vercel for **Production**.

**Preview must use a separate database.** If Preview shares the production `MONGODB_URI`/`MONGODB_DB`, every test booking made on a preview deploy consumes one of only thirty real slots, and a preview that is never cleaned up silently shrinks the event. Give Preview its own Atlas database (a second database name on the same cluster is enough; run `ensure-indexes.mjs` against it too) and its own `SESSION_SECRET`. If you do not want working previews, leave Preview unset.

| Variable | Required at runtime | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Atlas connection string. Without it every page that lists slots shows the "could not load" message and booking fails. |
| `MONGODB_DB` | yes | Database name. The same value must be given to `ensure-indexes.mjs`. |
| `SESSION_SECRET` | yes | Long random string. See 2.2. |
| `INTERVIEWER_PASSWORD` | yes | See 2.1. If unset, sign-in is refused for everyone (it fails closed). |
| `RESEND_API_KEY` | yes, for email | Without it no email is sent and the only trace is a log line. Booking still succeeds. |
| `MAIL_FROM` | yes, for email | An address on the verified Resend domain. |
| `MAIL_REPLY_TO` | yes, for email | Where applicants' replies go. Comes from the client. |
| `INTERVIEWER_EMAIL` | yes, for email | Where the new-booking notification goes. |
| `INTERVIEWER_LOCALE` | optional | `ar` or `en`. Defaults to `ar`. See 2.4. |

**None of these is needed at build time.** Every read happens lazily, inside a request. A build with all of them unset must succeed; verify with `npm run build` in a clean shell. If a build starts demanding one, a module-load read has crept in (see `CLAUDE.md`).

**Set `NEXT_PUBLIC_SITE_URL` to the production URL before the production build.** It is the one build-time variable. Next inlines it into `metadataBase`; if it is unset, the fallback `http://localhost:3000` is baked into the production pages' metadata. It is not a runtime secret, but it must exist when the deployment is **built**, and changing it needs a **rebuild** (a redeploy of the same build is not enough).

### 2.1 `INTERVIEWER_PASSWORD`: generate it, do not choose it

Generate a long random value: a password manager's generator at 20 or more characters, or `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`. **Do not use a memorable password.**

There is deliberately **no rate limit on sign-in.** On serverless an in-memory counter does not survive across instances, and a durable one would mean a new collection and a database write on every attempt. The trade was accepted because the site lives four days and holds thirty records, **provided the password is high-entropy**. A weak password with no rate limit would be negligent. Password entropy is the only control; do not weaken it. Vercel's firewall rate limiting on the interviewer route is optional defence in depth.

Share it with the interviewer over a channel that is not the public booking link, and do not leave it in a ticket or chat that outlives the event.

### 2.2 `SESSION_SECRET`: required, and it gates more than the cookie

Without it:

- **The interviewer cannot sign in at all.** Sign-in and every later session check need the secret, so on Saturday the schedule, the cancel action and the CSV export are all out of reach.
- **The calendar download fails** (the endpoint answers 404, because it proves the booking by the signed cookie).
- **The confirmation screen never shows**, on the booking itself or on a later visit: the applicant lands back on the booking form.
- The booking itself still succeeds and the confirmation email still goes out; only the signed cookie write is swallowed. That is the one part that fails quietly, and it is the least important of the four.

Set a long random value before the link is shared, and test sign-in on the deployed instance. Changing it later signs the interviewer out and invalidates every confirmation cookie.

### 2.2a Do not let the portal be publicly reachable before the copy lands

Two things were learned the hard way on 25 November 2026, when a deployment meant as a preview went live publicly for
about twenty minutes.

**`vercel deploy` puts a project's FIRST deployment into production, whatever you intended.** Vercel says so in its own
output, after the fact: "This is the project's first deployment, so it was assigned to production. Future deployments
will be preview deployments unless you use `--prod`." Pass an explicit target on every deploy and never rely on the
default.

**Verify protection from a network that has no Vercel session, before trusting it.** The deploy response reported
`"deploymentProtection": ["vercel_authentication"]`, and the booking page was nevertheless served to an anonymous
phone on mobile data. A claim in an API response is not a test. Check from a device that is not signed in to Vercel,
and note that a fixed line which resets `*.vercel.app` (see below) cannot perform this test at all — a connection
reset looks exactly like a site that is not there.

**Why it matters more than placeholder Arabic looking untidy:** a reachable portal writes to the production database
with working credentials. A stranger can consume one of only thirty real slots, and submit a name, email address and
phone number under a data-protection notice that is still the text `TODO: paste the data-protection notice here`.
Nothing was booked in this instance; both databases were confirmed empty afterwards.

**`*.vercel.app` is reset by at least one Jordanian fixed-line ISP** — the developer's own. DNS resolves, `vercel.com`
answers 200, and the handshake to the project's `vercel.app` host is reset; the same URL loads over mobile data. Any
applicant on that ISP would get a dead link rather than an error page. A subdomain of a domain you control, pointed at
Vercel, removes the problem, because the filter never sees `vercel.app` in the handshake.

### 2.3 `MAIL_REPLY_TO`

Due from the client by **Thursday 26 November**.

### 2.4 Set `INTERVIEWER_LOCALE=en` until the Arabic copy lands

Until the real Arabic copy replaces the placeholders, the interviewer's own notification email in Arabic has the subject "TODO-AR: New interview booking" and a body of English placeholder text. Set `INTERVIEWER_LOCALE=en` for now. Once the Arabic copy is in, ask the client which language the interviewer wants (it is one of the questions in `client-copy-needed.md`) and set the variable accordingly.

## 3. Database (MongoDB Atlas)

1. Create the cluster and a database user with read/write on `MONGODB_DB` only.
2. Network access: Vercel functions have no fixed IP, so Atlas needs `0.0.0.0/0` in the access list. Tell the client; the control is then the database password.
3. Choose the Atlas region close to the Vercel function region. **Settled on 25 November 2026:** the cluster is
   AWS Frankfurt (`eu-central-1`) and the four database-touching route segments carry
   `export const preferredRegion = "fra1"`. Measured from Amman, Frankfurt answers a round trip in **65 ms**
   against **234 ms** for the AWS Hong Kong cluster it replaced, with the cold connect down from 2.8 s to 1.1 s.
   `preferredRegion` is a preference, not a guarantee, so **confirm Settings -> Functions -> Region reads
   Frankfurt in the dashboard**; an M0 cluster's region cannot be changed after creation, so a later move means
   another new cluster.
4. **Run the index script against Atlas**, once per database (production and Preview). On Windows PowerShell the
   inline `VAR=value command` form does not exist, so put both values in the git-ignored `.env.local` and let Node
   read them — the password then stays out of the command line and the shell history:

   ```
   node --env-file=.env.local scripts/ensure-indexes.mjs
   ```

   On a POSIX shell, either that or:

   ```
   MONGODB_URI="<atlas uri>" MONGODB_DB="<db>" node scripts/ensure-indexes.mjs
   ```

   It prints `bookings indexes ensured`. The runtime guard (`assertBookingsIndexes` in `src/lib/mongo.ts`) turns a missing or conflicting index into a loud failure on the first request, but **it does not create the indexes**. These two partial unique indexes are the entire no-double-booking guarantee, so a deployment without them fails closed instead of risking a double booking.
5. **Confirm the Atlas server version accepts `partialFilterExpression`** (it does on any current tier; MongoDB 3.2 and later). The script would error if not. In Atlas, confirm both indexes show as `unique` with the partial filter `{ cancelledAt: null }`.

## 4. Email (Resend)

1. **Verify the sending domain in Resend** (add the DNS records Resend gives you and wait for it to show Verified). Until it is verified **every send fails and the only trace is a log line**. That is tolerated by design, so a mail outage can never block a booking, but it is invisible in practice: a launch without a verified domain looks perfect and sends nothing.
2. Make sure `MAIL_FROM` is an address on that verified domain.
3. **The free plan's cap is 100 emails per day** (checked on resend.com/pricing, 25 November 2026; Pro and above
   have no daily limit). This event needs roughly 30 confirmations, 30 interviewer notifications and up to 30
   cancellations, plus two per rehearsal booking. Bookings spread over several days, so the cap binds only if the
   rehearsal and a burst of real bookings land on the same day. **Going over does not raise an error anyone will
   see:** the send fails, the booking still succeeds, and the only trace is a log line. Count your test sends on
   launch day, or rehearse the day before. **Check the Resend account's rate limit** for your plan. Sends from the portal are sequential, so a normal day is nowhere near it, but if Court House+ announces the link by broadcast and many applicants book in the same minute, the burst of confirmation plus notification emails could exceed it, and anything over the limit is dropped with only a log line.
4. Watch the Vercel function logs for `email not sent`. Logs carry error codes only, never an address.

## 5. Re-run on the real cluster what only ran in memory

**Done at the repository layer on 25 November 2026**, against the real Atlas cluster (MongoDB 8.0.39) using the
`court_house_preview` database: the six-step claim sequence, and a 30-way concurrent burst across three slots
that produced exactly one winner per slot and twenty-seven `slot-taken`. Both databases' indexes were read back
and confirmed `unique` with the partial filter `{ cancelledAt: null }`, with no conflicting plain unique index.
Both databases were left empty. **What that did not cover is everything the deployment adds**: cold-start
latency, Vercel's function concurrency and connection reuse, and the pool errors that only appear in the
function logs. Re-run both from the deployed instance.

The claim logic ran only against an in-memory MongoDB (`mongodb-memory-server`). Run these against the real Atlas cluster on the deployed instance, then delete the test bookings and confirm the schedule shows 0 of 30:

1. **The six-step claim sequence**: insert; the same slot by another applicant; the same email on another slot; the same email on the same slot (idempotent, not an error); cancel; re-insert. Each step must give the right outcome and leave exactly one active booking per slot and per email. The in-memory version is the test of that name in `src/repositories/bookings/bookings_impl.test.ts`.
2. **One concurrency burst.** Fire roughly thirty concurrent claims at the same few early slots. Expected: exactly one success per slot; every loser gets the refreshed grid; no connection-pool errors in the logs; cold-start latency tolerable. Localhost does not exercise this.

## 6. Rehearsal on a real phone, in both languages

Use an actual phone (iOS and Android if you can), on mobile data, in **Arabic and in English**, with throwaway names and your own email.

**As the applicant**

- [ ] Open the public link. Arabic is the default and reads right to left; the language switch works.
- [ ] Fill in the details, continue, pick a slot, submit.
- [ ] The confirmation screen shows the right time, date and venue.
- [ ] **Download the calendar file and open it in a real calendar app.** On **iOS Safari** it must still offer "Add to Calendar" even though the response is `Content-Disposition: attachment`. If Safari only downloads a file, that is a defect: report it. Check the event time is right in Amman time, not shifted.
- [ ] The confirmation email arrives, in the right language and direction, with the calendar attached, and Reply-To is the client's address. Check spam.
- [ ] Reload: the confirmation still shows (that is the cookie, which needs `SESSION_SECRET`).
- [ ] Try the same slot from a second device: it is refused and the grid refreshes.

**As the interviewer**

- [ ] Open the interviewer page and sign in with the generated password. A wrong password shows the error.
- [ ] See the booking, with the applicant's phone as a tap-to-call link.
- [ ] Receive the notification email.
- [ ] Cancel the booking. The applicant receives the cancellation email and the slot is free on the public page.
- [ ] Cancel again with the mail settings deliberately broken: the interviewer sees "Slot freed, but we could not email ..." with the phone number. Restore the settings.
- [ ] **Export the CSV and open it in Excel.** Arabic names must be intact and phone numbers must keep their leading `+` or `0` (they are written as `="..."` text formulas on purpose, which looks odd in other tools). The time column may need widening.

## 7. Once the client's copy is in

- [ ] `npm run launch-check` is green and `npm test` is green.
- [ ] **Confirm the map link actually renders and points at the right place.** It is deliberately hidden while `venue.mapUrl` is a placeholder, so before the real value arrives its absence is expected and silent. After it lands, open the confirmation screen and the confirmation email and tap the link. It must open the right building. A `maps.app.goo.gl` short link is the safest form.
- [ ] Read the Arabic pages once on a phone for sentences that read wrongly around numbers and times. Every Latin or numeric run is isolated automatically in the emails and in some of the on-screen strings, but not in all of them, and only a human can tell whether the sentence reads right either way.
- [ ] **Re-run all three audits unconditionally once the real Arabic has landed.** `scripts/check-ltr-runs.js`, `scripts/audit-contrast.js` and `scripts/check-overflow.js` are snippets to evaluate in the browser console of each page (foreground the tab and wait for the page to finish loading first), at 360, 768 and 1440 in both locales. This is the first moment the unisolated-run walk means anything: it has only ever run against placeholders and Arabic filler, which contain no Latin. Real translation introduces exactly the thing it looks for: "Court House+", "CSV" or a number left bare in plain message text. A hit is a string whose render site does not isolate its Latin, so the fix is in the code: wrap that site in `<RichText>`, or add the tag to **both** `ar.json` and `en.json` yourself. Do not ask the translator to add a tag — `launch-check` rejects an Arabic string whose tags differ from the English.
- [ ] **Look at the Arabic emails by hand.** The audits only walk `html[lang="ar"] main`, so the Arabic HTML emails (confirmation, cancellation, and the interviewer notification if `INTERVIEWER_LOCALE=ar`) are outside every automated check. Open each in a real mail client and check times, the phone number and the brand sit correctly in the right-to-left text.

## 8. Thursday 26 November

- [ ] Venue address, the other client-supplied strings and the Reply-To address are in (all due today; Friday is the weekend).
- [ ] **Calendly go/no-go**, in the afternoon while someone at Court House+ can still be reached. Tell the client in one plain sentence that Calendly is the fallback if the portal is not ready.

## 9. Shutdown

The portal holds applicants' names, emails and phone numbers for a four-day event and must not outlive it.

- [ ] After Saturday, **export the data twice**: the CSV from the portal and a database export from Atlas. Hand both to Court House+ and confirm they can open them.
- [ ] **Agree a deletion date in writing with Court House+ before launch** and write it here: **deletion date: ____________** (a suggestion: two weeks after the event, Saturday 12 December 2026, once both exports are confirmed received).
- [ ] On that date, **delete the Atlas cluster** and **delete the Vercel project**, so no copy of the data remains in either service. Revoke the Resend API key, and remove the sending domain if it was created only for this.
- [ ] Discard `INTERVIEWER_PASSWORD` and `SESSION_SECRET`.
