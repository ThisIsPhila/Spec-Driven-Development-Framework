# Phase 0: Foundation & Infrastructure - Tasks

**Phase:** Phase 0 - Foundation & Infrastructure Setup  
**Created:** October 2, 2025  
**Status:** 📋 READY TO START  
**Requirements Approved:** ✅ YES (October 2, 2025)  
**Design Approved:** ✅ YES (October 2, 2025)  
**Start Authorization:** AWAITING USER CONFIRMATION

---

## 🎯 Tasks Overview

This document breaks down Phase 0 into **actionable tasks**. Each task includes:
- **Clear objective** (what to build)
- **Acceptance criteria** (definition of done)
- **Estimated time**
- **Dependencies** (what must be done first)
- **Validation steps** (how to verify it works)

---

## 📋 Task Breakdown

### Task 0-1: Development Environment Setup Script

**Branch:** `feature/task-0-1-dev-environment-setup`

**Objective:**  
Create automated setup script that configures a developer's machine with all prerequisites for Example-App development.

**What to Build:**
1. `scripts/setup-dev-environment.sh` - Main setup script
2. `scripts/verify-environment.sh` - Verification script
3. `.env.example` - Template for environment variables
4. `docs/developer-guide/getting-started.md` - Developer onboarding guide

**Acceptance Criteria:**
- [ ] Script checks for Docker, kubectl, Helm prerequisites
- [ ] Script installs k3d if not present
- [ ] Script installs Helm if not present
- [ ] Script creates `.env` from `.env.example` if not exists
- [ ] Script installs Python dependencies via Poetry
- [ ] Script installs pre-commit hooks
- [ ] Verification script validates all tools are working
- [ ] Setup completes in < 30 minutes on fresh machine
- [ ] Documentation explains each step clearly

**Implementation Details:**
```bash
# scripts/setup-dev-environment.sh structure:
1. Check prerequisites (Docker, kubectl)
2. Install k3d (if missing)
3. Install Helm (if missing)
4. Create .env from template
5. Install Poetry dependencies
6. Install pre-commit hooks
7. Display next steps

# scripts/verify-environment.sh structure:
1. Check Docker is running
2. Check kubectl can connect
3. Check Helm is installed
4. Check Python version (3.11+)
5. Check Poetry is working
6. Display summary report
```

**Files to Create:**
- `scripts/setup-dev-environment.sh`
- `scripts/verify-environment.sh`
- `.env.example`
- `docs/developer-guide/getting-started.md`

**Estimated Time:** 3-4 hours

**Dependencies:** None (can start immediately)

**Validation:**
```bash
# Test on clean machine
./scripts/setup-dev-environment.sh
./scripts/verify-environment.sh  # Should show all checks passing
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Pre-commit hooks for security
- ✅ Article II (Spec-Driven): Following approved specs
- ✅ Article III (Test-First): Will add integration tests

---

### Task 0-2: Kubernetes Cluster Setup

**Branch:** `feature/task-0-2-k8s-cluster-setup`

**Objective:**  
Set up local Kubernetes cluster using k3d with proper configuration for development.

**What to Build:**
1. `deployment/k8s/k3d-config.yaml` - k3d cluster configuration
2. `deployment/k8s/namespaces/infra.yaml` - Infrastructure namespace
3. `deployment/k8s/namespaces/services.yaml` - Services namespace
4. `scripts/cluster-create.sh` - Cluster creation script
5. `scripts/cluster-destroy.sh` - Cluster teardown script

**Acceptance Criteria:**
- [ ] k3d cluster configuration file exists
- [ ] Cluster starts in < 2 minutes
- [ ] Cluster uses < 4GB RAM (REQ-0.1)
- [ ] Two namespaces created (infra, services)
- [ ] kubectl can connect to cluster
- [ ] Port forwarding configured (8080:80, 8443:443)
- [ ] Traefik ingress disabled (we'll use our own)
- [ ] Cluster survives Docker Desktop restart
- [ ] Documentation explains cluster management

**Implementation Details:**
```yaml
# deployment/k8s/k3d-config.yaml
apiVersion: k3d.io/v1alpha4
kind: Simple
metadata:
  name: example-app
servers: 1
agents: 2
ports:
  - port: 8080:80
    nodeFilters:
      - loadbalancer
  - port: 8443:443
    nodeFilters:
      - loadbalancer
  - port: 19092:19092  # Kafka external
    nodeFilters:
      - loadbalancer
options:
  k3s:
    extraArgs:
      - arg: --disable=traefik
        nodeFilters:
          - server:*
```

**Files to Create:**
- `deployment/k8s/k3d-config.yaml`
- `deployment/k8s/namespaces/infra.yaml`
- `deployment/k8s/namespaces/services.yaml`
- `scripts/cluster-create.sh`
- `scripts/cluster-destroy.sh`
- `docs/developer-guide/kubernetes-cluster.md`

**Estimated Time:** 2-3 hours

**Dependencies:** Task 0-1 (dev environment setup)

**Validation:**
```bash
# Create cluster
./scripts/cluster-create.sh

# Verify cluster
kubectl cluster-info
kubectl get nodes  # Should show 3 nodes (1 server, 2 agents)
kubectl get namespaces  # Should show infra and services

# Check resource usage
docker stats  # Should show < 4GB total RAM

# Destroy and recreate
./scripts/cluster-destroy.sh
./scripts/cluster-create.sh  # Should complete in < 2 minutes
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Infrastructure as Code
- ✅ Article II (Spec-Driven): Following approved design
- ✅ Article III (Test-First): Integration tests for cluster

---

### Task 0-3: Event Bus Deployment (Redpanda)

**Branch:** `feature/task-0-3-event-bus-redpanda`

**Objective:**  
Deploy Redpanda (Kafka-compatible event bus) to Kubernetes cluster.

**What to Build:**
1. `deployment/k8s/infra/redpanda/statefulset.yaml` - Redpanda StatefulSet
2. `deployment/k8s/infra/redpanda/service.yaml` - Service definitions
3. `deployment/k8s/infra/redpanda/service-external.yaml` - External access
4. `deployment/k8s/infra/redpanda/pvc.yaml` - Persistent volume claim
5. `scripts/kafka-topics-create.sh` - Topic creation script
6. `scripts/kafka-produce-test.sh` - Producer test script
7. `scripts/kafka-consume-test.sh` - Consumer test script

**Acceptance Criteria:**
- [ ] Redpanda pod is running and healthy
- [ ] Internal access works (from within cluster)
- [ ] External access works (from laptop via localhost:19092)
- [ ] Can produce messages > 10,000 msg/sec (REQ-0.2)
- [ ] Latency p95 < 50ms (REQ-0.2)
- [ ] Data persists across pod restarts
- [ ] Topics are created successfully
- [ ] Test scripts verify produce/consume functionality
- [ ] Documentation explains Kafka access patterns

**Implementation Details:**
```yaml
# Redpanda StatefulSet with:
- 1 replica (single broker for local dev)
- Persistent volume (10Gi)
- Resource limits (1 CPU, 1GB RAM)
- Internal listener (9092)
- External listener (19092)
- Schema registry (8081)
- Admin API (9644)
```

**Topics to Create:**
- `market-data.candles.1m` (partitions: 3, replication: 1)
- `market-data.candles.5m` (partitions: 3, replication: 1)
- `market-data.trades` (partitions: 6, replication: 1)
- `signals.generated` (partitions: 3, replication: 1)
- `orders.placed` (partitions: 3, replication: 1)
- `orders.filled` (partitions: 3, replication: 1)

**Files to Create:**
- `deployment/k8s/infra/redpanda/statefulset.yaml`
- `deployment/k8s/infra/redpanda/service.yaml`
- `deployment/k8s/infra/redpanda/service-external.yaml`
- `deployment/k8s/infra/redpanda/pvc.yaml`
- `deployment/k8s/infra/redpanda/kustomization.yaml`
- `scripts/kafka-topics-create.sh`
- `scripts/kafka-produce-test.sh`
- `scripts/kafka-consume-test.sh`
- `docs/developer-guide/event-bus.md`

**Estimated Time:** 4-5 hours

**Dependencies:** Task 0-2 (Kubernetes cluster)

**Validation:**
```bash
# Deploy Redpanda
kubectl apply -k deployment/k8s/infra/redpanda/

# Wait for pod to be ready
kubectl wait --for=condition=ready pod/redpanda-0 -n infra --timeout=300s

# Create topics
./scripts/kafka-topics-create.sh

# Test produce/consume
./scripts/kafka-produce-test.sh
./scripts/kafka-consume-test.sh

# Performance test
python tests/performance/test_kafka_throughput.py
# Should show > 10,000 msg/sec
# Should show p95 latency < 50ms
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Infrastructure as Code
- ✅ Article II (Spec-Driven): Following design specs
- ✅ Article III (Test-First): Performance tests included
- ✅ Article IV (Event-Driven): Core event infrastructure

---

### Task 0-4: Observability Stack - Prometheus & Grafana

**Branch:** `feature/task-0-4-observability-prometheus-grafana`

**Objective:**  
Deploy Prometheus and Grafana for metrics collection and visualization.

**What to Build:**
1. Helm installation script for kube-prometheus-stack
2. Custom Grafana dashboards
3. Prometheus recording rules
4. Alerting rules
5. Configuration for scraping custom metrics

**Acceptance Criteria:**
- [ ] Prometheus is running and collecting metrics
- [ ] Grafana is accessible at localhost:3000
- [ ] Default dashboards imported (Kubernetes cluster, nodes, pods)
- [ ] Custom Example-App dashboards created
- [ ] Alerting rules configured
- [ ] Metrics retention set to 30 days
- [ ] Grafana configured with Prometheus data source
- [ ] Documentation explains dashboard usage

**Implementation Details:**
```bash
# Install kube-prometheus-stack via Helm
helm install kube-prometheus prometheus-community/kube-prometheus-stack \
  --namespace infra \
  --set prometheus.prometheusSpec.retention=30d \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=20Gi
```

**Dashboards to Create:**
1. **Example-App Overview** - System health at a glance
2. **Service Metrics** - Latency, throughput, error rate per service
3. **Kafka Metrics** - Redpanda throughput, consumer lag
4. **Resource Usage** - CPU, memory, disk across all services

**Alerting Rules:**
- Service down > 1 minute
- Error rate > 5%
- Latency p95 > 500ms
- Disk usage > 80%
- Memory usage > 90%
- Kafka consumer lag > 10,000 messages

**Files to Create:**
- `deployment/k8s/infra/prometheus/values.yaml` - Helm values
- `deployment/k8s/infra/prometheus/recording-rules.yaml`
- `deployment/k8s/infra/prometheus/alert-rules.yaml`
- `deployment/k8s/infra/grafana/dashboards/` - JSON dashboard definitions
- `scripts/observability-install.sh`
- `docs/developer-guide/observability-metrics.md`

**Estimated Time:** 5-6 hours

**Dependencies:** Task 0-2 (Kubernetes cluster)

**Validation:**
```bash
# Install observability stack
./scripts/observability-install.sh

# Port forward Grafana
kubectl port-forward -n infra svc/kube-prometheus-grafana 3000:80

# Access Grafana
open http://localhost:3000  # Login: admin/admin

# Verify dashboards exist
# Verify Prometheus is scraping targets
# Verify alerts are loaded

# Test alerting (simulate high error rate)
python tests/integration/test_alerting.py
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Observability from day one
- ✅ Article II (Spec-Driven): Following design
- ✅ Article III (Test-First): Alert testing included

---

### Task 0-5: Observability Stack - Logging (Loki)

**Branch:** `feature/task-0-5-observability-loki`

**Objective:**  
Deploy Loki and Promtail for centralized log aggregation.

**What to Build:**
1. Helm installation for Loki stack
2. Promtail configuration for log collection
3. Grafana configuration for Loki data source
4. Log parsing rules
5. Example log queries

**Acceptance Criteria:**
- [ ] Loki is running and receiving logs
- [ ] Promtail is collecting logs from all pods
- [ ] Logs are queryable in Grafana
- [ ] Structured logging format is parsed correctly
- [ ] Log retention set to 30 days
- [ ] Performance: < 100ms query latency for recent logs
- [ ] Logs are correlated with metrics in dashboards
- [ ] Documentation explains log querying (LogQL)

**Implementation Details:**
```bash
# Install Loki stack via Helm
helm install loki grafana/loki-stack \
  --namespace infra \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=20Gi \
  --set promtail.enabled=true \
  --set loki.config.chunk_store_config.max_look_back_period=720h  # 30 days
```

**Log Format (Structured JSON):**
```json
{
  "timestamp": "2025-10-02T10:30:00Z",
  "level": "INFO",
  "service": "market-data",
  "trace_id": "abc123",
  "message": "Candle processed",
  "symbol": "AAPL",
  "price": 150.25
}
```

**Files to Create:**
- `deployment/k8s/infra/loki/values.yaml` - Helm values
- `deployment/k8s/infra/loki/promtail-config.yaml` - Log collection config
- `src/shared/logging_config.py` - Python structured logging setup
- `docs/developer-guide/observability-logging.md`
- `docs/developer-guide/logql-examples.md` - Common queries

**Estimated Time:** 3-4 hours

**Dependencies:** Task 0-4 (Prometheus & Grafana)

**Validation:**
```bash
# Install Loki
helm install loki grafana/loki-stack --namespace infra -f deployment/k8s/infra/loki/values.yaml

# Verify Loki is receiving logs
kubectl logs -n infra loki-0

# Query logs from Grafana
# Explore → Loki → {namespace="infra"}

# Test structured logging
python tests/integration/test_structured_logging.py
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Centralized logging for security
- ✅ Article II (Spec-Driven): Following design
- ✅ Article III (Test-First): Logging tests included

---

### Task 0-6: Observability Stack - Tracing (Tempo)

**Branch:** `feature/task-0-6-observability-tempo`

**Objective:**  
Deploy Tempo for distributed tracing across services.

**What to Build:**
1. Helm installation for Tempo
2. OpenTelemetry instrumentation library
3. Grafana configuration for Tempo data source
4. Example traced endpoints
5. Trace correlation with logs and metrics

**Acceptance Criteria:**
- [ ] Tempo is running and receiving traces
- [ ] OpenTelemetry SDK configured in Python
- [ ] Sample traces visible in Grafana
- [ ] Traces show complete request flow across services
- [ ] Traces are correlated with logs (trace_id in logs)
- [ ] Trace retention set to 7 days
- [ ] Performance: < 5ms overhead per trace
- [ ] Documentation explains tracing best practices

**Implementation Details:**
```bash
# Install Tempo via Helm
helm install tempo grafana/tempo \
  --namespace infra \
  --set tempo.persistence.enabled=true \
  --set tempo.persistence.size=10Gi \
  --set tempo.retention=168h  # 7 days
```

**OpenTelemetry Setup:**
```python
# src/shared/tracing.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

def setup_tracing(service_name: str):
    provider = TracerProvider()
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="tempo.infra:4317"))
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)
```

**Files to Create:**
- `deployment/k8s/infra/tempo/values.yaml` - Helm values
- `src/shared/tracing.py` - OpenTelemetry setup
- `src/shared/tracing_middleware.py` - FastAPI middleware
- `docs/developer-guide/observability-tracing.md`
- `docs/developer-guide/tracing-examples.md`

**Estimated Time:** 4-5 hours

**Dependencies:** Task 0-5 (Loki for log correlation)

**Validation:**
```bash
# Install Tempo
helm install tempo grafana/tempo --namespace infra -f deployment/k8s/infra/tempo/values.yaml

# Deploy test service with tracing
python tests/integration/test_tracing_demo.py

# View traces in Grafana
# Explore → Tempo → Search

# Verify trace correlation
# Click trace ID → Jump to logs → Should show corresponding log entries
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Tracing for debugging
- ✅ Article II (Spec-Driven): Following design
- ✅ Article III (Test-First): Tracing tests included

---

### Task 0-7: Infrastructure as Code - Docker Compose

**Branch:** `feature/task-0-7-iac-docker-compose`

**Objective:**  
Create Docker Compose configuration for quick local development without Kubernetes.

**What to Build:**
1. `deployment/docker-compose/docker-compose.yml` - Full stack
2. `deployment/docker-compose/docker-compose.infra.yml` - Just infrastructure
3. `deployment/docker-compose/.env.docker` - Docker-specific env vars
4. Scripts to start/stop infrastructure

**Acceptance Criteria:**
- [ ] `make infra-up` starts all infrastructure services
- [ ] Services accessible: Redpanda (19092), Grafana (3000), Prometheus (9090)
- [ ] Startup time < 60 seconds
- [ ] Data persists across restarts (volumes configured)
- [ ] `make infra-down` cleanly stops all services
- [ ] Documentation explains when to use Docker Compose vs Kubernetes

**Implementation Details:**
```yaml
# docker-compose.infra.yml structure:
services:
  redpanda:
    image: docker.redpanda.com/redpandadata/redpanda:v23.2.15
    ports: [19092:19092, 18081:8081, 18082:8082]
    volumes: [redpanda-data:/var/lib/redpanda/data]
  
  prometheus:
    image: prom/prometheus:latest
    ports: [9090:9090]
    volumes: [./prometheus.yml:/etc/prometheus/prometheus.yml]
  
  grafana:
    image: grafana/grafana:latest
    ports: [3000:3000]
    volumes: [grafana-data:/var/lib/grafana]
```

**Files to Create:**
- `deployment/docker-compose/docker-compose.yml`
- `deployment/docker-compose/docker-compose.infra.yml`
- `deployment/docker-compose/.env.docker`
- `deployment/docker-compose/prometheus.yml`
- `deployment/docker-compose/grafana-datasources.yml`
- `scripts/infra-up-compose.sh`
- `scripts/infra-down-compose.sh`
- `docs/developer-guide/docker-compose-vs-k8s.md`

**Estimated Time:** 3-4 hours

**Dependencies:** None (can run in parallel with K8s tasks)

**Validation:**
```bash
# Start infrastructure
make infra-up

# Verify all services are running
docker-compose -f deployment/docker-compose/docker-compose.infra.yml ps

# Test Kafka connectivity
./scripts/kafka-produce-test.sh --host localhost:19092

# Access Grafana
open http://localhost:3000

# Stop infrastructure
make infra-down

# Verify cleanup
docker ps  # Should show no running containers
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): IaC principle
- ✅ Article II (Spec-Driven): Following design
- ✅ Article III (Test-First): Integration tests

---

### Task 0-8: CI/CD Pipeline - GitHub Actions

**Branch:** `feature/task-0-8-cicd-github-actions`

**Objective:**  
Set up CI/CD pipeline using GitHub Actions for automated testing, linting, and security scanning.

**What to Build:**
1. `.github/workflows/ci.yml` - Main CI pipeline
2. `.github/workflows/security.yml` - Security scanning
3. `.github/workflows/dependencies.yml` - Dependency updates
4. Pre-commit configuration
5. Code quality tools configuration

**Acceptance Criteria:**
- [ ] CI runs on every push to main/develop
- [ ] CI runs on every pull request
- [ ] Linting passes (black, isort, flake8, mypy)
- [ ] Tests pass (unit + integration)
- [ ] Security scans pass (Trivy, git-secrets)
- [ ] Code coverage reported to Codecov
- [ ] Pipeline completes in < 5 minutes (REQ-0.5)
- [ ] Failed builds block merging
- [ ] Documentation explains CI/CD workflow

**Implementation Details:**

**CI Pipeline Stages:**
1. Lint & Format Check (black, isort, flake8, mypy)
2. Security Scan (Trivy, TruffleHog)
3. Unit Tests (pytest, coverage)
4. Integration Tests (requires infrastructure)
5. Build Docker Image (on main branch)
6. Report Coverage (Codecov)

**Pre-commit Hooks:**
- black (formatting)
- isort (import sorting)
- flake8 (linting)
- mypy (type checking)
- detect-secrets (secret detection)
- trailing-whitespace
- end-of-file-fixer

**Files to Create:**
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/dependencies.yml`
- `.pre-commit-config.yaml`
- `pyproject.toml` - Tool configurations (black, isort, flake8, mypy)
- `.flake8` - Flake8 configuration
- `mypy.ini` - Mypy configuration
- `docs/developer-guide/ci-cd-pipeline.md`

**Estimated Time:** 4-5 hours

**Dependencies:** Task 0-1 (dev environment for testing)

**Validation:**
```bash
# Install pre-commit hooks
pre-commit install

# Test pre-commit locally
pre-commit run --all-files

# Create test PR
git checkout -b test/ci-validation
git commit --allow-empty -m "test: CI pipeline"
git push origin test/ci-validation
# Create PR on GitHub → Verify CI runs

# Check pipeline performance
# GitHub Actions → Workflows → CI → Check duration < 5 minutes
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Security scanning in pipeline
- ✅ Article II (Spec-Driven): Following design
- ✅ Article III (Test-First): Enforced in CI

---

### Task 0-9: Secrets Management

**Branch:** `feature/task-0-9-secrets-management`

**Objective:**  
Implement secure secrets management for local development and prepare for Azure Key Vault migration.

**What to Build:**
1. `.env.example` - Template for secrets
2. Pre-commit hooks for secret detection
3. Python configuration loader
4. Kubernetes secrets management
5. Documentation for secrets handling

**Acceptance Criteria:**
- [ ] `.env.example` exists with all required variables
- [ ] `.env` is gitignored
- [ ] Pre-commit hook blocks commits with secrets
- [ ] Python app loads secrets from .env
- [ ] Kubernetes can mount secrets as environment variables
- [ ] Documentation explains secret rotation process
- [ ] Azure Key Vault integration documented (for future)
- [ ] No secrets in git history

**Implementation Details:**

**Environment Variables:**
```bash
# .env.example
# Trading API
ALPACA_API_KEY=your_key_here
ALPACA_SECRET_KEY=your_secret_here

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/smarttrader
REDIS_URL=redis://localhost:6379

# Observability
GRAFANA_ADMIN_PASSWORD=admin
```

**Python Configuration:**
```python
# src/shared/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    alpaca_api_key: str
    alpaca_secret_key: str
    database_url: str
    redis_url: str
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

**Files to Create:**
- `.env.example`
- `.gitignore` - Updated with .env
- `.pre-commit-config.yaml` - Updated with detect-secrets
- `src/shared/config.py` - Configuration loader
- `scripts/secrets-to-k8s.sh` - Convert .env to K8s secret
- `docs/developer-guide/secrets-management.md`
- `docs/developer-guide/azure-key-vault-migration.md`

**Estimated Time:** 3-4 hours

**Dependencies:** Task 0-1 (dev environment)

**Validation:**
```bash
# Test secret detection
echo "api_key=sk_live_123456" >> test.py
git add test.py
git commit -m "test"  # Should be blocked by pre-commit hook

# Test configuration loading
python -c "from src.shared.config import settings; print(settings.alpaca_api_key)"

# Test Kubernetes secret creation
./scripts/secrets-to-k8s.sh
kubectl get secret app-secrets -n services -o yaml
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Secure secrets management
- ✅ Article II (Spec-Driven): Following design
- ✅ Article III (Test-First): Secret detection tests

---

### Task 0-10: Service Template & Scaffolding

**Branch:** `feature/task-0-10-service-template`

**Objective:**  
Create Python FastAPI service template with observability, testing, and Kafka integration built-in.

**What to Build:**
1. Cookiecutter template for new services
2. Example service demonstrating all patterns
3. Script to generate new services
4. Testing utilities and fixtures

**Acceptance Criteria:**
- [ ] `./scripts/create-service.sh` generates new service
- [ ] Generated service has FastAPI with health endpoints
- [ ] Prometheus metrics integrated
- [ ] Structured logging configured
- [ ] OpenTelemetry tracing set up
- [ ] Kafka producer/consumer utilities included
- [ ] Unit test examples included
- [ ] Integration test examples included
- [ ] Dockerfile included
- [ ] Kubernetes manifests included
- [ ] Documentation generated with service

**Implementation Details:**

**Template Structure:**
```
templates/python-service/
└── {{cookiecutter.service_name}}/
    ├── Dockerfile
    ├── pyproject.toml
    ├── README.md
    ├── src/
    │   ├── main.py              # FastAPI app
    │   ├── config.py            # Configuration
    │   ├── api/routes.py        # HTTP endpoints
    │   ├── kafka/               # Kafka utilities
    │   ├── models/              # Pydantic models
    │   └── services/            # Business logic
    ├── tests/
    │   ├── unit/
    │   └── integration/
    └── k8s/
        ├── deployment.yaml
        ├── service.yaml
        └── configmap.yaml
```

**Example Service Features:**
- `/health` - Liveness check
- `/ready` - Readiness check (checks dependencies)
- `/metrics` - Prometheus metrics endpoint
- Automatic request logging
- Automatic request tracing
- Graceful shutdown handling
- Kafka consumer with auto-commit management

**Files to Create:**
- `templates/python-service/cookiecutter.json`
- `templates/python-service/{{cookiecutter.service_name}}/` - Full template
- `src/shared/fastapi_base.py` - Base FastAPI setup
- `src/shared/kafka_utils.py` - Kafka producer/consumer
- `src/shared/test_fixtures.py` - Common test fixtures
- `scripts/create-service.sh` - Service generator
- `examples/demo-service/` - Complete working example
- `docs/developer-guide/creating-new-service.md`

**Estimated Time:** 6-7 hours

**Dependencies:** Task 0-6 (tracing), Task 0-9 (config)

**Validation:**
```bash
# Generate new service
./scripts/create-service.sh
# Enter: test-service
# Enter: A test service for validation

# Build and run
cd src/services/test-service
poetry install
poetry run pytest
docker build -t test-service .
docker run -p 8000:8000 test-service

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/metrics

# Deploy to K8s
kubectl apply -f k8s/
kubectl wait --for=condition=ready pod -l app=test-service -n services
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Security by default in template
- ✅ Article II (Spec-Driven): Following design
- ✅ Article III (Test-First): Tests included in template
- ✅ Article IV (Event-Driven): Kafka integration included

---

### Task 0-11: Makefile & Automation

**Branch:** `feature/task-0-11-makefile-automation`

**Objective:**  
Create Makefile with common commands for developers to easily manage infrastructure and development workflow.

**What to Build:**
1. `Makefile` - All common commands
2. Helper scripts for complex operations
3. Documentation for Makefile usage

**Acceptance Criteria:**
- [ ] `make help` shows all available commands
- [ ] `make dev-setup` runs full development environment setup
- [ ] `make verify` validates environment is working
- [ ] `make infra-up` starts infrastructure (K8s or Docker Compose)
- [ ] `make infra-down` stops infrastructure
- [ ] `make test` runs all tests
- [ ] `make test-unit` runs unit tests only
- [ ] `make test-integration` runs integration tests only
- [ ] `make lint` runs linting
- [ ] `make format` auto-formats code
- [ ] `make clean` cleans up everything
- [ ] Documentation explains each command

**Implementation Details:**

**Makefile Commands:**
```makefile
help                 # Show available commands
dev-setup           # Set up development environment
verify              # Verify environment is working
infra-up            # Start infrastructure (K8s)
infra-up-compose    # Start infrastructure (Docker Compose)
infra-down          # Stop infrastructure
cluster-create      # Create K8s cluster
cluster-destroy     # Destroy K8s cluster
test                # Run all tests
test-unit           # Run unit tests
test-integration    # Run integration tests
test-performance    # Run performance tests
lint                # Run linting checks
format              # Auto-format code
clean               # Clean up everything
topics-create       # Create Kafka topics
service-create      # Generate new service from template
```

**Files to Create:**
- `Makefile`
- `scripts/wait-for-infra.sh` - Wait for services to be ready
- `scripts/run-integration-tests.sh` - Integration test runner
- `docs/developer-guide/makefile-commands.md`

**Estimated Time:** 2-3 hours

**Dependencies:** All previous tasks (integrates everything)

**Validation:**
```bash
# Test each command
make help
make dev-setup
make verify
make cluster-create
make infra-up
make topics-create
make test-unit
make test-integration
make lint
make format
make clean
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Automated workflows
- ✅ Article II (Spec-Driven): Following design
- ✅ Article III (Test-First): Easy test execution

---

### Task 0-12: Documentation & Developer Guide

**Branch:** `feature/task-0-12-documentation`

**Objective:**  
Create comprehensive developer documentation for onboarding and daily development.

**What to Build:**
1. Getting started guide
2. Architecture diagrams
3. Common tasks documentation
4. Troubleshooting guide
5. FAQ

**Acceptance Criteria:**
- [ ] New developer can set up environment in < 30 minutes following docs
- [ ] All common tasks documented with examples
- [ ] Architecture diagrams up to date
- [ ] Troubleshooting guide covers common issues
- [ ] FAQ answers frequent questions
- [ ] Documentation is searchable and well-organized

**Files to Create:**
- `docs/developer-guide/README.md` - Navigation hub
- `docs/developer-guide/getting-started.md` - Already created, review
- `docs/developer-guide/architecture-overview.md`
- `docs/developer-guide/daily-workflow.md`
- `docs/developer-guide/troubleshooting.md`
- `docs/developer-guide/faq.md`
- `docs/developer-guide/glossary.md`

**Documentation Topics:**
1. **Getting Started** - Environment setup
2. **Architecture** - System overview, component diagrams
3. **Daily Workflow** - Typical development day
4. **Common Tasks** - Create service, add endpoint, add Kafka topic
5. **Testing** - How to write and run tests
6. **Observability** - How to use Grafana, query logs, view traces
7. **Kafka** - How to produce/consume events
8. **Troubleshooting** - Common issues and solutions
9. **FAQ** - Frequently asked questions
10. **Glossary** - Terms and definitions

**Estimated Time:** 4-5 hours

**Dependencies:** All previous tasks (documents everything)

**Validation:**
- [ ] Have someone unfamiliar with project follow docs
- [ ] They should be able to set up environment and run tests
- [ ] Collect feedback and iterate
- [ ] All links work
- [ ] Code examples are tested and working

**Constitutional Compliance:**
- ✅ Article II (Spec-Driven): Documentation is part of specs

---

### Task 0-13: End-to-End Validation & Demo Service

**Branch:** `feature/task-0-13-e2e-validation`

**Objective:**  
Create "hello-world" demo service that exercises all infrastructure components and validates Phase 0 is complete.

**What to Build:**
1. Demo service that uses all infrastructure
2. End-to-end integration tests
3. Performance validation tests
4. Documentation of validation results

**Acceptance Criteria:**
- [ ] Demo service deployed to Kubernetes
- [ ] Service produces events to Kafka
- [ ] Service consumes events from Kafka
- [ ] Service exposes Prometheus metrics
- [ ] Service logs to Loki
- [ ] Service generates traces in Tempo
- [ ] Health endpoints return 200
- [ ] Integration tests pass
- [ ] Performance meets Phase 0 requirements:
  - Kafka throughput > 10,000 msg/sec
  - Kafka latency p95 < 50ms
  - CI pipeline < 5 minutes
  - Cluster startup < 2 minutes
  - Resource usage < 4GB RAM

**Implementation Details:**

**Demo Service Endpoints:**
- `POST /events` - Produce event to Kafka
- `GET /events/stream` - SSE stream of consumed events
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

**Validation Tests:**
```python
# tests/e2e/test_full_stack.py
def test_kafka_produce_consume():
    """Test full Kafka flow."""
    # Produce event via API
    # Consume event and verify
    
def test_observability():
    """Test metrics, logs, traces."""
    # Make request
    # Verify metric in Prometheus
    # Verify log in Loki
    # Verify trace in Tempo
    
def test_performance():
    """Test performance requirements."""
    # Measure Kafka throughput
    # Measure latency p95
```

**Files to Create:**
- `examples/demo-service/` - Complete demo service
- `tests/e2e/test_full_stack.py` - End-to-end tests
- `tests/performance/` - Performance test suite
- `docs/phase-0-validation-report.md` - Validation results

**Estimated Time:** 5-6 hours

**Dependencies:** All previous tasks (validates everything)

**Validation:**
```bash
# Deploy demo service
kubectl apply -f examples/demo-service/k8s/

# Run end-to-end tests
poetry run pytest tests/e2e/ -v

# Run performance tests
poetry run pytest tests/performance/ -v

# Manual validation
# 1. Access Grafana - verify metrics
# 2. Query Loki - verify logs
# 3. View Tempo - verify traces
# 4. Test Kafka - verify produce/consume

# Generate validation report
python scripts/generate-validation-report.py > docs/phase-0-validation-report.md
```

**Constitutional Compliance:**
- ✅ Article I (DevSecOps): Full stack security validated
- ✅ Article II (Spec-Driven): Validates requirements met
- ✅ Article III (Test-First): Comprehensive test coverage
- ✅ Article IV (Event-Driven): Kafka flow validated

---

## 📊 Task Summary

| Task | Estimated Time | Dependencies | Priority |
|------|---------------|--------------|----------|
| 0-1: Dev Environment Setup | 3-4 hours | None | 🔴 CRITICAL |
| 0-2: Kubernetes Cluster | 2-3 hours | 0-1 | 🔴 CRITICAL |
| 0-3: Event Bus (Redpanda) | 4-5 hours | 0-2 | 🔴 CRITICAL |
| 0-4: Prometheus & Grafana | 5-6 hours | 0-2 | 🔴 CRITICAL |
| 0-5: Logging (Loki) | 3-4 hours | 0-4 | 🟡 HIGH |
| 0-6: Tracing (Tempo) | 4-5 hours | 0-5 | 🟡 HIGH |
| 0-7: Docker Compose | 3-4 hours | None | 🟢 MEDIUM |
| 0-8: CI/CD Pipeline | 4-5 hours | 0-1 | 🟡 HIGH |
| 0-9: Secrets Management | 3-4 hours | 0-1 | 🔴 CRITICAL |
| 0-10: Service Template | 6-7 hours | 0-6, 0-9 | 🟡 HIGH |
| 0-11: Makefile Automation | 2-3 hours | All | 🟢 MEDIUM |
| 0-12: Documentation | 4-5 hours | All | 🟢 MEDIUM |
| 0-13: E2E Validation | 5-6 hours | All | 🔴 CRITICAL |

**Total Estimated Time:** 49-61 hours (~1.5-2 months at 8 hours/week)

---

## 🎯 Recommended Execution Order

### Week 1: Core Infrastructure
1. Task 0-1: Dev Environment Setup
2. Task 0-2: Kubernetes Cluster
3. Task 0-3: Event Bus (Redpanda)
4. Task 0-9: Secrets Management

### Week 2: Observability
5. Task 0-4: Prometheus & Grafana
6. Task 0-5: Logging (Loki)
7. Task 0-6: Tracing (Tempo)

### Week 3: Development Tools
8. Task 0-8: CI/CD Pipeline
9. Task 0-10: Service Template
10. Task 0-7: Docker Compose (optional, can do in parallel)

### Week 4: Integration & Documentation
11. Task 0-11: Makefile Automation
12. Task 0-12: Documentation
13. Task 0-13: E2E Validation

---

## ✅ Phase 0 Completion Criteria

**Phase 0 is complete when:**

1. ✅ All 13 tasks completed and merged to main
2. ✅ All acceptance criteria met for each task
3. ✅ All tests passing (unit, integration, performance)
4. ✅ All documentation complete and reviewed
5. ✅ Demo service running successfully
6. ✅ Performance requirements validated:
   - Kubernetes cluster < 2 min startup
   - Kubernetes cluster < 4GB RAM
   - Kafka throughput > 10,000 msg/sec
   - Kafka latency p95 < 50ms
   - CI pipeline < 5 minutes
7. ✅ New developer can onboard in < 30 minutes
8. ✅ All infrastructure code reviewed
9. ✅ Phase 0 validation report approved
10. ✅ Ready to build Phase 1 services

---

## 🛑 START AUTHORIZATION REQUIRED

**🛑 BEFORE STARTING TASK 0-1, YOU MUST:**

1. ✅ Confirm this task breakdown makes sense
2. ✅ Confirm the execution order is acceptable
3. ✅ Confirm you're ready to start Task 0-1
4. ✅ Authorize me to begin: **"Approved, start Task 0-1"**

**Once you give authorization, I will:**
1. Read the Before Task checklist (`docs/memory-bank/rules/before-task.md`)
2. Execute the pre-task checklist
3. Create branch `feature/task-0-1-dev-environment-setup`
4. Begin implementing Task 0-1
5. Follow TDD and all constitutional requirements
6. Report progress and ask for guidance as needed

---

**Ready to build the foundation? Just say: "Approved, start Task 0-1"** 🚀
