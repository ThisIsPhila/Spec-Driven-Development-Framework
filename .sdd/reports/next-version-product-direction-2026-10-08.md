# Next-version product direction

Date: 2026-10-08. Status: superseded exploratory assessment, not an approved specification.

Owner correction: Personal Multica usage, strategy agents, staffing, and model routing are outside this product. The next version focuses on the open-source framework itself, public access and adoption, and an HTML interface that extracts and visualizes project specifications, phase progress, and evidence. Markdown and HTML coexist during evaluation. Browser access is acceptable. The corrected product scope is in `.sdd/specs/active/phase-005-visual-framework-workspace/requirements.md`. Historical proposals below are retained as superseded research, not product direction.

## Project reality

The repository is a portable workflow engine distributed through Bash scripts, Markdown templates, profiles, and agent entrypoints. Its important asset is executable governance: ordered artifact approvals, stable task identities, validation, evidence boundaries, conservative upgrades, and explicit learning. It is not currently a visual application.

The checkout was clean before this exploration. Latest observed commit: `e3d36c7` (Phase 004). Framework metadata declares 2.0.0; project overview calls it a candidate and identifies 1.3.0 as stable. Phase 004 is archived and its closeout records local implementation/verification complete with owner review and publication pending. There is no active phase specification. The project overview, progress tracker, and placeholder active context are not fully reconciled; historical assessment findings must not be presented as current defects without checking the remediation ledger. No behavioral tests were run for this research task.

## Conversation grounding and limitations

The desktop read tool returned ten recent turns per named chat and reported no further cursor. This does not establish that the entire historical conversation was available.

- **Hackathon Analysis and Advice:** Accessible messages emphasize credible evidence, current circumstances, desired outcomes, missing capability, consequences, and the next useful action. The user corrects assumptions about project maturity and asks that explicit exploratory boundaries be preserved. The discussion also supports building one coherent system deeply rather than spreading across shallow features. The specific older SDD passage was not present in the returned messages. Phase 004's closeout independently attributes its failure classification and evidence-to-learning loop to that chat; that attribution is repository evidence, not a recovered quotation.
- **Compare AI Subscriptions:** The user explicitly frames SDD as guardrails, Multica as the configurable organizational substrate, and strategy agents as advisers whose consequential routing changes can require approval. Work authoring, staffing recommendations, execution, and final authority are distinct concerns. Contextual communication should preserve structured work underneath it.
- **Compare AI Model Workflows:** The discussion connects better specification and decomposition to bounded execution, and proposes specification → execution → evidence → decision → state transition. This is a useful architectural hypothesis. Model names, prices, vendor capabilities, and delegated subscription claims in historical assistant messages were not independently verified here and are not adopted as product requirements.

## Proposed product thesis

A visual workspace for humans and agents to turn intent into approved work, inspect what actually happened, and learn from the gap.

SDD can remain the methodology and compatibility layer while a broader product name houses the workspace, distribution site, integrations, and eventual runtime. The expanded ambition is plausible, but a new name alone does not establish demand. The first audience to test is developers or small teams using multiple coding agents who struggle with context continuity, reviewing specifications, and trustworthy completion claims.

## Markdown and HTML

Recommend introducing HTML as the human interface while retaining existing canonical artifacts initially. Semantic HTML is readable by agents, but JavaScript-generated interfaces may require browser tools; HTML adds markup and creates migration work for existing shell parsers, linting, templates, and integrations. Visual quality comes from the interface and interaction model, not the extension alone.

One phase should have a navigable overview, requirements, design, tasks, evidence, decisions, and learning. People should be able to move from a requirement to its implementation tasks and exact supporting evidence. Show unknown, blocked, awaiting approval, and locally verified states clearly. A checkbox cannot become a completion claim without supporting evidence.

Start with a read-only local view of actual `.sdd` artifacts. Later, an editor or approval button must call the canonical workflow engine and record the actor, artifact revision, decision, and time. Changes to approved content should have explicit approval-invalidation semantics. Avoid independent HTML and Markdown copies that can diverge. Structured metadata may support linking and rendering, but the ownership of each fact must be explicit; replacing all prose with JSON is not necessary.

## What to learn from skills.sh

Sources inspected: https://www.skills.sh/, https://www.skills.sh/docs, https://github.com/vercel-labs/skills.

The site connects explanation, searchable discovery, detail pages, installation, documentation, and adoption signals. Its documentation confirms that the CLI is open source; the inspected public repository is the MIT-licensed CLI. This review did not establish that the entire website implementation is open source.

Apply the discovery-to-adoption pattern: an understandable product promise, a working phase example, profile and workflow browsing, a clear installation path, compatibility guidance, and source links. A workflow/profile catalog can follow when reusable packages have real value. Installation counts indicate adoption, not correctness or outcomes. Do not make a marketplace a dependency of the initial workspace.

The public site and private project workspace serve different purposes. Public examples should be curated; private working specifications and evidence should not become public catalog content by default.

## Product layering

| Layer | Responsibility |
| --- | --- |
| Portable SDD core | Artifact contracts, lifecycle transitions, approvals, evidence, validation, learning |
| Visual workspace | Reading, editing, reviewing, explaining gaps, navigating history |
| Public site | Understanding, examples, documentation, discovery, installation |
| Integration adapters | Map external agents and orchestration tools onto canonical work |
| Optional future harness | Launch runs, manage context and tools, record execution, resume work |

Multica remains the intended organizational substrate in the user's ecosystem. Integrating SDD contracts with its work model should precede duplicating its agent organization. A custom harness becomes justified when a tested execution or context requirement cannot be met adequately by adapters. It should remain optional so users of existing agents retain the framework's value.

Probabilistic review or routing can recommend escalation and help interpret evidence. Deterministic validation and approval authority must govern transitions; confidence scores alone cannot certify that a requirement was satisfied.

## Recommended next work

Develop one coherent visual phase experience from an existing representative phase: understand intent, inspect design, follow tasks, inspect evidence, understand the gap, and see the next decision. Use actual artifacts so this tests product comprehension and data ownership together. Then add authoring and approval through the same engine, followed by a public demonstration and installation journey. Integrations and a harness follow demonstrated needs.

Success should be tested through users performing the review journey: can they identify the intended outcome, current state, blocking gap, evidence limits, and next action without hunting through files? Can an agent retrieve the same facts without a browser? Can existing CLI users continue their workflow? Does the visual surface reduce review effort without concealing uncertainty?

Before implementation, reconcile current phase/version state and create the next requirements artifact through the existing lifecycle. Formal requirements, design, and tasks approvals remain sequential. This exploration approves no migration, release, push, deployment, or harness build.
