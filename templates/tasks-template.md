# Tasks: [PHASE/FEATURE NAME]

**Phase**: Phase [N] – [Name]
**Requirements**: [requirements.md](./requirements.md)
**Design**: [design.md](./design.md)

---

## Task Overview

### Priority Legend
- **P0**: Critical Path (MVP)
- **P1**: High Priority
- **P2**: Optimization

### Effort Estimation
- **S**: 4-8 hours
- **M**: 1-2 days
- **L**: 3-5 days

---

## Task List

### [ ] Task 1: [Name]
**Priority:** P0
**Estimated Effort:** M
**Dependencies:** None

#### Objectives
- Goal 1
- Goal 2

#### Subtasks
- T001: [Description]
- T002: [Description]
- T003: [Description]

#### Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

---

### [ ] Task 2: [Name]
**Priority:** P1
**Dependencies:** Task 1

#### Subtasks
- T004: [Description]
- T005: [Description]

---

## Summary
### Critical Path
1. Task 1
2. Task 2

### Progress Tracking
- [ ] Task 1
- [ ] Task 2

---

## Task X+1-Y: [NEXT TASK GROUP TITLE]


---

## Success Criteria (Phase Complete)

- [ ] Summarize the definition of done for the entire phase.
- [ ] Include cross-cutting requirements (security, observability, docs, verification).

---

## Task Dependencies Graph

```text
X-Y (Task Group Title)
  ↓
X+1-Y (Next Task Group)
  ↓
...
```

---

## Estimated Timeline

- **Week N:** Task X-Y
- **Week N+1:** Task X+1-Y
- Adjust the cadence to reflect actual effort estimates.

**Total Estimated Duration:** [Total time]

---

## Notes

- `[P]` on a task indicates it can run in parallel (distinct files/no dependencies). Leave blank otherwise.
- Always present tests before implementation tasks to enforce TDD. Tests must fail before shipping the corresponding implementation.
- Keep descriptions specific and reference concrete file paths (e.g., `products/app/src/...`). Avoid vague work items.
- Respect path conventions:
  - Single project: `src/`, `tests/` at repository root.
  - Web app: `backend/src/`, `frontend/src/`.
  - Mobile: `api/src/`, `ios/src/`, `android/src/`.
- Maintain ASCII-only output unless the project already requires otherwise.

## Task Generation Guidelines

1. **Contracts** → Create contract tests with `[P]` when operating on different files.
2. **Data Models** → Each entity gets a model task; relationships drive service tasks.
3. **User Stories** → Translate into integration or end-to-end tests before implementation.
4. **Ordering** → Setup → Tests → Core Implementation → Integration → Polish.
5. **Dependencies** → Call out blockers explicitly in the `Dependencies` field.

## Validation Checklist

- [ ] All tests precede implementation tasks.
- [ ] Tasks include explicit file paths and numbered IDs (T###).
- [ ] Parallel tasks operate on independent files.
- [ ] Success criteria cover security, reliability, and documentation when relevant.
- [ ] Dependency graph and timeline are present.
- [ ] Acceptance criteria map directly to Objectives.
