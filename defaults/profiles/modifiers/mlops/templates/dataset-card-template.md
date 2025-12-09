# Dataset Card - [Dataset Name]

**Version:** [v1.0]  
**Created:** [Date]  
**Owner:** [Team/Person]

---

## 📋 Dataset Overview

**Purpose:** [Why this dataset exists]  
**Source:** [Where data came from]  
**Size:** [Number of samples, file size]  
**Format:** [CSV / JSON / Parquet / Images]

---

## 📊 Schema

| Column | Type | Description | Missing % |
|--------|------|-------------|-----------|
| `id` | int | Unique identifier | 0% |
| `feature_1` | float | Description | 2.5% |
| `target` | category | What we predict | 0% |

---

## 📈 Statistics

**Target Distribution:**
- Class A: 60%
- Class B: 40%

**Feature Ranges:**
- feature_1: [0.0, 100.0]
- feature_2: [-10, 50]

---

## 🔄 Versioning

**Storage:** `dvc remote storage` / `s3://bucket/path`  
**Version:** `v1.0` (DVC tracked)  
**Hash:** `abc123def456`

**Changes from v0.9:**
- Added 1000 new samples
- Fixed missing values in feature_1

---

## ⚖️ Ethical Considerations

- [ ] Data collection consent obtained
- [ ] No PII without anonymization
- [ ] Bias analysis completed
- [ ] Fair representation across demographics

---

## 🧪 Quality Checks

- [ ] No duplicate rows
- [ ] Missing values handled
- [ ] Outliers investigated
- [ ] Data types correct

---

## ✅ Approval Checkpoint

**Respond with:**
- ✅ "Approved"
- 🔄 "Changes needed..."
