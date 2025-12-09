---
name: CLI
type: base
description: Command-line tools and utilities
includes:
  - command-design-template.md
  - ux-principles.md
  - os-compatibility.md
examples:
  - Python CLI with Click
  - Go CLI tool
  - Node.js CLI with Commander
  - Shell script utilities
---

# CLI Profile

The **CLI** profile is optimized for command-line tool development. It includes templates for command design, UX principles, and cross-platform compatibility.

## What You Get

**In addition to General profile**, you receive:

### Templates
- `command-design-template.md` - CLI command specifications
  - Command structure and subcommands
  - Arguments and flags
  - Input/output formats
  - Help text and documentation
  - Exit codes

### Rules
- `ux-principles.md` - CLI UX best practices
  - Discoverability (--help, man pages)
  - Composability (UNIX philosophy)
  - Feedback (progress bars, spinners)
  - Error messages (actionable, clear)
  - Configuration (env vars, config files)

### Memory
- `os-compatibility.md` - OS support matrix
  - Supported platforms (Linux, macOS, Windows)
  - Platform-specific considerations
  - Installation methods (brew, apt, npm, pip)

## When to Use

- Building command-line tools
- Creating developer utilities
- Developing automation scripts
- Building CI/CD pipeline tools

## Technology Stack Detection

Agent will recommend this profile when detecting:
- Python: `click`, `argparse`, `typer` in `requirements.txt`
- Node: `commander`, `yargs`, `oclif` in `package.json`
- Go: CLI patterns in `main.go`
- Rust: `clap` in `Cargo.toml`
- Shell scripts with argument parsing

## Composition

Can be combined with modifiers:
- `cli+devsecops` - CLI with security (input validation, secure credential handling)
- `cli+mlops` - CLI for ML workflows (data pipeline tools)
- `cli+devops` - CLI for infrastructure (deployment tools, config management)
