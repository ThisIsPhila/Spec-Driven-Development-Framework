# During Task Rules - SDD Framework Development

## Purpose
Maintain quality and alignment while implementing framework features.

## Active Development Rules

### 1. Small, Atomic Commits
- One logical change per commit
- Reference requirements: `feat: Add web profile README (REQ-1.4)`
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

### 2. Self-Testing
- Test changes on this project's own `.sdd/` directory first
- Run `bash scripts/setup.sh --profile <composition>` to verify overlay logic
- Check that files land in correct locations

### 3. Documentation as You Go
- Update README.md if user-facing changes
- Update AGENT_ONBOARDING.md if agent workflows change
- Add inline comments for complex bash logic

### 4. Framework-Specific Considerations

**When creating profile templates:**
- Follow the approval checkpoint pattern (see `defaults/specs-example/`)
- Include YAML frontmatter in README.md
- Test that `_extends.md` files insert correctly

**When modifying `setup.sh`:**
- Maintain backward compatibility (existing users can still run `setup.sh`)
- Add clear error messages for invalid input
- Test both interactive menu and CLI flags

**When writing tests:**
- Use `tests/validate-profiles.sh` pattern
- Make tests deterministic (no network calls, no randomness)
- Test edge cases (empty profiles, missing files, invalid composition)

### 5. Progress Tracking
- Update `progress-tracker.md` when completing major milestones
- Mark tasks as complete in `specs/phases/phase-1/tasks.md`
- Note any blockers or decisions in `technical-decisions.md`

---

## Quality Gates

Before committing:
- [ ] Code follows existing style (bash uses lowercase variables, 2-space indent)
- [ ] No hardcoded paths (use relative paths from script location)
- [ ] Error messages are clear and actionable
- [ ] Changes are backward compatible with v1.0
