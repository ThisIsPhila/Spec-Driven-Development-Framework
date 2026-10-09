# Visual workspace review walkthrough

Use Node 22.13+ from the framework repository. Build once with `npm --prefix visual run build`, then run `npm --prefix visual run review`. Open the complete URL printed in the terminal, including its token fragment. This creates only a temporary synthetic project; it does not register personal projects or create an account. Leave that terminal running. Ctrl+C stops it and removes the fixture.

## Cases and expected results

| Case | Actions | Expected result |
| --- | --- | --- |
| Public catalog | Open the account site's public landing page, then Profiles. Try desktop and narrow window widths. | Ten supported profiles/modifiers, real icons, readable names/descriptions/commands, no `undefined` or overlapping labels. Public examples are fictional. |
| Phase navigation | In the review workspace, select Phase 001. Search `T001.2`; clear the search. Switch All/Active/Backlog. | Search identifies Phase 001; clearing restores two phases. Active has Phase 001; Backlog has Phase 002. No phase buttons overcrowd the header. |
| Connected reading | Open requirements.md, design.md, tasks.md and a source button. Open a requirement reference from a task. | Actual fixture documents and source text appear. Requirement reference opens the corresponding requirements document. Design renders a Files → Extractor → Viewer Mermaid diagram. |
| Task filters | In tasks.md, choose All, Pending and Completed. | All has two tasks; Pending has T001.2; Completed has T001.1. These are recorded checkbox states, not independently verified completion. |
| Phase graph | Select Phase 001 → Overview → Open Traceability Graph. Activate a requirement/task node. | Two requirements and two mapped tasks appear as connected nodes. The referenced evidence is linked where present. A node opens its source document. No live agent activity is needed. |
| Project graph | Docs & Templates → Graphify Network. | The fixture's three synthetic nodes and two edges appear. Provenance lists say SYNTHETIC_REVIEW. A real project without a Graphify export displays a separately labeled Derived Artifact Map. |
| Automatic updates | In another terminal, run the printed `node visual/scripts/review-workspace.js --complete <fixture-path>` command. Keep tasks.md open; then run the printed `--reset` command. | Within five seconds, T001.2 moves from Pending to Completed, progress changes from 50% to 100%; reset reverses it. No agent update or page reload. Search focus and open view remain stable. |
| Evidence truth | Open Evidence & Acceptance in Phase 001. | The synthetic note has references but no recorded test outcome. It must not become a PASS or independently verified acceptance. |
| Routes and layout | Refresh while on a specific phase/tab, use browser Back/Forward, resize to phone/tablet/desktop. | Selected phase/tab follows the URL. No page-wide overflow or overlapping labels. Long tab lists may scroll horizontally within their own navigation. |
| Optional account | Use the private bootstrap link supplied separately; create your own credentials, open a project, sign out. | Your configured three projects appear only after claiming them through that link. Signing out returns to the fictional public page. A separate ordinary account has no projects until connected. |
| Hook failure behavior | Run `bash tests/run.sh hooks` from the repository. | Disposable Git fixtures exercise real successful, failed and skipped gates; all assertions pass. This avoids creating test commits in your personal projects. |

The public demo is static and intentionally does not respond to filesystem edits. Use the temporary connected review workspace for automatic-update testing. The application is a read-only viewer; task status is changed through files/CLI, not by clicking a dashboard checkbox.

## Automated checks

- `npm --prefix visual test` — extraction, service boundaries, ownership, sync and skill-package behavior.
- `npm --prefix visual run test:browser` — actual browser journeys, catalog label/icon geometry, responsive containment and graph visibility.
- `bash tests/run.sh` — core framework CLI/install/hook compatibility.

Remote deployment and cross-machine hosting must be configured separately; a local account preview is not a hosted cloud destination. Graph relationships visualize recorded mappings; they do not independently prove implementation or test success.
