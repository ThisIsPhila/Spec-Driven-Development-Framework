# Coordination Card - [component-name]

**Component Type:** [App | Service]  
**Component Path:** `[apps/... | services/...]`  
**Local SDD Root:** `[apps/.../.sdd | services/.../.sdd]`  
**Last Coordination Sync:** [YYYY-MM-DD]  
**Update Cadence:** Weekly

## Lifecycle Snapshot

- **Coordination State:** [Planned | In Progress | Complete]
- **Current / Next Phase:** [Phase N - Name]
- **Phase Spec Path:** `[path]`
- **Local Progress Source:** `[path to tasks or progress]`
- **Start Record:** `.sdd/coordination/[apps|services]/[component]/phase-XXX-start.md`
- **Completion Record:** `.sdd/coordination/[apps|services]/[component]/phase-XXX-complete.md`

## Cross-Project Dependencies

- **Consumes:** [packages/services]
- **Provides:** [packages/services]
- **Shared Infrastructure:** [database/queue/auth/etc.]

## Weekly Update Contract

For each weekly sync, append one entry under `Weekly Notes` with:
- Date (`YYYY-MM-DD`)
- Highlights
- Blockers
- Risks
- Next 7 Days

## Weekly Notes

### YYYY-MM-DD
- **Highlights:**
- **Blockers:**
- **Risks:**
- **Next 7 Days:**
