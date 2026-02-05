# Changelog

All notable changes to the SDD Framework are documented here.

## [1.2.4] - 2026-02-05

### Added
- `memory/rules/spec-naming.md` to enforce configurable spec folder naming
- Spec naming validation in `scripts/doctor.sh`

### Changed
- README clarifies spec naming rule
- Example spec folder renamed to `phase-000-foundation`
- Agent onboarding includes spec naming rule and active-context logging example

## [1.2.3] - 2026-02-05

### Added
- `--fix` option for `scripts/scan-strays.sh` (moves stray specs into quarantine)
- Doctor now runs stray scan and reports warnings

## [1.2.2] - 2026-02-05

### Added
- `scripts/scan-strays.sh` to flag spec files outside `.sdd/`
- `memory/rules/file-placement.md` for spec placement rules

### Changed
- Updated onboarding and during-task rules to enforce spec placement

## [1.2.1] - 2026-02-05

### Added
- `scripts/doctor.sh` for validating `.sdd` structure and profile artifacts
- `scripts/migrate-structure.sh` to normalize legacy layouts and backfill memory files
- `--yes` and `--with-examples` flags for `scripts/setup.sh`

## [1.2.0] - 2026-02-05

### Added
- Memory scaffolding defaults (project overview, progress tracker, ADRs, current state, completed tasks)
- Full profile assets for API, CLI, and Full-Stack (templates + rules)
- Privacy section in `requirements-template.md` to align with spec linter
- Modifier rule extensions (`before-task_extends.md`) for DevSecOps and MLOps

### Changed
- Full-Stack profile now composes Web + API templates during setup
- Setup menu includes `monorepo` base profile option
- Example spec updated with privacy section

## [1.1.0] - 2025-12-09

### Added
- **Composable Profile System**: 6 base profiles + 3 modifiers
  - Base: general, web, mobile, api, cli, full-stack
  - Modifiers: devsecops, mlops, devops
- **Enhanced Setup Script**: Interactive whiptail menu with profile selection
  - `--profile` flag: `./scripts/setup.sh --profile web+devsecops`
  - `--list-profiles` to show all available profiles
  - Preview and confirmation before installation
  - 3-layer file overlay (base → profile → modifiers)
- **Profile Templates** (17 new template files across all profiles)
- **Constitutional Amendments**: Modifiers add articles to project constitution
- **Helper Scripts**: common.sh, validate-profiles.sh
- **Agent Detection Heuristics**: Documented in profile READMEs

### Changed
- Upgraded setup.sh from 48 to 300 lines with full profile support
- All templates now include approval checkpoint sections

### Fixed
- Missing approval checkpoint in dataset-card-template.md

## [1.0.0] - 2024-11-15

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Added
- **Framework Core**: Initial release of the Spec-Driven Development (SDD) framework.
- **Protocols**: Standardized `memory/rules/` for Pre/Active/Post task checklists.
- **Templates**: `requirements.md`, `design.md`, `tasks.md` templates in `templates/`.
- **Automation**: `scripts/setup.sh` for easy project hydration (The "Hydration Pattern").
- **Agent Support**: `AGENT_ONBOARDING.md` specialized protocol for AI Agents.
- **Documentation**: Comprehensive `README.md` with "Quick Start" for New/Existing projects.
- **Compliance**: MIT `LICENSE` and `CONTRIBUTING.md` guidelines.

- **Structure**: Formalized the `.sdd/` directory structure as the single source of truth.
