# After Task Rules - SDD Framework Development

## Purpose
Ensure work is complete, tested, and properly documented before merging.

## Completion Checklist

### 1. Self-Verification
- [ ] Run `bash scripts/setup.sh --profile <test-composition>` to verify functionality
- [ ] Check that files are created in correct locations (`.sdd/templates/`, `.sdd/memory/rules/`)
- [ ] Verify profile metadata (`.sdd/.profile`) is correct
- [ ] Test both interactive menu and CLI flags

### 2. Integration Testing
- [ ] Run validation tests: `bash tests/validate-profiles.sh`
- [ ] Test common compositions:
  - `general` (baseline)
  - `web+devsecops`
  - `api+mlops`
  - `full-stack+devops`
- [ ] Verify constitution gets augmented correctly for modifiers
- [ ] Verify template extensions are inserted

### 3. Documentation Updates
- [ ] Update `README.md` if user-facing features changed
- [ ] Update `AGENT_ONBOARDING.md` if workflow changed
- [ ] Update `CHANGELOG.md` with changes (for v1.1 release)
- [ ] Ensure all profile README.md files have YAML frontmatter

### 4. Code Review Preparation
- [ ] Squash WIP commits into logical units
- [ ] Write clear commit messages with REQ references
- [ ] Push branch to origin
- [ ] Create PR with description of what changed and why

### 5. Framework-Specific Final Checks
- [ ] Test that this project's own `.sdd/` still works correctly
- [ ] Verify backward compatibility: existing `setup.sh` users aren't broken
- [ ] Check that `defaults/` structure is clean (profiles organized clearly)
- [ ] Ensure no secrets or project-specific data leaked into examples

### 6. Progress Tracking
- [ ] Update `progress-tracker.md` with completion status
- [ ] Mark category as complete in `specs/phases/phase-1/tasks.md`
- [ ] Document any new technical decisions in `technical-decisions.md`

---

## Merge Criteria

Before merging to `master`:
- [ ] All integration tests passing
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Self-tested dogfooding (ran on this project)
- [ ] Category acceptance criteria met (from tasks.md)

---

## Post-Merge
- [ ] Delete feature branch
- [ ] Pull latest `master`
- [ ] Verify framework still works: `bash scripts/setup.sh --list-profiles`
