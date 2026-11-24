# Copy needed from Court House+

Everything below blocks launch. The portal is Arabic-first, and nearly every Arabic string is still an English placeholder that renders on screen prefixed with `TODO-AR:`. `npm run launch-check` fails on purpose until none remain.

## Questions to settle first

1. **Does Court House+ have an Arabic organisation name?** Or does the brand stay in Latin letters, "Court House+", in both languages? Today it is Latin in both.
2. **Which language should the interviewer's notification emails use?** The email that tells the interviewer about each new booking currently defaults to Arabic. Changing it is one environment variable (`INTERVIEWER_LOCALE=en`), so either answer is cheap.
3. **The venue map link.** Please send a `maps.app.goo.gl` short link (Google Maps, Share, Copy link). A short link avoids any trouble with long addresses that contain braces or apostrophes. Until it arrives the map link is hidden, deliberately.
4. **The venue name and address, in both Arabic and English.** The English address in the portal today is a marked placeholder and must not reach applicants.
5. **The Reply-To address** that applicants' replies to the confirmation email should reach.
6. **Where should a 31st applicant be pointed?** When every time is booked, the "All interview slots are taken" screen is the only thing that applicant sees, and there is no self-service lookup. It currently says "please contact Court House+" without saying how. Is the Reply-To address (question 5) the right place to send them, or is there a phone number or other address? Whatever you choose will be added to that screen.

## Required: the data-protection notice

The consent checkbox (`booking.fields.consent`) says applicants agree to the use of their details "as set out in the data-protection notice". That notice does not exist yet and must be written and approved, in Arabic and English. The substance is already decided; the client only needs to approve the wording. It must say:

- **Who collects the data:** Court House+, as the organisation running the interviews.
- **Who holds it:** a developer contracted by Court House+ holds it on Court House+'s behalf, in a hosted database, for the length of the event.
- **What is collected:** full name, email address and phone number, and the chosen interview time.
- **What it is used for:** only to arrange and run the interview (confirmation and cancellation emails, the interviewer's schedule), and for nothing else.
- **When it is deleted:** after the event, once the data has been handed to Court House+. State the date once it is agreed (see the shutdown step in `docs/deploy-checklist.md`).
- **A contact:** where an applicant can ask about their data (the Reply-To address is the natural choice).

English sketch for approval:

> Court House+ collects your name, email address and phone number to arrange and run your interview. The details are held for Court House+ by a contracted developer, are used only for this purpose, and are deleted after the event on [date]. To ask about your details, contact [address].

The notice is shown directly under the consent checkbox from the message key `booking.fields.privacyNotice`, which holds a placeholder today. When the approved wording arrives it is a message-file edit in `ar.json` and `en.json` and nothing more. (The checkbox sentence, `booking.fields.consent`, can stay as it is.)

## Venue (needs the client's real values)

| Key | English now | Where it appears |
|---|---|---|
| `venue.name` | Court House+ | Confirmation screen, both emails to the applicant, and the calendar file |
| `venue.address` | TODO: paste the venue address here | Confirmation screen, both emails to the applicant, and the calendar file |
| `venue.mapUrl` | TODO: paste the venue map URL here | Confirmation screen, both emails to the applicant, and the calendar file |

Each of these is needed in Arabic (`messages/ar.json`) and in English (`messages/en.json`).

## Arabic strings to translate or approve (97)

Translate the English text. Strings are grouped by where the applicant or interviewer sees them. Where a string contains `{name}`, `{time}`, `{count}` and similar in curly braces, keep them exactly as written and place them where the Arabic grammar wants them; the portal fills them in.

**Tags: keep the ones that are there, and add none.** A few English strings contain tags such as `<n>...</n>`, `<who>...</who>` or `<call>...</call>`. Keep every tag that appears in the English text exactly as it is, and move it to wherever the Arabic grammar wants it. **Do not add a tag to a string that has none in English, and do not drop one that the English has.** Before launch the portal compares the Arabic file against the English one and refuses to start if any string's tags differ, so a tag added or lost in translation stops the launch rather than reaching a page. Latin text and digits are isolated automatically in every email, and in some of the strings shown on screen, but not in all of them: if an Arabic sentence reads badly because of a Latin word or a number sitting inside it, leave a note beside that string for the developer instead of adding a tag.

Exactly ten strings carry tags. They are marked **[TAGS]** in the tables below: `booking.stepOf`, `booking.grid.available`, `booking.grid.summary`, `booking.confirmed.body`, `confirmation.duration`, `interviewer.booked`, `interviewer.cancel.body`, `interviewer.cancel.notified`, `interviewer.cancel.notNotified` and `interviewer.cancel.gone`. In those ten the Arabic must end up with exactly the tags the English has — the same kinds, the same number of each — placed wherever the Arabic grammar wants them. Nothing more, nothing fewer, in these ten as in every other string.

### Every page (site metadata or navigation)

| # | Key | English text |
|---|---|---|
| 1 | `common.siteDescription` | Book your interview slot with Court House+. |

### Booking page header and step indicator

| # | Key | English text |
|---|---|---|
| 2 | `booking.intro` | Choose a 15-minute interview slot on Saturday 28 November 2026. |
| 3 | `booking.eventDate` | Saturday 28 November 2026 |
| 4 | `booking.stepOf` **[TAGS]** | `Step <n>{current}</n> of <n>{total}</n>` |
| 5 | `booking.stepDetails` | Your details |
| 6 | `booking.stepSlot` | Choose a time |
| 7 | `booking.loadFailed` | We could not load the available times. Please refresh the page. |

### Step 1, the applicant details form

| # | Key | English text |
|---|---|---|
| 8 | `booking.fields.name` | Full name |
| 9 | `booking.fields.email` | Email address |
| 10 | `booking.fields.phone` | Phone number |
| 11 | `booking.fields.consent` | I agree that Court House+ may use these details to arrange and run my interview, as set out in the data-protection notice. |
| - | `booking.fields.privacyNotice` | The data-protection notice (see the required section above); shown under the consent checkbox |
| 12 | `booking.fields.continue` | Choose a time |

### Step 2, the time-slot picker

| # | Key | English text |
|---|---|---|
| 13 | `booking.grid.legend` | Interview times |
| 14 | `booking.grid.morning` | Morning |
| 15 | `booking.grid.evening` | Evening |
| 16 | `booking.grid.break` | Break |
| 17 | `booking.grid.available` **[TAGS]** | `<n>{count}</n> of <n>{total}</n> times available` |
| 18 | `booking.grid.taken` | Taken |
| 19 | `booking.grid.past` | Passed |
| 20 | `booking.grid.selected` | Selected |
| 21 | `booking.grid.summary` **[TAGS]** | `Your slot: <n>{time}</n>` |
| 22 | `booking.grid.noneSelected` | Select a time to continue. |
| 23 | `booking.grid.back` | Edit my details |
| 24 | `booking.grid.confirm` | Confirm booking |
| 25 | `booking.grid.confirming` | Confirming… |

### Confirmation screen after booking

| # | Key | English text |
|---|---|---|
| 26 | `booking.confirmed.title` | You are booked |
| 27 | `booking.confirmed.body` **[TAGS]** | `Your interview starts at <n>{time}</n>.` |
| 28 | `booking.confirmed.note` | Please arrive a few minutes early. |

### Page shown when every slot is taken

| # | Key | English text |
|---|---|---|
| 29 | `booking.fullyBooked.title` | All interview slots are taken |
| 30 | `booking.fullyBooked.body` | Every time on Saturday 28 November 2026 has been booked or has passed. If you still need an interview, please contact Court House+. |

### Inline error message on the booking form

| # | Key | English text |
|---|---|---|
| 31 | `booking.errors.nameRequired` | Please enter your full name. |
| 32 | `booking.errors.nameTooLong` | Name is too long (120 characters maximum). |
| 33 | `booking.errors.emailInvalid` | Please enter a valid email address. |
| 34 | `booking.errors.phoneRequired` | Please enter a valid phone number. |
| 35 | `booking.errors.phoneTooLong` | Phone number is too long (24 characters maximum). |
| 36 | `booking.errors.slotInvalid` | Please choose a valid interview slot. |
| 37 | `booking.errors.slotPast` | That slot is no longer available. Please choose another. |
| 38 | `booking.errors.consentRequired` | Please agree to the use of your details to continue. |
| 39 | `booking.errors.slotTaken` | Sorry, that slot has just been taken. Please choose another. |
| 40 | `booking.errors.alreadyBooked` | This email address already has a booking. |
| 41 | `booking.errors.unexpected` | Something went wrong. Please try again. |

### Confirmation screen and the calendar file

| # | Key | English text |
|---|---|---|
| 42 | `confirmation.eventSummary` | Court House+ interview |
| 43 | `confirmation.dateLabel` | Date |
| 44 | `confirmation.durationLabel` | Duration |
| 45 | `confirmation.duration` **[TAGS]** | `<n>{minutes}</n> minutes` |
| 46 | `confirmation.venueLabel` | Venue |
| 47 | `confirmation.openMap` | Open in maps |
| 48 | `confirmation.addToCalendar` | Add to calendar |
| 49 | `confirmation.calendarHint` | Downloads a calendar file you can open on your phone or computer. |
| 50 | `confirmation.timeLabel` | Time |

### Footer or detail row of the emails sent to applicants

| # | Key | English text |
|---|---|---|
| 51 | `email.durationValue` | {minutes} minutes |
| 52 | `email.footer` | You received this message because you applied to Court House+. It was sent on behalf of Court House+ from a different address, and replying to it reaches the Court House+ team. |

### Email sent to the applicant when they book

| # | Key | English text |
|---|---|---|
| 53 | `email.confirmation.subject` | Your Court House+ interview is booked |
| 54 | `email.confirmation.heading` | You are booked |
| 55 | `email.confirmation.greeting` | Hello {name}, |
| 56 | `email.confirmation.intro` | Your interview with Court House+ is confirmed. These are the details. |
| 57 | `email.confirmation.calendar` | A calendar file is attached so you can add the interview to your calendar. |

### Email sent to the interviewer for each new booking

| # | Key | English text |
|---|---|---|
| 58 | `email.notification.subject` | New interview booking at {time} |
| 59 | `email.notification.heading` | New interview booking |
| 60 | `email.notification.intro` | An applicant has booked an interview slot. |
| 61 | `email.notification.nameLabel` | Name |
| 62 | `email.notification.emailLabel` | Email address |
| 63 | `email.notification.phoneLabel` | Phone number |
| 64 | `email.notification.footer` | Sent automatically by the Court House+ booking portal. |

### Email sent to the applicant when the interviewer cancels

| # | Key | English text |
|---|---|---|
| 65 | `email.cancellation.subject` | Your Court House+ interview has been cancelled |
| 66 | `email.cancellation.heading` | Your interview is cancelled |
| 67 | `email.cancellation.greeting` | Hello {name}, |
| 68 | `email.cancellation.intro` | Your interview slot has been released and is no longer booked. The time below is no longer valid. |
| 69 | `email.cancellation.rebook` | If you would like another time, please contact Court House+ or book again if times are still available. |

### Interviewer sign-in page

| # | Key | English text |
|---|---|---|
| 70 | `interviewer.signIn.title` | Interviewer sign-in |
| 71 | `interviewer.signIn.intro` | Enter the interviewer password to see the schedule. |
| 72 | `interviewer.signIn.passwordLabel` | Password |
| 73 | `interviewer.signIn.submit` | Sign in |
| 74 | `interviewer.signIn.submitting` | Signing in… |
| 75 | `interviewer.signIn.wrong` | That password is not right. Please try again. |
| 76 | `interviewer.signIn.unavailable` | Sign-in is not available right now. Please tell the site administrator. |

### Interviewer schedule page

| # | Key | English text |
|---|---|---|
| 77 | `interviewer.title` | Interview schedule |
| 78 | `interviewer.booked` **[TAGS]** | `<n>{booked}</n> of <n>{total}</n> booked` |
| 79 | `interviewer.nextUp` | Up next |
| 80 | `interviewer.noneUpcoming` | No more interviews booked today. |
| 81 | `interviewer.openSlot` | Open |
| 82 | `interviewer.export` | Download CSV |
| 83 | `interviewer.loadFailed` | We could not load the schedule. Please refresh the page. |
| 84 | `interviewer.columns.time` | Time |
| 85 | `interviewer.columns.applicant` | Applicant |
| 86 | `interviewer.columns.action` | Action |

### Interviewer schedule, cancel dialog and result banners

| # | Key | English text |
|---|---|---|
| 87 | `interviewer.cancel.label` | Cancel the booking for {name} |
| 88 | `interviewer.cancel.title` | Cancel this booking? |
| 89 | `interviewer.cancel.body` **[TAGS]** | `<who>{name}</who> at <n>{time}</n> will be cancelled and emailed. This cannot be undone.` |
| 90 | `interviewer.cancel.keep` | Keep booking |
| 91 | `interviewer.cancel.confirm` | Cancel booking |
| 92 | `interviewer.cancel.confirming` | Cancelling… |
| 93 | `interviewer.cancel.failed` | The booking could not be cancelled. Please try again. |
| 94 | `interviewer.cancel.notified` **[TAGS]** | `Slot freed. <who>{name}</who> has been emailed.` |
| 95 | `interviewer.cancel.notNotified` **[TAGS]** | `Slot freed, but we could not email <who>{name}</who>. Please contact them on <call>{phone}</call>.` |
| 96 | `interviewer.cancel.dismiss` | Dismiss |
| 97 | `interviewer.cancel.gone` **[TAGS]** | `The booking for <who>{name}</who> was already cancelled.` |

## Arabic that is not in the messages file

The 404 page (`src/app/not-found.tsx`) has no translation provider, so its Arabic is written in the source. It was drafted by the developer and has not been reviewed by a native speaker. Please approve or correct:

- الصفحة غير موجودة
- الصفحة المطلوبة غير موجودة أو تم نقلها.
- العودة إلى الصفحة الرئيسية

The few Arabic strings already in the messages file (`common.skipToContent`, the separator in `venue.fullLocation`) were also drafted by the developer and are worth a glance.
