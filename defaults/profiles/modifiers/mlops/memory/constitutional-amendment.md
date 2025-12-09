## Article VI: Data Governance

**Principle:** All datasets and experiments must be reproducible and ethically sound.

**Requirements:**
1. All datasets must be versioned (DVC, Git LFS, or equivalent)
2. Experiments must be logged with MLflow/W&B or equivalent
3. Model decisions must be documented (why this architecture, these hyperparameters)
4. Bias and fairness testing is mandatory before production deployment

**Enforcement:** Agents must refuse to deploy models without proper governance.
