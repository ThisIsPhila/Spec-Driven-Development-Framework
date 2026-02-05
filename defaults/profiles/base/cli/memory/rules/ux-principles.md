# CLI UX Principles

## Discoverability
- Provide `--help` and clear usage examples.
- Use consistent flags and subcommands.

## Composability
- Support piping and JSON output where appropriate.
- Avoid interactive prompts for automation paths.

## Feedback
- Provide progress indicators for long operations.
- Emit actionable error messages.

## Configuration
- Allow env vars and config files.
- Document precedence (flags > env > config).
