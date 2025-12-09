---
name: Full-Stack
type: base
description: Combined web frontend + backend API
includes:
  - Inherits all files from Web and API profiles
  - architecture-template.md
  - integration-testing.md
examples:
  - Next.js full-stack app
  - MERN/MEAN stack
  - Django + React
  - FastAPI + Vue
---

# Full-Stack Profile

The **Full-Stack** profile combines web frontend and backend API profiles. It includes templates for system architecture and end-to-end testing.

## What You Get

**Inherits from Web + API profiles**, plus:

### Templates
- `architecture-template.md` - System architecture diagrams
  - Frontend/backend architecture
  - Data flow diagrams
  - Component interaction
  - Deployment architecture
- `integration-testing.md` - End-to-end testing rules
  - E2E test strategy (Playwright, Cypress)
  - API testing (request/response validation)
  - Database seeding for tests
  - Test data management

**From Web profile:**
- component-design-template.md
- api-contract-template.md
- accessibility-checklist.md

**From API profile:**
- api-design-template.md
- schema-template.md
- api-versioning.md

## When to Use

- Building monolithic full-stack applications
- Creating apps with tightly coupled frontend/backend
- Developing server-side rendered apps with APIs
- Building MVPs with integrated stack

## Technology Stack Detection

Agent will recommend this profile when detecting:
- Frontend + Backend together in same repo
- Next.js (full-stack framework)
- MERN/MEAN stack (React/Angular + Express + MongoDB)
- Django/Flask with frontend templates
- Rails with React/Vue

## Composition

Can be combined with modifiers:
- `full-stack+devsecops` - Full-stack with end-to-end security
- `full-stack+mlops` - Full-stack with ML integration
- `full-stack+devops` - Full-stack with advanced deployment
