# Package Boundaries & Organization

Guidelines for organizing packages in a monorepo to maintain clear boundaries and prevent architectural drift.

---

## 🎯 Package Organization Principles

### 1. Single Responsibility
Each package should have ONE clear purpose.

**Good:**
- `packages/ui-components` - Reusable UI components
- `packages/auth` - Authentication logic
- `packages/api-client` - API communication

**Bad:**
- `packages/utils` - Everything that doesn't fit elsewhere (too broad)
- `packages/web-stuff` - Vague purpose

---

### 2. Clear Ownership
Every package should have a clear owner/team.

**Document in package.json:**
```json
{
  "name": "@monorepo/ui-components",
  "author": "Frontend Team",
  "maintainers": ["team-frontend@company.com"]
}
```

---

### 3. Dependency Direction

**Rule:** Dependencies should flow in ONE direction (no cycles).

**Good (Layered Architecture):**
```
apps/web
  └─ packages/ui-components
       └─ packages/design-tokens
```

**Bad (Circular Dependency):**
```
packages/auth ←→ packages/user-profile  ❌
```

**Detection:**
```bash
# Use madge or similar tools
npx madge --circular --extensions ts,tsx packages/
```

---

## 📦 Package Types & Naming

### Apps (`apps/`)
User-facing applications that consume packages.

**Naming:** `apps/[app-name]`
- `apps/web` - Web application
- `apps/mobile` - Mobile app
- `apps/admin` - Admin dashboard

**Rules:**
- Apps can depend on packages
- Apps should NOT be dependencies of other apps
- Apps can share packages but not code directly

---

### Shared Packages (`packages/`)

#### UI Components
**Naming:** `packages/ui-components` or `@monorepo/ui`

**Contains:** Reusable UI components (buttons, forms, layouts)

**Consumers:** All apps

---

#### Utilities
**Naming:** `packages/utils` or `@monorepo/utils`

**Contains:** Pure functions, helpers, formatters

**Warning:** Avoid "junk drawer" packages. Split if it grows too large.

---

#### Types
**Naming:** `packages/types` or `@monorepo/types`

**Contains:** Shared TypeScript types and interfaces

**Consumers:** All packages and apps

---

#### Configuration
**Naming:** `packages/config` or `@monorepo/config`

**Contains:** Shared configs (ESLint, TypeScript, Tailwind)

**Consumers:** All packages and apps

---

## 🚫 Anti-Patterns to Avoid

### ❌ God Package
**Problem:** One package that does everything

**Solution:** Split into focused packages

---

### ❌ Tight Coupling
**Problem:** Package A knows too much about Package B's internals

**Solution:** Define clear interfaces, use dependency injection

---

### ❌ Leaky Abstractions
**Problem:** Implementation details leak into public API

**Solution:**
- Keep `internal/` folders private
- Only export what's necessary from `index.ts`

---

## ✅ Package Checklist

**Before Creating a New Package:**
- [ ] Clear, single purpose defined
- [ ] No existing package can handle this
- [ ] At least 2 consumers identified
- [ ] No circular dependencies introduced

**Package Structure:**
- [ ] `src/index.ts` defines public API
- [ ] `src/internal/` for private code
- [ ] `README.md` with usage examples
- [ ] `package.json` with correct dependencies

**Dependency Management:**
- [ ] Dependencies are justified
- [ ] No circular dependencies
- [ ] Dependency graph is acyclic
