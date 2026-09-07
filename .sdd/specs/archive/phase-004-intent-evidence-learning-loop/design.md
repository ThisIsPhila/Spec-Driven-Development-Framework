# Phase 004 — Intent, Evidence, and Learning Loop — Design

**Phase:** Phase 004 — Intent, Evidence, and Learning Loop  
**Created:** 2026-09-07  
**Status:** ✅ APPROVED
**Requirements approved:** 2026-09-07 under `SDD-EXC-2026-09-07-01`

## Architecture

```text
owner intent
    ↓
constitution + project invariants
    ↓
requirements → design → executable task contract
    ↓                         ↓
bounded authorization       no-go conditions
    ↓
exact-tree implementation → environment-bound evidence
    ↓
truth reconciliation → owner acceptance
    ↓
learning classification → decision → revised/new specification
```

The framework owns lifecycle mechanics. A consumer owns its domain constitution sections, selected profile, phase content, skills, hooks, and evidence. Upgrade logic may refresh framework-owned assets but must not overwrite consumer-owned meaning.

## D004.1 — Universal constitution plus project extension points

Replace the thin default constitution with universal articles covering authority/truth, specification-driven work, artifact placement, security/testing/operability, preservation, and change control. Include an explicit project-invariants section for the consumer to fill. Root agent files remain pointers only.

## D004.2 — Standard SDD artifact topology

Fresh installations and migrations create:

```text
.sdd/
├── constitution.md
├── glossary.md
├── evidence/
├── reports/
├── memory/
│   ├── archive/
│   ├── governance/
│   └── current-state/
├── specs/{active,backlog,archive}/
├── templates/
└── scripts/
```

Threshold records preserve history without retro-certification. Evidence and reports are not stored in `docs/`.

## D004.3 — Task contract and phase learning record

The task template adopts the detailed Smart Trader contract: stable ID, objective/requirements, design references, implementation, owned paths, dependencies, positive/negative verification, evidence, no-go conditions, and handoff. A new learning template records:

- current state;
- intended state;
- observed gap;
- failure classification;
- evidence;
- decision and specification impact;
- next authorized action.

## D004.4 — Machine-readable policy without duplicated prose

Add `.sdd/framework.json` containing framework schema/version, profile, forward-threshold number, validator runtime, and ownership markers. Human policy remains Markdown; the JSON enables scripts to select governed phases and compatible validator invocation without parsing prose.

## D004.5 — Runtime-neutral validation

Ship the spec validator as `validate-spec.cjs` and invoke that name from framework scripts and documentation. This prevents a consumer's root `"type": "module"` setting from changing validator semantics. Migration removes the old framework-owned `.js` validator only after the `.cjs` replacement exists.

## D004.6 — Non-destructive upgrade command

Extend setup with `--upgrade`. It must:

1. detect an existing `.sdd` installation;
2. snapshot framework-owned files into `.sdd/memory/archive/framework-upgrades/<timestamp>/`;
3. refresh scripts and missing templates/rules;
4. never overwrite constitution, project memory, active specs, custom skills, or hooks;
5. emit a manifest of added/updated/preserved/conflicting files;
6. run doctor and fail truthfully if reconciliation is incomplete.

Because ownership metadata is new, the first upgrade operates conservatively: scripts may refresh; existing semantic documents are preserved and surfaced as conflicts for manual reconciliation.

## D004.7 — Doctor scope and compatibility

Doctor reads `forwardThreshold` from `.sdd/framework.json`. Lifecycle/task-contract enforcement applies to phases at or after that threshold; older active/archive material is reported as history rather than made falsely compliant. Doctor validates governance/evidence/report homes and detailed task fields for governed phases.

## Verification

- Existing 799-assertion suite remains green.
- New tests cover ES-module consumers, artifact topology, concise agent pointers, detailed task contracts, forward-threshold behavior, and hook-preserving upgrade.
- Upgrade fixtures use temporary git repositories and synthetic content.
- `git diff --check`, doctor, skills validation, and the full suite pass on the exact tree.

## Rollback and preservation

The upgrade manifest and archive snapshot provide rollback inputs. Setup never edits `.git/hooks` or `.husky`. Existing project files are retained on conflict. No consumer repository is changed during framework development tests.
