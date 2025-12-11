# [SPEC-ID] Feature Name

**Monorepo Impact:** [High / Medium / Low]  
**Primary Workspace:** `apps/[app-name]` or `packages/[package-name]`  
**Created:** [Date]  
**Status:** 📝 DRAFT

---

## 1. Context & Goal

**User Story:**  
As a [User Type], I want [Action], so that [Benefit].

**Business Value:**  
[Why are we building this? What problem does it solve?]

**Success Criteria:**
- [Measurable outcome 1]
- [Measurable outcome 2]

---

## 2. Monorepo Architecture (The "Where")

### Primary Workspace
**App/Package:** `apps/[app-name]` or `packages/[package-name]`

**Why this workspace?**
- [Reasoning for placement]

### Affected Shared Packages

| Package | Change Type | Description |
|---------|-------------|-------------|
| `packages/[name]` | Modified | [What's changing] |
| `packages/[name]` | New Dependency | [Why it's needed] |

### New Dependencies

**External:**
- `[npm-package]@[version]` - [Purpose]

**Internal:**
- `packages/[package-name]` - [What's being used]

---

## 3. Technical Implementation (The "How")

### Interface Changes

**New Exports:**
```typescript
// packages/[package-name]/src/index.ts
export interface [InterfaceName] {
  // ...
}

export function [functionName](): [ReturnType] {
  // ...
}
```

**Modified Contracts:**
- [List any changes to existing interfaces]

### Logic Flow

1. **Step 1:** [Description]
   ```typescript
   // Pseudocode or actual code
   ```

2. **Step 2:** [Description]
   ```typescript
   // Pseudocode or actual code
   ```

3. **Step 3:** [Description]

### Error Handling

**Error Scenarios:**
- What happens if [scenario]?
  - **Handling:** [How it's handled]
- What happens if [another scenario]?
  - **Handling:** [How it's handled]

---

## 4. Data & State Management

### Data Flow
```
[Source] → [Processor] → [Storage] → [Consumer]
```

**State Location:**
- [ ] Component state (local)
- [ ] Shared state (context/store)
- [ ] Persistent storage (database)
- [ ] Ephemeral (memory only)

### Data Model

**New Data Structures:**
```typescript
interface [DataModel] {
  // Fields and types
}
```

---

## 5. Testing Strategy

### Unit Tests
**Location:** `packages/[package-name]/__tests__/`

**Coverage:**
- [ ] Core logic tested
- [ ] Edge cases covered
- [ ] Error handling verified

### Integration Tests
**Location:** `apps/[app-name]/__tests__/integration/`

**Scenarios:**
- [ ] Cross-package integration works
- [ ] End-to-end user flow tested
- [ ] Data persistence verified

### Build Verification
- [ ] All affected packages build successfully
- [ ] Type checking passes
- [ ] No circular dependencies

---

## 6. Dependencies & Impact Analysis

### Dependency Graph
```
apps/[app]
  └─ packages/[new-package]
       └─ packages/[existing-package]
```

### Breaking Changes
- [ ] This introduces breaking changes
- [ ] Migration guide provided (see below)

**Migration Path:**
[If breaking changes, describe how to migrate]

---

## 7. Performance Considerations

**Build Impact:**
- Estimated build time change: [+X seconds / No change]

**Runtime Impact:**
- Bundle size change: [+X KB / No change]
- Performance benchmarks: [If applicable]

---

## ✅ Approval Checkpoint

**🛑 STOP - DO NOT PROCEED TO IMPLEMENTATION WITHOUT APPROVAL**

**Please confirm:**
1. Workspace placement makes sense?
2. Affected packages are identified?
3. Testing strategy is sufficient?
4. Implementation approach is clear?

**Respond with:**
- ✅ "Approved - proceed to Implementation"
- 🔄 "I have changes..."
- ❓ "I have questions..."
