# Infrastructure Design - [Project Name]

**IaC Tool:** [Terraform / Pulumi / CloudFormation]  
**Cloud Provider:** [AWS / GCP / Azure]  
**Created:** [Date]  
**Status:** 📝 DRAFT  

---

## 🏗️ Infrastructure Diagram

```
┌──────────────────────────────────┐
│         Load Balancer            │
└───────────┬──────────────────────┘
            │
    ┌───────▼────────┐  ┌──────────┐
    │  Web Server 1  │  │  Web 2   │
    └───────┬────────┘  └─────┬────┘
            │                 │
        ┌───▼─────────────────▼───┐
        │      Database (RDS)     │
        └─────────────────────────┘
```

---

## 📦 Resources

### Compute
- EC2 instances: `t3.medium` x2
- Auto-scaling: min 2, max 10

### Database
- RDS PostgreSQL 15
- Instance: `db.t3.small`
- Multi-AZ: Yes

### Networking
- VPC: `10.0.0.0/16`
- Subnets: Public (web), Private (database)
- Security groups: Web (80, 443), DB (5432)

---

## 💰 Cost Estimation

| Resource | Monthly Cost |
|----------|--------------|
| EC2 (2x t3.medium) | $60 |
| RDS (db.t3.small) | $30 |
| Load Balancer | $20 |
| **Total** | **~$110/month** |

---

## 📊 Monitoring

- CloudWatch / Datadog
- Alerts: CPU > 80%, Disk > 90%, Error rate > 1%

---

## ✅ Approval Checkpoint

**Respond with:**
- ✅ "Approved"
- 🔄 "Changes needed..."
