# Deployment Checklist

## 🚀 Pre-Deployment

- [ ] **Code Review:** All changes peer-reviewed
- [ ] **Tests Passing:** CI pipeline green
- [ ] **Database Migrations:** Reviewed and tested
- [ ] **Feature Flags:** Configured for gradual rollout
- [ ] **Rollback Plan:** Documented and tested

---

## 🔍 Deployment Validation

- [ ] **Health Checks:** Endpoints responding (200 OK)
- [ ] **Smoke Tests:** Critical user flows working
- [ ] **Performance:** Response times within SLA
- [ ] **Logs:** No errors or warnings
- [ ] **Monitoring:** Dashboards showing green

---

## 📊 Post-Deployment

- [ ] **Traffic Shift:** Gradual rollout (10% → 50% → 100%)
- [ ] **Error Monitoring:** No spike in error rate
- [ ] **User Impact:** No degradation in UX metrics
- [ ] **Database Performance:** Query times stable
- [ ] **Alerts Configured:** On-call notified if issues

---

## 🔙 Rollback Criteria

Rollback if:
- Error rate > 1%
- Response time > 2x baseline
- Critical feature broken
- Database corruption detected

**Rollback Process:**
1. Revert deployment (blue-green switch / previous Docker tag)
2. Notify team
3. Post-mortem scheduled
