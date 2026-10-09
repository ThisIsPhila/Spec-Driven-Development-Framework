# Phase 005 implementation critique

Date: 2026-10-09. Assessed source HEAD: `6f505a2`. Review only; no implementation changes.

## Verdict

The direction is useful: a dedicated phase navigator, grouped framework domains, full-document reading, script previews, and evidence views address the original need. The implementation is not ready to claim complete requirements compliance. Its main risk is that a polished interface converts missing information, references, and static assumptions into apparently verified facts. This directly undermines the accountability the product is intended to provide.

## Review method and limits

Read the supplied Antigravity conversation, approved Phase 005 artifacts, current extraction/service/rendering code, tests, hook source, and Phase 005 verification records. Inspected the live localhost site in the in-app browser, including phase overview, tasks, automation and public landing. Tested mobile landing at 390×844 and restored the viewport. Ran existing visual tests: 17/17 pass outside the sandbox; initial sandbox run could not bind its temporary localhost server. Reproduced data-model and file-boundary failures using disposable synthetic files only, then removed them. Did not access sensitive files, change consumer projects, deploy, or run a production exploit. Did not rerun the entire Bash suite or a production build. Browser observations and current-source findings are distinguished below.

The live page reports `7c03996` as its last checked tree, while source HEAD is `6f505a2`. That value is synthesized from Git metadata rather than a recorded hook run, and the service does not reliably refresh Git-only changes. Do not use it as verification provenance.

## F1 — Fabricated hook telemetry (P1)

`visual/server/extract.js:972` builds five fixed gate entries with PASS, Every commit, and enforced=true. It sets lastRunTimestamp to extraction time, lastCommitChecked to Git HEAD, and passRate to 100%. There is no execution log or denominator. A synthetic project with no installed hook still received a 100% telemetry pass rate. The live Scripts & Hooks view displays those fields as observed telemetry.

The actual hook invokes doctor and optionally skills validation, and skips checks if script paths are missing. Hook presence is not proof it is executable, configured for this checkout, invoked, or impossible to bypass. Detection assumes `.git/hooks/pre-commit`; it does not resolve worktree Git directories or core.hooksPath. Every rules file is also assigned the same enforcement claim at `extract.js:840`, without proving that its clauses are enforced.

Correction: distinguish detected file, executable/configured hook, declared gates, and recorded executions. Until execution logging exists, show “Execution history not recorded”; last run and pass rate must be unknown. Future logs should record invocation, actor/environment, revision/tree, command, timestamp, outcome, and bypass/skip state. Verify projects with missing/non-executable hooks, alternative hook paths, worktrees, skipped gates, and failing runs.

## F2 — Evidence references become verification and missing results become PASS (P1)

`extract.js:273` defaults missing result to PASS and limitations to None. Metrics treat every result not matching fail/error as passing, so pending, unknown, skipped, or inconclusive can count as success. Traceability calls an ID mention “verifies”; matrix rows become VERIFIED when an evidence reference exists and IMPLEMENTED when a task mapping exists, even if the task is pending.

Synthetic reproduction: a todo task and a note saying “REQ-001.1 is under investigation” yielded a VERIFIED requirement, PASS evidence, and no limitations. `parseAcceptanceCriteria` also marks every nonempty tasks.md completion-criteria line done=true, including “Owner accepts the product,” with no acceptance observation. These are stronger claims than the source supports. The live Phase 005 overview gives 95/100 EXCELLENT despite unmet requirements discovered in this review.

Correction: model links as references, task state as recorded execution state, and verification as a separately supported outcome. Unknown result/limitations remain unknown. Acceptance starts unassessed unless explicit evidence supports it. Replace the health grade with explainable completeness indicators, or label any retained score as a heuristic, never assurance. Test missing/pending/skipped/failing results, unfinished tasks with evidence mentions, and absent owner acceptance.

## F3 — Local file isolation is bypassable (P1)

`visual/server/service.js:225` checks string-prefix containment, follows symlinks through stat/readFile, and lets authenticated clients request any project file, rather than allowlisted framework artifacts. A disposable symlink inside a registered synthetic project pointing to a synthetic file outside it returned HTTP 200 and the outside content. Prefix containment also fails to distinguish sibling paths sharing the project name. Extraction follows several file paths without canonical boundary checks or read limits.

Correction: canonicalize the root and every target, use path.relative containment, reject symlink escapes, and allow only declared supported artifacts and evidence. Validate before reading and report errors without crashing the server. Serve source as text/plain with nosniff and media with safe MIME types. Test sibling-prefix traversal, symlink escapes, directories, missing files, oversized files, unrelated repository files, and project isolation.

The server also sends wildcard CORS and does not validate Origin/Host (`service.js:126`). Tokens are embedded in API query strings, including SSE URLs, and launch URLs use query tokens. Tokens still protect unauthenticated requests; the finding is not that arbitrary websites automatically possess them. The broad CORS and URL credentials weaken the intended boundary if a token is exposed. Use same-origin checks, restrictive headers, fragment launch bootstrap, and header authentication where possible.

## F4 — Source metadata bypasses Markdown sanitization (P1)

Many views interpolate phase titles, task titles, acceptance text, evidence metadata, rule/report labels, and graph identifiers directly into HTML strings consumed by innerHTML. DOMPurify is applied to rendered Markdown, not the full assembled view. A crafted project title or extracted criterion can therefore inject markup outside the sanitizer. This was identified by code inspection; no browser exploit was executed.

Correction: use textContent for labels and escape text/attribute values at every string-template boundary. Keep Markdown and trusted application SVG rendering separate. Mermaid output is inserted directly and should follow the approved sanitization/configuration restrictions. Current Node sanitization tests run a regex fallback rather than the browser DOMPurify path; passing them does not validate browser rendering safety. Add DOM/browser tests for malicious titles, criteria, graph IDs, event handlers, and unsafe URLs.

## F5 — Traceability and task controls are visibly incomplete (P1)

`specView.js:96` expects relationship fields from/type/to, whereas extraction emits fromId/label/toId. Real extracted task cards omit requirement badges even when relationships exist. The synthetic demonstration uses a different shape, masking the problem. A reproduction confirmed the real-model task card lacked REQ-001.1.

Live browser observation: clicking Pending (0) on Phase 005 left all six completed cards visible. There is no task-filter event binding, and the new phase canvas always supplies filter='all'. Task cards discard detailed contract metadata and offer no requirement/evidence navigation. Full raw rendered text is available below, but that makes the user reconstruct relationships manually.

The traceability graph has focusable role=button nodes but no corresponding navigation/keyboard binding. Markdown headings lack stable section IDs; relative links are not rewritten to project artifact navigation. Requirement/design views omit the source path and source action. These fail the central connected-reading journey.

Correction: share a single relationship schema, preserve full task contracts/source locations, wire filters and node activation, add stable section anchors and routable source links. Test real extracted fixtures end-to-end: requirement → task → evidence → source, plus keyboard and filter behavior.

## F6 — Public metrics are invented and positioning drifts (P1)

The landing page presents “Live benchmark,” “Verified Harnesses,” fixed error/compliance rates, 6.8M runs, profile distributions, and overlap percentages. They are literal arrays/constants in landingView.js, without visible synthetic labels or measurement provenance. The original first-build scope explicitly prohibited fabricated adoption statistics.

This also changes the product story into an agent benchmark directory. Users primarily need to discover and install the framework and understand their specifications visually. skills.sh should inform discoverability and installation, not justify fictional demand or comparative agent performance.

Correction: make the main catalog the actual framework profiles/workflows with descriptions, examples, supported composition and install commands. Remove unmeasured statistics and verified/official badges. If retained for visual exploration, clearly isolate them in a labeled synthetic demonstration, not the public product claim.

## F7 — Installation and copy commands are wrong (P1)

The hero points to a root main/setup.sh, but source setup lives at scripts/setup.sh and depends on the source payload. A one-file curl pipeline does not provide that payload. The copy handler repeats the same URL. Profile examples use comma-separated compositions and unsupported names such as fullstack/cloud; others combine two base profiles. The framework uses one of seven bases plus optional modifiers, with '+' syntax and full-stack spelling.

Scripts catalog proposes phase.sh close, which is not the lifecycle's finish/archive vocabulary, and root scripts paths that need a consumer-aware explanation. Copy controls must not imply that all module scripts are runnable CLI commands.

Correction: use the proven clone-and-setup flow and supported consumer .sdd/scripts commands. Validate displayed and copied text against the real CLI in disposable projects; do not merely assert that a curl string exists, as the current public test does.

## F8 — Mobile layout fails despite responsive claims (P1)

At 390×844 the landing page's document scroll width was 1,162px. The hero's measured width was about 315px but its scroll width was 1,125px. Header content overflowed and hero text/buttons extended beyond the viewport. The leaderboard correctly had its own 620px horizontal scroller; the page-wide overflow came from elsewhere. Desktop navigation also crowded the long account/project breadcrumb and six domains into a fixed header, clipping later labels in the observed viewport.

Correction: contain overflow at intentional table/code/graph scrollers only; ensure grid children can shrink and wrap. Introduce a compact domain menu or persistent side navigation at intermediate widths, and shorten project identity with accessible full text. Test 320, 390, 768, 1024, and desktop widths with document scrollWidth <= viewport width, readable CTAs, keyboard access, and local horizontal graph/table scrolling.

## F9 — Live sync and identity claims overstate actual capabilities (P2)

The account identity comes from local git config user.name/email, not an account session. SYNCED is initially derived from token presence, with copy claiming simultaneous account synchronization. This is a local read service; it neither authenticates an account nor synchronizes to hosted storage.

Server polling returns its cached snapshot without extraction. If recursive fs.watch is unavailable, the catch is empty, so client polling does not provide an effective fallback. Git/hooks/docs changes outside .sdd are not watched; hook metadata is not in the revision digest. Extractions synchronously spawn five Git commands and read the entire project model on .sdd changes, with no scan/file limits. A full innerHTML rerender restores window scroll only, losing focus and nested scroll/expanded state. Exact five-second update behavior is not covered by the tests.

Correction: label Local workspace / Connected / Last read time accurately; read canonical state and surface conflicts. Add server refresh fallback, complete revision inputs, bounded scanning, scoped UI updates, and timed mutation tests. Git HEAD equality alone cannot prove fresh evidence in a dirty working tree.

## F10 — Phase and project scaling is claimed rather than verified (P2)

Moving phases out of the header is the correct fix. The sidebar supports scope/name/task/requirement search, but tests do not create 50+ phases or measure actual interaction performance. Search rerenders the whole app for every keystroke. Phase names retain “— Requirements” and redundant long slug fragments, making scanability poor. Active folder membership is conflated with actual sprint state; active-context prose does not reliably match phase folder IDs, and .sdd/state is not read.

Phase 001 is archived but displayed as 0/0 tasks and 0% progress. That should be “Task format not recognized” rather than 0% when historical syntax is unsupported. “Burndown” is a static completion grid, not a time-series burndown chart.

The CLI retains only the last repeated --project argument, and project IDs use basename, so two identically named project directories collide. Correction: repeatable project registration with unique opaque IDs, normalized descriptive names, historical-format diagnostics, actual sprint metadata, and large synthetic fixtures.

## F11 — Not every framework artifact is extracted; Graphify is a synthesized hierarchy (P2)

The extractor is regular-expression and filesystem code, not an AST engine. It scans fixed requirements/design/tasks filenames and selected evidence Markdown directories, not arbitrary phase attachments. phase.json is not parsed. Evidence images are not rendered; the sanitizer disallows img and the artifact endpoint reads binary files as UTF-8. Docs/templates scanning is shallow; governance exceptions and coordination records have no complete dedicated coverage.

extractGraphify constructs nodes from rules, phases, tasks, and evidence. It does not invoke Graphify or read a Graphify output. Some edges are universal assumptions, such as hook enforces constitution and evidence verifies phase. Call this a derived artifact map unless actual Graphify integration and provenance exist. Distinguish inferred organizational links from explicit source contracts.

Correction: publish an artifact coverage matrix with supported/partial/unsupported types. Add recursive supported discovery, safe media delivery, and source-provenance links. Do not present a missing parser field as “No future work” or “Zero blocking limitations.”

## F12 — Current passing tests do not justify full completion (P1)

17/17 tests pass when localhost binding is available. They mostly inspect strings and synthetic object presence. The test named “contentRevision reflects changes” never changes a file; it compares two identical snapshots. The “50+ phases” test checks for an input ID, not 50 phases. Several tests assert the presence of invented enforcement/telemetry fields, thereby protecting the defect. No Playwright browser suite is configured. Security tests cover missing token and one traversal input, not symlink/origin/allowlist attacks.

The verification manifest refers to earlier trees and often lists implementation files as verification references. The newer navigation/hooks/Graphify work lacks equivalent current-tree behavioral evidence. All six tasks are checked complete even though key positive/negative checks remain unmet. Findings should reopen affected tasks or be tracked in a corrective phase, not silently retain a blanket complete verdict.

Correction: add independent behavior tests for the failures above, retain a real browser journey, record raw outputs and exact source tree, and distinguish local test results from owner acceptance. Passing source-presence tests should never establish runtime capability.

## Recommended remediation order

1. Correct false PASS/VERIFIED/acceptance/telemetry semantics and remove fabricated public metrics.
2. Fix filesystem boundaries, origin/token handling, unsafe metadata interpolation, and media serving.
3. Repair real extracted traceability, task filters, detailed contracts, source links, and deep navigation.
4. Fix mobile/header overflow and validate 50+ phases and repeated project registration.
5. Complete accurate artifact coverage and live refresh/focus behavior.
6. Run behavioral/browser checks on the resulting tree and replace completion claims with evidence-backed status.

Maintain the useful visual structure already built. The next iteration should deepen correctness and connected reading, rather than adding further dashboards. Review actions taken here changed no implementation files.
