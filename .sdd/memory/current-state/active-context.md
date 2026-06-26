# Active Context

**Current Phase:** Phase 002 - Skills Management  
**Current Task:** Verification & Cleanup  
**Branch:** feat/skills-management

## Focus
- Verify CLI `skills.sh` behavior (list, sync, create, validate, add)
- Ensure backwards compatibility with `sync-skills.sh`
- Confirm `doctor.sh` check passes on the root-level `skills/` directory

## Recent Decisions
- Restructure skills directory to the repository root `skills/` for Vercel `skills.sh` compatibility.
- Build the local `skills.sh` CLI utility using portable Bash syntax (avoiding `${var^}` syntax to maintain default macOS bash-3 support).

## Open Questions
- None
