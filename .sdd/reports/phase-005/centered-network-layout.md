# Centered artifact network layout

User-authorized correction to phase-005 visual workspace: imported artifact nodes were accumulating along hard canvas boundaries, leaving the centre empty.

Replaced peripheral ring seeding and hard clamps with deterministic spiral seeding, spring connections, central gravity, damped movement and aspect-preserving fit with margins. Removed legacy rectangular-node endpoint offsets. Resource graphs now fit available width without a fixed minimum or clipped height. Existing source data, topology display limits and interaction behavior are preserved.

Verification: 34 unit tests and 5 browser journeys pass; production build succeeds (existing large bundle advisory). New geometry regression covers 150 isolated nodes, a star and a chain; singleton and invalid-link behavior also tested. Inspected actual smart-trader imported Graphify graph (3000 source nodes, 6547 relationships; displayed subset 150 nodes, 188 edges) in the in-app browser before and after; after correction, connected clusters occupy the centre. Keyboard connection inspection confirmed endpoint detail. User's expanded graph is left open on the running service.

Limit: this correction preserves the 150-node/500-edge canvas budget; complete source lists remain accessible below the graph. No consumer project artifacts were edited. Existing unrelated index.html and stylesheet work was preserved.

## Selected-node exploration

Added expanded-canvas selected-node focus, keyboard activation, wheel/button zoom by connection distance, hidden unrelated nodes and overview reset. Incoming/outgoing counts preserve recorded direction without asserting parent-child ownership. Verified real project focus expands from 2 visible nodes at level 1 to 10 at level 2. This initial explorer operates on the existing bounded canvas subset; it does not yet load neighbours outside the 150 displayed nodes. Production build and 35 unit tests pass.
