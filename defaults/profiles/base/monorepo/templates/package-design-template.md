# Package Design: [Package Name]

**Package Type:** [Shared Library / Utility / UI Components / Types / Config]  
**Consumers:** [Which apps/packages will use this]  
**Created:** [Date]  
**Status:** 📝 DRAFT

---

## 1. Package Overview

**Purpose:**  
[What problem does this package solve? Why does it need to be a separate package?]

**Scope:**  
[What functionality belongs in this package? What doesn't?]

**Package Name:**  
`packages/[package-name]` or `@[scope]/[package-name]`

---

## 2. Public API

### Exports

**Functions:**
```typescript
export function [functionName](params: [Type]): [ReturnType] {
  // Purpose: [What this does]
}
```

**Types/Interfaces:**
```typescript
export interface [InterfaceName] {
  // Public contract
}

export type [TypeName] = [Definition];
```

**Constants:**
```typescript
export const [CONSTANT_NAME] = [value];
```

### API Design Principles
- [ ] Minimal surface area (only export what's necessary)
- [ ] Clear naming conventions
- [ ] Backward compatibility considered
- [ ] TypeScript types exported

---

## 3. Package Structure

```
packages/[package-name]/
├── src/
│   ├── index.ts              # Public API (what gets exported)
│   ├── [feature]/
│   │   ├── [feature].ts      # Implementation
│   │   └── [feature].test.ts # Tests
│   └── internal/             # Private utilities (not exported)
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

---

## 4. Dependencies

### External Dependencies
| Package | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| `[package]` | `^X.Y.Z` | [Purpose] | [Why needed] |

### Internal Dependencies
| Package | Purpose | Risk |
|---------|---------|------|
| `packages/[name]` | [What's used] | [Circular dependency risk?] |

**Dependency Rules:**
- [ ] No circular dependencies
- [ ] Minimal external dependencies
- [ ] All dependencies justified

---

## 5. Consumers & Usage

### Who Will Use This Package?

**Apps:**
- `apps/[app-name]` - [How it will be used]

**Packages:**
- `packages/[package-name]` - [How it will be used]

### Usage Example

```typescript
import { [export] } from '@[scope]/[package-name]';

// Example usage
const result = [export]([params]);
```

---

## 6. Testing Strategy

### Unit Tests
**Location:** `packages/[package-name]/src/**/*.test.ts`

**Coverage Target:** 80%+

**Test Scenarios:**
- [ ] Happy path
- [ ] Edge cases
- [ ] Error handling
- [ ] Type safety

### Integration Tests
- [ ] Test with actual consumer apps
- [ ] Verify exports work as expected
- [ ] Check bundle size impact

---

## 7. Versioning & Breaking Changes

**Initial Version:** `0.1.0` (pre-1.0 = unstable API)

**Semantic Versioning:**
- **Major (1.0.0 → 2.0.0):** Breaking API changes
- **Minor (1.0.0 → 1.1.0):** New features, backward compatible
- **Patch (1.0.0 → 1.0.1):** Bug fixes

**Breaking Change Policy:**
- [ ] Deprecation warnings added first
- [ ] Migration guide provided
- [ ] Coordinated update across consumers

---

## 8. Build & Bundle Configuration

**Build Tool:** [TypeScript / Rollup / tsup / etc]

**Output Formats:**
- [ ] ESM (`dist/index.mjs`)
- [ ] CJS (`dist/index.cjs`)
- [ ] Types (`dist/index.d.ts`)

**Bundle Size Target:** [X KB gzipped]

---

## 9. Documentation

**README.md Contents:**
- [ ] Installation instructions
- [ ] Quick start example
- [ ] API reference
- [ ] Contributing guidelines

**JSDoc Comments:**
- [ ] All public exports documented
- [ ] Examples in comments
- [ ] Parameter descriptions

---

## ✅ Approval Checkpoint

**🛑 STOP - DO NOT PROCEED TO IMPLEMENTATION WITHOUT APPROVAL**

**Please confirm:**
1. Package scope and purpose are clear?
2. Public API is well-defined?
3. Dependencies are justified?
4. Consumers are identified?

**Respond with:**
- ✅ "Approved - proceed to Implementation"
- 🔄 "I have changes..."
- ❓ "I have questions..."
