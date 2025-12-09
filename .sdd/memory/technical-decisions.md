# Technical Decisions - SDD Framework

**Project:** Spec-Driven Development Framework  
**Last Updated:** December 9, 2025

---

## Decision Log

### TD-001: Profile Composition Architecture (December 9, 2025)

**Decision:** Use base + modifiers composition model instead of monolithic profiles.

**Context:**  
Users need different combinations (web app with security, API with ML, etc.). Traditional approach would require `web`, `web-secure`, `web-ml`, `web-secure-ml` profiles (exponential growth).

**Solution:**
- **Base profiles** (what you're building): `web`, `mobile`, `api`, `cli`, `full-stack`, `general`
- **Modifiers** (how you're building): `+devsecops`, `+mlops`, `+devops`
- **Syntax**: `web+devsecops` = React app with security workflows

**Rationale:**
- Linear scaling (6 bases + 3 modifiers = 9 total, not 18)
- Clear separation of concerns
- Easier to maintain
- Users can compose novel combinations

**Alternatives Considered:**
- Monolithic profiles → rejected (maintenance burden)
- YAML config file → rejected (too complex for bash script)

**Status:** Approved (REQ-1.1, REQ-1.2)

---

### TD-002: File Overlay with rsync (December 9, 2025)

**Decision:** Use 3-layer rsync for file installation (base → profile → modifiers).

**Context:**  
Need predictable way to overlay files where later layers override earlier ones.

**Solution:**
```bash
rsync -a defaults/templates/ .sdd/templates/           # Layer 1: Base
rsync -a defaults/profiles/base/web/ .sdd/             # Layer 2: Profile
rsync -a defaults/profiles/modifiers/devsecops/ .sdd/ # Layer 3: Modifiers
```

**Rationale:**
- `rsync` is standard Unix tool (no new dependencies)
- `-a` preserves file attributes
- Later rsync calls overwrite earlier files (clear precedence)
- Simple mental model

**Alternatives Considered:**
- Custom merge logic → rejected (too complex)
- Symbolic links → rejected (portability issues)

**Status:** Approved (Design)

---

### TD-003: Template Extensions via `_extends.md` (December 9, 2025)

**Decision:** Modifiers augment templates using `*_extends.md` files.

**Context:**  
Modifiers need to add sections to base templates without replacing entire files.

**Solution:**
- Modifiers can include `design-template_extends.md`
- Setup script scans for `_extends.md` files
- Inserts content at marked insertion points in base templates

**Example:**
```
# In devsecops/templates/design-template_extends.md
<!-- INSERT_AFTER: ## 🎯 Design Overview -->
## 🔒 Security Considerations
[threat model content]
```

**Rationale:**
- Modifiers remain composable (don't need full template copy)
- Base templates stay clean
- Clear extension points

**Alternatives Considered:**
- Full template replacement → rejected (breaks composition)
- Markdown includes → rejected (not standard)

**Status:** Approved (Design)

---

### TD-004: Self-Hosting `.sdd/` in Git (December 9, 2025)

**Decision:** Commit `.sdd/` directory to version control (removed from `.gitignore`).

**Context:**  
Initially `.sdd/` was gitignored to avoid committing work-in-progress. But we're using SDD to develop SDD (dogfooding).

**Solution:**
- Remove `.sdd/` from `.gitignore`
- Commit our planning artifacts (specs, memory, progress)
- Show users how the framework is developed using itself

**Rationale:**
- Transparency: Users see our planning process
- Dogfooding: We use what we promote
- Easier agent access: No more `cat` hacks
- Version history: Planning evolution is visible

**Tradeoffs:**
- Repo slightly larger
- Planning docs are public (acceptable for open source)

**Status:** Implemented (December 9, 2025)

---

### TD-005: Bash Script for Profile System (December 9, 2025)

**Decision:** Enhance `setup.sh` in bash rather than rewriting in Python/Node.

**Context:**  
Need to add composition parsing, interactive menu, preview, and file overlay.

**Solution:**
- Keep bash for consistency with v1.0
- Use `whiptail` for TUI (with fallback to `read`)
- Parse composition string with `IFS` split

**Rationale:**
- No new dependencies (bash + rsync + whiptail are standard)
- Existing users already have bash
- Simple enough for bash (not complex state machine)

**Alternatives Considered:**
- Python → rejected (new dependency)
- Go binary → rejected (compilation step)

**Status:** Approved (Design)

---

## Decision Template

```markdown
### TD-XXX: [Title] (Date)

**Decision:** [What we decided]

**Context:** [Why this was needed]

**Solution:** [How we're solving it]

**Rationale:** [Why this approach]

**Alternatives Considered:** [Other options and why rejected]

**Status:** [Proposed / Approved / Implemented / Deprecated]
```
