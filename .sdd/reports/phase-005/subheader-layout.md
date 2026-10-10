# Owner-directed layout correction — 2026-10-10

Intent: preserve the main header, move project sections into a horizontal subheader with icons, avoid double sidebars, retain one phase navigator, make logo consistently return to About/home, put signed-in workspace below the hero before profiles, use compact profile cards and vertically stacked profile detail reading.

Implementation changes only visual composition and home navigation. Existing project/profile interactions and source provenance remain. Owner requested these changes directly; no new acceptance or release is inferred.

Verification: production build and all five Chromium journeys passed, including responsive widths, signed-in logo destination, hero/workspace/profile ordering, six navigation icons, project tab bar above content, and profile panels stacked vertically. Raw outputs: `.sdd/evidence/phase-005/subheader-layout/`. Synthetic phase screenshot visually inspected; main content now spans the workspace beside its single phase navigator.
