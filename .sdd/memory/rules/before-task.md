# Before Task Rules - SDD Framework Development

## Purpose
Ensure proper context before implementing framework features.

## Checklist

### 1. Review the Active Phase
- [ ] Run `bash .sdd/scripts/phase.sh status` to identify the active phase and task
- [ ] Read that phase's `requirements.md`, `design.md`, and `tasks.md` under `.sdd/specs/active/`
- [ ] Confirm the three artifacts are approved in order before implementation
- [ ] Trace the selected task to its requirement IDs

### 2. Check Project Status
- [ ] Review `progress-tracker.md` for active blockers
- [ ] Review `technical-decisions.md` for architectural choices
- [ ] Check if any dependencies on other categories exist

### 3. Branch Management
**Naming:** `feat/<category-name>` (e.g., `feat/profile-infrastructure`)

**Workflow:**
- [ ] Checkout `master`
- [ ] Pull latest changes
- [ ] Create feature branch for the category

### 4. Framework-Specific Checks
- [ ] **No breaking changes to v1.0**: Ensure backward compatibility with existing users
- [ ] **Self-hosting dogfooding**: Changes must work for this project's own `.sdd/` directory
- [ ] **Profile composition**: Verify changes support `base+modifier` syntax
- [ ] **Documentation**: Plan to update README/AGENT_ONBOARDING if needed

### 5. Testing Strategy
- [ ] Identify what integration tests are needed (e.g., test `setup.sh --profile web+devsecops`)
- [ ] Plan validation tests (e.g., check all profiles have README.md)
- [ ] Consider edge cases (invalid profiles, missing files)

---

## Starting Work Confirmation

Post this summary before starting:

```
BEFORE-TASK CHECKLIST COMPLETE

Category: [phase and stable task ID] - [Name]
Branch: feat/[phase-folder-name]
Requirements: ✅ Reviewed
Design: ✅ Reviewed
Tasks: ✅ Validated
Testing Strategy: [Brief description]
Dependencies: [None / List]
Backward Compatibility: ✅ Checked

Ready to proceed. Awaiting START confirmation.
```
