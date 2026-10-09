# Demo Account

A shared sample account lets a visitor try Finder without creating an account or
preparing a resume. It is optional and configured per deployment.

## Configuration

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_DEMO_EMAIL` | Public, inlined at build | Demo account email |
| `NEXT_PUBLIC_DEMO_PASSWORD` | Public, inlined at build | Demo account password |

When both are set, the demo button appears in two places: the marketing hero,
where it replaces "Explore jobs", and the login page, below the Sui sign-in
button.

When either value is missing, the button is not rendered. In the hero, the
original "Explore jobs" button is rendered instead, so the layout never loses a
call to action.

Because these are `NEXT_PUBLIC_*` values, they are inlined into the client bundle
at build time. Changing them requires a redeploy.

## Security posture

- The credentials are public by design. Anyone who can click the button can
  already sign in with it.
- **Never store real user data in this account.** Treat it as synthetic and
  disposable.
- Keep it separate from the accounts used as hackathon evidence, because visitors
  can modify it.
- There is no server-side session minting. The button uses the same
  `signInWithPassword` path as the login form.

## Preparing the account

1. Create the user in the Supabase dashboard, under Auth, with email confirmation
   enabled, so no confirmation email is needed.
2. Sign in as that account and complete onboarding with a synthetic resume that
   has clear experience, education, and skills sections. A thin document is
   rejected by the non-resume heuristic.
3. Confirm the Career Profile so matching uses a confirmed version.
4. Add around ten memories, for example with `/remember`, so the memory surfaces
   have content.
5. Capture the evidence report before opening the demo, so the demo cannot change
   the submission evidence.

## Resetting the demo

```bash
npx tsx --env-file=.env.local scripts/reset-demo-account.ts --yes
```

The script clears conversations, memories, saved jobs, feedback, and telemetry for
the demo account. It keeps the account, its profile, and the uploaded resume. It
refuses to run without `--yes`.

Run it before judging.

## Known limitations

- Everyone shares one account, so chat sessions, memories, and saved jobs are
  shared and can change while a visitor is looking at them.
- Rate limits are per account, so concurrent visitors share the chat limit of 12
  messages per minute and the MemWal write budget.
- There is no demo badge inside the app. The clarification lives next to the
  button on the marketing hero and the login page.

## Related

- [setup.md](setup.md)
- [../architecture/data-ownership.md](../architecture/data-ownership.md)
