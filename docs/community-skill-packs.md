# Community skills and framework profiles

A skill is a reusable `SKILL.md` instruction package. A profile selects framework defaults: one of general, web, api, mobile, cli, full-stack or monorepo, plus devsecops/devops/mlops modifiers. They remain separate, compatible concepts. Downloaded skill instructions do not override the owner or become enforced framework rules.

Standard community skills can be installed using the official skills CLI:

```sh
npx skills add owner/repository
```

Its canonical project skills are discovered in `.agents/skills/` alongside SDD's existing `skills/`. The official CLI handles its own checking/updating. Existing `bash .sdd/scripts/skills.sh` list/sync/validate/add commands remain supported.

An optional SDD pack composes several skills and declares a suggested profile. Anybody can author this structure:

```text
my-pack/
  SKILL.md
  sdd-pack.json
  skills/
    cloud-deploy/
      SKILL.md
      references/
```

```json
{
  "schemaVersion": 1,
  "name": "cloud-delivery",
  "profile": "api+devops",
  "skills": ["cloud-deploy"]
}
```

Both SKILL.md files use standard name/description frontmatter. Skill folders use kebab-case. The pack manifest contains no executable install hooks or automatic overlays.

```sh
bash .sdd/scripts/skills.sh pack validate /path/to/my-pack
bash .sdd/scripts/skills.sh pack install /path/to/my-pack
bash .sdd/scripts/skills.sh pack install /path/to/my-pack --update
bash .sdd/scripts/skills.sh sync --target codex
```

Pack management requires optional Node.js; core setup/lifecycle/hooks retain Bash compatibility. Installation records content hashes in `.sdd/skill-packs/`. Updates refuse to overwrite locally modified or unmanaged skills. The declared profile is displayed as a recommendation and does not silently rewrite `.profile`. Apply it explicitly through setup if wanted. Remote repository packs can be cloned and validated locally before installation; ordinary skills.sh packages do not require an SDD manifest.

See [the official skills CLI](https://skills.sh/docs/cli) for community distribution and [vercel-labs/skills](https://github.com/vercel-labs/skills) for its implementation.
