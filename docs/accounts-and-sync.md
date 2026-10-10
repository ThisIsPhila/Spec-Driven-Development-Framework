# Accounts and cross-machine snapshots

The local workspace remains usable without accounts. Register explicit project roots with repeated `--project` arguments; no browser endpoint can register an arbitrary filesystem root. File changes are extracted automatically and sent to the browser.

The optional account service uses Node.js 22.13+ built-in SQLite, scrypt password hashing, hashed expiring session/connector credentials, HttpOnly SameSite cookies, same-origin checks, and owner-isolated project queries. SQLite is experimental in Node 22. Persist the database on a backed-up private volume. An account email is a login identifier, not an email-verification claim.

```sh
npm --prefix visual ci
npm --prefix visual run build
SDD_ACCOUNT_DATABASE="$PWD/.sdd/local/accounts.sqlite" npm --prefix visual run accounts
```

Open `http://127.0.0.1:3457`, select Sign in → Create account, and choose your own email/password (minimum 12 characters). The dialog validates email format and shows the 12–256 character signup password requirement before submitting. It preserves entries after failures, distinguishes duplicate signup from incorrect login, reports connection failures and rate limits, and confirms successful signup/sign-in. New accounts start empty. Public fictional projects are examples only; they are never silently added to your account.

Select **Connect machine** while signed in to issue a connector credential. Set these environment variables in the workspace process without putting credentials in Git:

```sh
export SDD_SYNC_URL=http://127.0.0.1:3457
# Set SDD_SYNC_TOKEN to the credential displayed in your authenticated browser.
# SDD_DEVICE_ID is optional; the CLI otherwise persists a random machine ID locally.
npm --prefix visual run workspace -- --project /absolute/project-one --project /absolute/project-two
```

The CLI publishes changed snapshots automatically. Publication failure is reported and retried; it does not interrupt local reading. Account browsers poll private snapshots. The receiving service does not read the publishing machine's filesystem. Published source documents can be opened from their snapshot, and local absolute path metadata is made relative. Document bodies remain the project owner's private data. Raster media is currently delivered by the local service only; cloud media uploads are not implemented. Remote publication requires HTTPS; loopback HTTP is permitted for development.

For hosting, set `SDD_PUBLIC_ORIGIN` to the exact HTTPS origin, `SDD_ACCOUNT_HOST` to the listening interface, `PORT`, and `SDD_ACCOUNT_DATABASE` to a persistent private volume. Put a TLS reverse proxy in front. No hosting provider, domain, or remote service has been provisioned by this implementation. Anonymous local viewing works even if the account service is unavailable.

Sessions expire after one day; connector credentials after 30 days. Sign out revokes the current session. Connect machine → Revoke all machine credentials invalidates every connector credential for that account. This version has no password reset, email verification, collaboration roles, billing, or bidirectional filesystem edits. Those are separate product scope, not implied by a working account login. Snapshot uploads have an 16 MiB request limit. Back up the SQLite database before replacing the service.

For a local owner evaluation, the account server also accepts repeated `--project` roots. Its first launch gives a private bootstrap fragment. Only signing in or registering through that private link claims those projects; other accounts see none of them. Ownership is persisted, subsequent launches preserve it, and those projects refresh automatically while the server runs. This is a local onboarding convenience; remote machines publish through connector credentials.

```sh
SDD_ACCOUNT_DATABASE="$PWD/.sdd/local/accounts.sqlite" npm --prefix visual run accounts -- --project /absolute/project-one --project /absolute/project-two
```
