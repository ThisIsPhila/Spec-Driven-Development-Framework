---
name: MLOps
type: modifier
description: ML model governance and data versioning
includes:
  - model-design-template.md
  - dataset-card-template.md
  - data-versioning.md
  - experiment-tracking.md
  - constitutional-amendment.md (Article VI: Data Governance)
  - before-task_extends.md (adds data lineage validation)
  - data-governance.md
examples:
  - web+mlops - React app with ML model integration
  - api+mlops - FastAPI with ML inference endpoints
  - mobile+mlops - iOS/Android with on-device ML (Core ML, TensorFlow Lite)
---

# MLOps Modifier

The **MLOps** modifier adds machine learning workflows to any base profile. It emphasizes experiment tracking, data versioning, and model governance.

## What You Get

**Added to your base profile:**

### Templates
- `model-design-template.md` - ML system design
  - Dataset versioning strategy (DVC, Git LFS)
  - Experiment tracking (MLflow, Weights & Biases)
  - Model performance metrics (accuracy, precision, recall, F1)
  - Fairness and bias testing
  - Model deployment strategy
- `dataset-card-template.md` - Dataset documentation
  - Data source and collection method
  - Schema and statistics
  - Data quality checks
  - Ethical considerations
  - Versioning and lineage

### Rules
- `data-versioning.md` - Dataset version control workflow
  - How to version datasets (DVC, Git LFS, cloud storage)
  - Naming conventions
  - Snapshot strategy
- `experiment-tracking.md` - Experiment logging requirements
  - What to log (hyperparameters, metrics, artifacts)
  - Reproducibility requirements
  - Comparison and analysis
- `before-task_extends.md` - Adds data lineage validation to before-task rules

### Constitution
- **Article VI: Data Governance** (appended to constitutional-framework.md)
  - All datasets must be versioned
  - Experiments must be logged and reproducible
  - Model decisions must be documented
  - Bias and fairness testing required

### Memory
- `data-governance.md` - Data handling policies

## When to Use

- Building ML-powered applications
- Training and deploying models
- Managing ML experiments
- Ensuring ML reproducibility

## Agent Detection

Agent will recommend this modifier when detecting:
- ML libraries: `tensorflow`, `pytorch`, `scikit-learn`, `keras`, `xgboost`
- ML tools: `mlflow`, `wandb`, `dvc`, `kubeflow`
- Data science notebooks: `jupyter`, `.ipynb` files
- Model files: `.h5`, `.pkl`, `.pt`, `.onnx`

## Composition Examples

- `api+mlops` - FastAPI with ML inference
- `web+mlops` - React with ML predictions
- `mobile+mlops` - iOS with Core ML
- `full-stack+mlops+devsecops` - ML app with data security
