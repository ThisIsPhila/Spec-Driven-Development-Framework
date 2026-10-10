# Phase insight and graph critique — 2026-10-10

Owner requested rebuild of other agents' latest changes, compact top-level phase insights, clean UI statuses and expanded interactive graphs. Existing uncommitted index/style work is preserved.

Observed gap: duplicated metrics below graph; oversized lifecycle; bounded graph with fixed row alignment; connections lack endpoint inspection. Correction: lifecycle/counts/task progress precede graph; responsive bounded metric containers; emoji-free lifecycle labels; graph expansion dialog with scrollable full-size SVG, source node navigation, edge endpoint feedback and related-node emphasis. Task ordering within graph follows linked requirement position rather than independent rows.

Phase dependency mapping must derive explicit declarations, not phase numeric order. This iteration does not infer scheduling dependencies or claim a missing dependency means independence. Graphify exported layouts remain imported as supplied.

All phases now displays explicit phase.json dependencies/dependsOn arrays as a navigable graph. Unknown declarations and explicitly empty lists are distinct. Missing targets are not rendered as resolved edges. Resources topology uses a deterministic connected spring/repulsion layout rather than grid placement; imported edge provenance remains unchanged.

Verification: 31 unit tests and five Chromium journeys pass; production build succeeds. Browser journey expands phase SVG, focuses an edge, observes endpoint feedback and closes the dialog. Responsive checks pass. Rebuilt working tree includes other agents' existing uncommitted styles/index changes; those are preserved separately from this correction. Raw outputs in `.sdd/evidence/phase-005/graph-inspection/`. Owner acceptance remains pending.
