# Signup/login feedback correction

Owner-directed Phase 005 bug correction: separate authentication outcomes and make failures actionable while preserving the existing local account architecture and private projects.

Observed: the dialog did not disclose signup password length, sent invalid fields, lacked a busy state, used one generic API error for signup/login/duplicate email, and left fetch failures unhandled. Live local database count was zero users before service restart; no owner credentials were read, entered or changed.

Implemented: email/password validation and focus; password visibility; disabled actions during requests; connection timeout and retry feedback preserving entries; explicit duplicate email (409), incorrect login (401), signup validation (400), existing rate-limit feedback; successful account/sign-in notice; explanation of local identity and private-link project connection.

Local result: PASS — 28 unit/integration tests, 4 Chromium journeys and production build. The added browser case exercises invalid email, short signup password, aborted connection with preserved input, incorrect credentials, successful registration, duplicate registration and successful login in an isolated in-memory account service. Raw outputs live in .sdd/evidence/phase-005/account-feedback/. This is local functional evidence, not owner acceptance or hosted production authentication.

The service was restarted with the same private SQLite database and the same three explicitly authorized project roots. Unclaimed bootstrap credentials are intentionally process-scoped and rotated on restart; the owner receives a fresh link. No private tokens are committed.
