# Data Versioning Rules

## 🎯 Dataset Versioning Strategy

**Tool:** DVC (Data Version Control) / Git LFS / Cloud storage versioning

---

## 📌 Versioning Guidelines

### When to version:
- New data collected
- Data cleaning/preprocessing changes
- Schema changes
- Bug fixes in data pipeline

### Version Format:
- `v{major}.{minor}.{patch}`
- Major: Breaking schema changes
- Minor: New data added
- Patch: Bug fixes, no new data

---

## 📦 Storage

**Location:** `s3://bucket/datasets/` or DVC remote  
**Naming:** `{dataset-name}-v{version}.parquet`

---

## 🔄 Workflow

```bash
# Track dataset with DVC
dvc add data/dataset.csv
git add data/dataset.csv.dvc data/.gitignore
git commit -m "feat: Add dataset v1.0"

# Push to remote storage
dvc push

# Later: Pull specific version
git checkout v1.0
dvc pull
```

---

## ✅ Checklist

- [ ] Dataset tracked with DVC/Git LFS
- [ ] Version documented in dataset card
- [ ] Hash recorded for reproducibility
- [ ] Changes documented in CHANGELOG
