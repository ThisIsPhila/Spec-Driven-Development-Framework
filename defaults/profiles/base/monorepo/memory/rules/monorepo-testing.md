# Monorepo Testing Strategy

Testing in a monorepo requires coordination across multiple packages and apps. This guide outlines best practices.

---

## 🎯 Testing Levels

### 1. Package-Level Unit Tests

**Location:** `packages/[package-name]/__tests__/` or `*.test.ts` files

**Purpose:** Test package logic in isolation

**Guidelines:**
- [ ] Each package has its own test suite
- [ ] Tests run independently (no cross-package dependencies in tests)
- [ ] Coverage target: 80%+ per package
- [ ] Fast execution (< 1 second per test file)

**Example:**
```typescript
// packages/utils/__tests__/format.test.ts
import { formatCurrency } from '../src/format';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
  });
});
```

---

### 2. Integration Tests

**Location:** `apps/[app-name]/__tests__/integration/`

**Purpose:** Test cross-package interactions

**Guidelines:**
- [ ] Test how packages work together
- [ ] Verify contracts between packages
- [ ] Test data flow across package boundaries
- [ ] Run against actual dependencies (not mocks)

**Example:**
```typescript
// apps/web/__tests__/integration/checkout.test.ts
import { calculateTotal } from '@monorepo/utils';
import { applyDiscount } from '@monorepo/pricing';

describe('Checkout flow', () => {
  it('applies discount and calculates total', () => {
    const subtotal = 100;
    const discounted = applyDiscount(subtotal, 'SAVE10');
    const total = calculateTotal(discounted, { tax: 0.08 });
    expect(total).toBe(97.20);
  });
});
```

---

### 3. End-to-End Tests

**Location:** `apps/[app-name]/__tests__/e2e/`

**Purpose:** Test complete user flows

**Tools:** Playwright, Cypress, Puppeteer

**Guidelines:**
- [ ] Test critical user journeys
- [ ] Run against deployed environment (staging)
- [ ] Slower but comprehensive
- [ ] Run in CI before production deployment

---

## 🏃 Running Tests

### Per-Package Testing
```bash
# Test a single package
cd packages/utils
npm test

# Or from root with workspace filtering
npm test --workspace=packages/utils
```

### Workspace-Wide Testing
```bash
# Test all packages
npm test --workspaces

# Test only changed packages (with Turborepo/Nx)
turbo test --filter=...[HEAD^1]
nx affected:test
```

### Parallel Execution
```bash
# Run tests in parallel (faster CI)
npm test --workspaces --parallel
```

---

## 📊 Coverage Requirements

**Per-Package Coverage:**
- Minimum: 80%
- Critical packages (auth, payments): 90%+

**Monorepo-Wide Coverage:**
- Track aggregate coverage
- Prevent coverage regression

**Tools:**
- Jest with `--coverage`
- Codecov or Coveralls for tracking

---

## 🔄 Continuous Integration

### CI Pipeline Structure

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      # Install dependencies
      - run: npm ci
      
      # Run tests for all packages
      - run: npm test --workspaces
      
      # Run integration tests
      - run: npm run test:integration
      
      # Upload coverage
      - uses: codecov/codecov-action@v3
```

### Optimizations
- **Cache dependencies:** Speed up CI with `actions/cache`
- **Test only affected:** Use Turborepo/Nx to test only changed packages
- **Parallel jobs:** Split tests across multiple CI runners

---

## 🚨 Common Pitfalls

### ❌ Circular Test Dependencies
**Problem:** Package A tests import from Package B, which imports from Package A

**Solution:** Keep test dependencies unidirectional

### ❌ Flaky Tests
**Problem:** Tests pass/fail randomly due to timing or shared state

**Solution:**
- Avoid shared mutable state
- Use proper async/await
- Clean up after each test

### ❌ Slow Test Suites
**Problem:** Tests take too long, slowing down development

**Solution:**
- Keep unit tests fast (mock external dependencies)
- Run integration/e2e tests only in CI
- Use test sharding for large suites

---

## ✅ Testing Checklist

**Before Merging:**
- [ ] All package unit tests pass
- [ ] Integration tests pass
- [ ] Coverage meets threshold (80%+)
- [ ] No new test warnings or errors
- [ ] E2E tests pass (if applicable)

**For New Packages:**
- [ ] Test setup configured
- [ ] At least one test exists
- [ ] CI runs tests automatically

**For Breaking Changes:**
- [ ] Tests updated in all affected packages
- [ ] Integration tests verify new contracts
- [ ] Migration tested
