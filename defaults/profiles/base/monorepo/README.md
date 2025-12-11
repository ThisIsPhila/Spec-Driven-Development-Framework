---
name: Monorepo
type: base
description: Multi-package monorepo projects (apps + shared packages)
includes:
  - architecture-rfc-template.md
  - feature-spec-template.md
  - package-design-template.md
  - workspace-dependencies.md
  - monorepo-testing.md
examples:
  - Turborepo with Next.js apps + shared UI packages
  - Nx workspace with multiple microservices
  - Yarn/pnpm workspaces with shared libraries
---

# Monorepo Profile

**For:** Multi-package repositories with shared code and multiple applications

## 🎯 Purpose

The monorepo profile is designed for projects that manage multiple packages, applications, or services in a single repository. It provides templates and workflows for:

- Managing package boundaries and dependencies
- Coordinating changes across multiple packages
- Designing shared contracts and interfaces
- Testing strategies (per-package and cross-package)
- Architectural decision-making for package structure

## 📦 What This Profile Provides

### Templates
- **architecture-rfc-template.md** - Propose new packages or architectural changes
- **feature-spec-template.md** - Feature specs with monorepo impact analysis
- **package-design-template.md** - Design new shared packages
- **workspace-dependencies.md** - Document cross-package dependencies

### Rules
- **monorepo-testing.md** - Testing strategies for monorepos
- **package-boundaries.md** - Guidelines for package organization

## 🏗️ Typical Monorepo Structure

```
monorepo/
├── apps/
│   ├── web-app/           # Frontend application
│   ├── mobile-app/        # Mobile application
│   └── api-server/        # Backend API
├── packages/
│   ├── ui-components/     # Shared UI library
│   ├── utils/             # Shared utilities
│   └── types/             # Shared TypeScript types
├── package.json           # Root workspace config
└── turbo.json            # Build orchestration (if using Turborepo)
```

## 🤖 Agent Detection Heuristics

An AI agent should recommend the **monorepo** profile when it detects:

**File Markers:**
- `package.json` with `"workspaces"` field (npm/yarn/pnpm)
- `pnpm-workspace.yaml` (pnpm workspaces)
- `nx.json` (Nx monorepo)
- `turbo.json` (Turborepo)
- `lerna.json` (Lerna monorepo)

**Directory Structure:**
- `apps/` and `packages/` directories at root
- Multiple `package.json` files in subdirectories
- Shared libraries referenced by multiple apps

**Scoring Algorithm:**
```
score = 0
if has_workspace_config: score += 3
if has_apps_and_packages_dirs: score += 2
if multiple_package_jsons (>3): score += 2
if has_monorepo_tool_config (nx/turbo/lerna): score += 2

if score >= 5: recommend "monorepo"
```

## 🔧 When to Use This Profile

**Use monorepo profile when:**
- You have multiple apps sharing common code
- You need to coordinate changes across packages
- You want atomic commits across related changes
- You have shared libraries used by multiple projects

**Don't use monorepo profile when:**
- You have a single application (use `web`, `api`, `mobile`, etc.)
- Packages are independently versioned and deployed (consider separate repos)

## 🎨 Composition Examples

```bash
# Monorepo with security focus
./scripts/setup.sh --profile monorepo+devsecops

# Monorepo with ML packages
./scripts/setup.sh --profile monorepo+mlops

# Monorepo with advanced CI/CD
./scripts/setup.sh --profile monorepo+devops
```

## 📚 Compatible Monorepo Tools

This profile works with:
- **npm workspaces** (npm 7+)
- **Yarn workspaces** (Yarn 1.x, 2.x, 3.x)
- **pnpm workspaces**
- **Turborepo** (build orchestration)
- **Nx** (monorepo toolkit)
- **Lerna** (package management)
- **Rush** (Microsoft's monorepo manager)

The templates are tool-agnostic and focus on architectural patterns rather than specific tooling.
