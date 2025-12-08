# Contributing to the SDD Framework

Statement of Intent: **We eat our own dog food.**

If you want to contribute to the Spec-Driven Development Framework, you must follow the SDD process. This ensures that the framework evolves in a way that proves its own methodology works.

## The Golden Rule for Contributors

**No Pull Request without a Spec.**

We will close PRs that do not link to an approved Specification issue or document.

## How to Contribute

1.  **Start with a Spec**:
    - For small fixes: Open an Issue describing the `Requirement`.
    - For features: Fork the repo, create a `specs/phases/phase-XXX` folder, and write the `requirements.md`.

2.  **Follow the Protocol**:
    - Use the `before-task.md` checklist.
    - Update the `implementation_plan.md` in your fork.

3.  **Submit PR**:
    - Link your PR to the Issue/Spec.
    - Ensure `tests` pass (if applicable).
    - Ensure `README.md` is updated if you changed functionality.

## Style Guide

- **Markdown First**: Documentation is as important as code.
- **Agent Friendliness**: Write clear, unambiguous instructions. If an AI Agent can't understand it, rewrite it.
