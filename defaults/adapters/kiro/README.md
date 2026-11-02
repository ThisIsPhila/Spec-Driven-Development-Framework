# Kiro Adapter for SDD Framework

This adapter integrates the SDD Framework with Kiro's native platform capabilities, providing conditional steering, automated hooks, and bidirectional spec access.

## Features

### 1. Conditional Steering
- Auto-loads SDD governance when working on active phase files
- File pattern: `.sdd/specs/active/**`
- References canonical documents without duplication

### 2. Lifecycle Hooks
- **PreTaskExec**: Validates task approval before execution (blocks with exit 2)
- **PostTaskExec**: Records completion timestamp and context
- **Stop**: Offers session summary recording

### 3. Symlink Bridge
- Creates `.kiro/specs/<phase>` → `.sdd/specs/active/<phase>` symlinks
- Enables Kiro's native spec UI to access canonical SDD files
- Bidirectional read/write support

## Detection Logic

The adapter activates when any of these signals are present:

**Environment Variables:**
- `KIRO_SESSION`
- `KIRO_WORKSPACE_ROOT`
- `ORCA_CLI_COMMAND`

**Directories:**
- `.kiro/`
- `.kiro/steering/`
- `.kiro/hooks/`

**Executables:**
- `kiro` command in PATH
- `orca` command in PATH

## Installation

### Automatic (during setup)
```bash
bash scripts/setup.sh --profile base+kiro
```

### Manual
```bash
# Copy steering file
mkdir -p .kiro/steering
cp defaults/adapters/kiro/steering/sdd-framework.md .kiro/steering/

# Copy and make hooks executable
mkdir -p .kiro/hooks
cp defaults/adapters/kiro/hooks/*.sh .kiro/hooks/
chmod +x .kiro/hooks/*.sh

# Create symlinks for active phases
mkdir -p .kiro/specs
for phase in .sdd/specs/active/*; do
  phase_name=$(basename "$phase")
  ln -s "../../.sdd/specs/active/$phase_name" ".kiro/specs/$phase_name"
done

# Record installation
echo '{"adapters":[{"name":"kiro","version":"1.0.0","installed":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","features":{"steering":true,"hooks":true,"symlinks":true}}]}' > .sdd/adapters.json
```

## Installed Files

- `.kiro/steering/sdd-framework.md` - Conditional steering with auto-inclusion
- `.kiro/hooks/pre-task-exec.sh` - PreTaskExec validation hook
- `.kiro/hooks/post-task-exec.sh` - PostTaskExec recording hook
- `.kiro/hooks/session-stop.sh` - Stop summary hook
- `.kiro/specs/<phase>/` - Symlinks to active phases

## Troubleshooting

### Hooks not firing
**Cause**: Hooks only activate at next session start (Kiro platform limitation)  
**Solution**: Restart your Kiro session after installation

### Symlinks not created
**Cause**: System doesn't support symlinks (Windows without Developer Mode)  
**Solution**: Use `.sdd/` directly; symlinks are an optimization, not required

### Detection false positive
**Cause**: `.kiro/` directory exists but Kiro isn't actually running  
**Solution**: Features gracefully degrade; CLI commands work normally

### Hook validation errors
**Cause**: Phase not approved or `.sdd/` structure missing  
**Solution**: Run `bash .sdd/scripts/phase.sh approve <artifact>` or verify `.sdd/` exists

## Compatibility

- **macOS**: Full support
- **Linux**: Full support  
- **Windows**: Steering and hooks work; symlinks require Developer Mode or admin privileges

## Architecture

The adapter is a thin translation layer:
- `.sdd/` remains the canonical enforcement substrate
- Kiro events → Adapter hooks → `phase.sh` CLI commands
- No logic duplication; hooks call existing framework commands
- Graceful degradation in non-Kiro environments

For detailed design decisions, see the Phase 007 design document.
