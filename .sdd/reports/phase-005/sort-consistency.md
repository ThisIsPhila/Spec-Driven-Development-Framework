# Sorting consistency and natural page height — 2026-10-11

Owner observed Project overview remained ascending and dropdown sorting felt inconsistent. Shared compact Latest / Phase order / A–Z buttons now apply to Progress by phase, phase navigation and All phases cards, with one session preference. Latest remains descending canonical phase number. Inline graphs, relationship lists, progress lists and overview panels use natural document height; only the expanded dialog retains viewport scrolling. Existing unrelated styles/index work preserved.

Production build, 32 unit tests and five browser journeys pass. Browser assertions verify latest-first overview rows, order switching, and natural graph/list height. Raw outputs in `.sdd/evidence/phase-005/sort-consistency/`. Live server serves rebuilt assets; open tabs need reload.
