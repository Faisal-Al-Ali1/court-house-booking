# Court House+ interview booking

A bilingual, Arabic-first booking portal: thirty fifteen-minute in-person interview slots on Saturday 28 November 2026, one interviewer, a public link with no login.

- `npm run dev` runs it locally. It needs `MONGODB_URI`, `MONGODB_DB`, `SESSION_SECRET` and `INTERVIEWER_PASSWORD` in `.env.local`; the mail variables are optional locally (sends fail quietly).
- `npm test` runs the `node --test` suite (correctness only; it stays green).
- `npm run launch-check` is the launch gate: **red on purpose** until the client's copy replaces every `TODO` in `messages/`, naming the keys that remain. It is not part of `npm test` or the build.
- `node scripts/ensure-indexes.mjs` creates the two unique indexes the no-double-booking guarantee rests on.
- `docs/client-copy-needed.md` is what to send the client. `docs/deploy-checklist.md` is everything deployment needs that code cannot do.
- `docs/rulings.md` is every decision taken on your behalf, with what each costs if wrong. `docs/deferred-findings.md` is the 51 findings raised during the build and deliberately left, nine of which want a human at the rehearsal.
- `CLAUDE.md` records the reasoning and the traps.
