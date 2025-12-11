# Architecture RFC: [Proposal Name]

**Monorepo Impact:** [High / Medium / Low]  
**Affected Workspaces:** [List apps/packages]  
**Created:** [Date]  
**Status:** 📝 DRAFT

---

## 1. Purpose & Context

**What is being proposed?**
- New package creation?
- Architectural boundary change?
- Cross-package contract modification?

**Which problem does this solve?**
- [Describe the problem this RFC addresses]

**Why is this needed now?**
- [Business context or technical debt]

---

## 2. Scope & Boundaries

### Affected Workspaces

**Apps:**
- `apps/[app-name]` - [How it's affected]
- `apps/[another-app]` - [How it's affected]

**Packages:**
- `packages/[package-name]` - [What changes]
- `packages/[another-package]` - [What changes]

### Non-Goals
- [Explicitly list what this RFC does NOT cover]
- [Helps prevent scope creep]

---

## 3. Proposed Architecture

### New Package Structure (if applicable)
```
packages/[new-package]/
├── src/
│   ├── index.ts          # Public API
│   └── internal/         # Private implementation
├── package.json
├── tsconfig.json
└── README.md
```

### Dependencies & Contracts

**New Dependencies:**
- External: `[npm-package-name]` - [Why needed]
- Internal: `packages/[existing-package]` - [What's used]

**New Contracts/Interfaces:**
```typescript
// Example interface that other packages will depend on
export interface [ContractName] {
  // ...
}
```

**Breaking Changes:**
- [ ] This introduces breaking changes to existing contracts
- [ ] Migration path documented below

---

## 4. Data Flow & Integration

**How does this integrate with existing packages?**
```
apps/[app] → packages/[new-package] → packages/[existing-package]
```

**Data Flow:**
1. [Step 1 of data flow]
2. [Step 2 of data flow]
3. [Step 3 of data flow]

---

## 5. Testing Strategy

### Unit Tests
- [ ] Tests for new package in isolation
- [ ] Coverage target: 80%+

### Integration Tests
- [ ] Cross-package integration tests
- [ ] Test affected apps with new changes

### Build Verification
- [ ] All affected packages build successfully
- [ ] No circular dependencies introduced
- [ ] Type checking passes across workspace

---

## 6. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Circular dependency | Medium | High | Enforce dependency graph validation |
| Breaking change impact | Low | High | Gradual rollout, feature flags |
| Build time increase | Medium | Medium | Optimize with build caching |

**Rollback Plan:**
- [How to revert if this causes issues]

---

## 7. Migration Path (if breaking changes)

**Current State:**
```typescript
// Old API
```

**New State:**
```typescript
// New API
```

**Migration Steps:**
1. [Step-by-step migration guide]
2. [Deprecation timeline]

---

## 8. Performance & Build Impact

**Build Time:**
- Estimated impact: [+X seconds / No change / -X seconds]
- Affected by: [Which packages need rebuilding]

**Bundle Size:**
- Estimated impact on apps: [+X KB / No change]

---

## ✅ Approval Checkpoint

**🛑 STOP - DO NOT PROCEED WITHOUT APPROVAL**

**Please confirm:**
1. Scope and affected packages are clear?
2. Dependencies and contracts are well-defined?
3. Testing strategy is sufficient?
4. Risks are acceptable?

**Respond with:**
- ✅ "Approved - proceed to Implementation"
- 🔄 "I have changes..."
- ❓ "I have questions..."
