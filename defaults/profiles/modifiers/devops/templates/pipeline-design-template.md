# CI/CD Pipeline Design - [Pipeline Name]

**Project:** [Project Name]  
**CI/CD Tool:** [GitHub Actions / GitLab CI / Jenkins]  
**Created:** [Date]  
**Status:** 📝 DRAFT  

---

## 🔄 Pipeline Stages

```
[Trigger] → Lint → Test → Build → Deploy → Monitor
```

### 1. Lint
- Code style check (ESLint, Pylint, Black)
- Security scan (Snyk, Bandit)

### 2. Test
- Unit tests
- Integration tests
- Coverage report (min 80%)

### 3. Build
- Docker image build
- Tag: `{git-sha}`, `latest`
- Push to registry

### 4. Deploy
- **Dev:** Auto-deploy on merge to `develop`
- **Staging:** Auto-deploy on merge to `main`
- **Production:** Manual approval required

### 5. Monitor
- Health check after deployment
- Rollback if health check fails

---

## 🚀 Deployment Strategy

**Strategy:** [Rolling / Blue-Green / Canary]

**Blue-Green:**
- Deploy to green environment
- Run smoke tests
- Switch traffic to green
- Keep blue as fallback

---

## 🔐 Secrets Management

- CI/CD secrets stored in: [GitHub Secrets / Vault]
- Never committed to repo
- Rotated quarterly

---

## ✅ Approval Checkpoint

**Respond with:**
- ✅ "Approved"
- 🔄 "Changes needed..."
