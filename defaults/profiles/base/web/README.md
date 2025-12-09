---
name: Web
type: base
description: Web applications (React, Vue, Next.js, Angular, Svelte)
includes:
  - component-design-template.md
  - api-contract-template.md
  - accessibility-checklist.md
examples:
  - React + TypeScript SPA
  - Next.js full-stack app
  - Vue.js dashboard
  - Angular enterprise application
---

# Web Profile

The **Web** profile is optimized for frontend and web application development. It includes templates for component design, API contracts, and accessibility compliance.

## What You Get

**In addition to General profile**, you receive:

### Templates
- `component-design-template.md` - UI component specifications
  - Props/state design
  - Component hierarchy
  - Interaction patterns
- `api-contract-template.md` - Frontend/backend API contracts
  - Endpoint specifications
  - Request/response schemas
  - Error handling

### Rules
- `accessibility-checklist.md` - WCAG 2.1 AA compliance
  - Keyboard navigation
  - Screen reader support
  - Color contrast
  - Semantic HTML

### Memory
- `browser-compatibility.md` - Browser support matrix

## When to Use

- Building single-page applications (React, Vue, Angular, Svelte)
- Creating server-rendered web apps (Next.js, Nuxt)
- Developing progressive web apps (PWA)
- Building web dashboards or admin panels

## Technology Stack Detection

Agent will recommend this profile when detecting:
- `package.json` with `react`, `vue`, `angular`, `next`, `svelte`, `@vue/cli`
- Frontend build tools: `webpack`, `vite`, `parcel`
- No backend API indicators (if both, suggests `full-stack`)

## Composition

Can be combined with modifiers:
- `web+devsecops` - Web app with security scanning (XSS, CSRF protection)
- `web+mlops` - Web app with ML model integration
- `web+devops` - Web app with advanced CI/CD (auto-deployment)
