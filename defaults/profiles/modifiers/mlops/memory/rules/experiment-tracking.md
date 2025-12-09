# Experiment Tracking Rules

## 🧪 What to Track

**Every experiment must log:**
- Hyperparameters (learning rate, batch size, epochs)
- Metrics (accuracy, loss, precision, recall)
- Model architecture
- Dataset version
- Code version (git commit hash)
- Environment (dependencies, hardware)

---

## 🛠️ Tools

**Recommended:** MLflow / Weights & Biases / Neptune

**Example (MLflow):**
```python
import mlflow

with mlflow.start_run():
    mlflow.log_param("learning_rate", 0.01)
    mlflow.log_param("batch_size", 32)
    
    # Training...
    
    mlflow.log_metric("accuracy", 0.95)
    mlflow.log_artifact("model.pkl")
```

---

## 📊 Experiment Organization

**Naming:** `{model-type}-{feature-set}-{date}`  
**Example:** `lstm-sentiment-2024-12-09`

**Tags:**
- `production` - Models deployed to prod
- `baseline` - Baseline experiments
- `experiment` - Exploratory runs

---

## ✅ Repro reproducibility

- [ ] Code version (git hash) logged
- [ ] Dataset version (DVC hash) logged
- [ ] Random seed fixed
- [ ] Environment (requirements.txt) logged
- [ ] Hardware spec documented
