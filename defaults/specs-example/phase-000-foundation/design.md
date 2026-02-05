# Phase 0: Foundation & Infrastructure - Design

**Phase:** Phase 0 - Foundation & Infrastructure Setup  
**Created:** October 2, 2025  
**Status:** ✅ APPROVED  
**Requirements Approved:** ✅ YES (October 2, 2025)  
**Approved:** October 2, 2025

---

## 🎯 Design Overview

This document details **HOW** we will implement the Phase 0 requirements. It specifies:
- Exact technology choices
- Architecture and integration patterns
- Configuration details
- Directory structure
- Implementation approach

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEVELOPER MACHINE                          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              Docker Desktop / Colima                    │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │         k3s (Lightweight Kubernetes)             │  │   │
│  │  │                                                   │  │   │
│  │  │  ┌─────────────┐  ┌─────────────┐              │  │   │
│  │  │  │ Namespace:  │  │ Namespace:  │              │  │   │
│  │  │  │ infra       │  │ services    │              │  │   │
│  │  │  │             │  │             │              │  │   │
│  │  │  │ - Kafka     │  │ (Future:    │              │  │   │
│  │  │  │ - Prometheus│  │  Market Data│              │  │   │
│  │  │  │ - Grafana   │  │  Strategy   │              │  │   │
│  │  │  │ - Loki      │  │  etc.)      │              │  │   │
│  │  │  │ - Jaeger    │  │             │              │  │   │
│  │  │  └─────────────┘  └─────────────┘              │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │            Local File System                            │   │
│  │                                                         │   │
│  │  example-app/                                         │   │
│  │  ├── .env (gitignored secrets)                        │   │
│  │  ├── deployment/k8s/                                  │   │
│  │  ├── scripts/                                         │   │
│  │  └── src/                                             │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ (Future migration)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AZURE CLOUD                             │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ Azure AKS      │  │ Azure Event    │  │ Azure          │  │
│  │ (Kubernetes)   │  │ Hubs (Kafka)   │  │ Key Vault      │  │
│  └────────────────┘  └────────────────┘  └────────────────┘  │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ Azure          │  │ Azure          │  │ Azure          │  │
│  │ Monitor        │  │ Container      │  │ Log Analytics  │  │
│  │                │  │ Registry       │  │                │  │
│  └────────────────┘  └────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack Decisions

### REQ-0.1: Local Kubernetes Cluster

**Decision: k3s via Docker Desktop**

**Rationale:**
- **k3s**: Lightweight K8s distribution (< 100MB), perfect for local dev
- **Docker Desktop**: Most developers already have it installed
- **Alternative**: k3d (k3s in Docker) for even lighter footprint

**Installation:**
```bash
# Option 1: Docker Desktop with Kubernetes enabled
# Settings → Kubernetes → Enable Kubernetes

# Option 2: k3d (k3s in Docker) - RECOMMENDED
brew install k3d
k3d cluster create example-app \
  --agents 2 \
  --port 8080:80@loadbalancer \
  --port 8443:443@loadbalancer
```

**Configuration:**
```yaml
# k3d-config.yaml
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
options:
  k3s:
    extraArgs:
      - arg: --disable=traefik  # We'll use our own ingress
        nodeFilters:
          - server:*
```

**Namespaces:**
- `infra`: Infrastructure services (Kafka, observability)
- `services`: Application services (market-data, strategy, etc.)
- `default`: Temporary/testing

---

### REQ-0.2: Event Bus (Message Broker)

**Decision: Redpanda (Kafka-compatible)**

**Rationale:**
- **Redpanda**: Kafka-compatible but written in C++ (faster, lighter than JVM-based Kafka)
- **No Zookeeper**: Simpler architecture (Kafka needs Zookeeper)
- **Single binary**: Easier to run locally
- **Resource-efficient**: < 500MB RAM vs Kafka's 1-2GB
- **Kafka-compatible**: Can switch to Azure Event Hubs seamlessly

**Alternative:** If Redpanda has issues, fall back to Confluent Kafka (single broker)

**Deployment:**
```yaml
# deployment/k8s/infra/redpanda.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redpanda
  namespace: infra
spec:
  serviceName: redpanda
  replicas: 1
  selector:
    matchLabels:
      app: redpanda
  template:
    metadata:
      labels:
        app: redpanda
    spec:
      containers:
      - name: redpanda
        image: docker.redpanda.com/redpandadata/redpanda:v23.2.15
        args:
          - redpanda
          - start
          - --kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092
          - --advertise-kafka-addr internal://redpanda-0.redpanda.infra.svc.cluster.local:9092,external://localhost:19092
          - --pandaproxy-addr internal://0.0.0.0:8082,external://0.0.0.0:18082
          - --advertise-pandaproxy-addr internal://redpanda-0.redpanda.infra.svc.cluster.local:8082,external://localhost:18082
          - --schema-registry-addr internal://0.0.0.0:8081,external://0.0.0.0:18081
          - --rpc-addr redpanda-0.redpanda.infra.svc.cluster.local:33145
          - --advertise-rpc-addr redpanda-0.redpanda.infra.svc.cluster.local:33145
          - --smp 1
          - --memory 1G
          - --reserve-memory 0M
          - --overprovisioned
          - --node-id 0
          - --check=false
        ports:
          - containerPort: 9092
            name: kafka-internal
          - containerPort: 19092
            name: kafka-external
          - containerPort: 8081
            name: schema-registry
          - containerPort: 8082
            name: pandaproxy
        volumeMounts:
          - name: redpanda-data
            mountPath: /var/lib/redpanda/data
  volumeClaimTemplates:
    - metadata:
        name: redpanda-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

**Access:**
- **Internal (from services):** `redpanda.infra.svc.cluster.local:9092`
- **External (from laptop):** `localhost:19092`
- **Console UI:** Redpanda Console at `localhost:8080/redpanda`

**Topics (to be created):**
- `market-data.candles.1m`
- `market-data.candles.5m`
- `market-data.trades`
- `signals.generated`
- `orders.placed`
- `orders.filled`

---

### REQ-0.3: Observability Stack

**Decision: Prometheus + Grafana + Loki + Tempo**

**Rationale:**
- **All open-source**: No vendor lock-in
- **Grafana as single pane**: Metrics, logs, traces in one UI
- **Lightweight**: Tempo (traces) is lighter than Jaeger
- **Cloud-ready**: Azure Monitor can ingest Prometheus metrics

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Observability Stack                      │
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │  Prometheus  │      │    Loki      │      │    Tempo     │ │
│  │   (Metrics)  │      │    (Logs)    │      │   (Traces)   │ │
│  │              │      │              │      │              │ │
│  │  Pull from   │      │  Push from   │      │  Push from   │ │
│  │  /metrics    │      │  Promtail    │      │  services    │ │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘ │
│         │                     │                     │          │
│         └─────────────────────┴─────────────────────┘          │
│                               │                                │
│                    ┌──────────▼──────────┐                     │
│                    │      Grafana        │                     │
│                    │  (Visualization)    │                     │
│                    │  localhost:3000     │                     │
│                    └─────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

**Deployment Strategy:**

**Option 1: Helm Charts (Recommended)**
```bash
# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack (Prometheus + Grafana + Alertmanager)
helm install kube-prometheus prometheus-community/kube-prometheus-stack \
  --namespace infra \
  --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set grafana.adminPassword=admin

# Install Loki
helm install loki grafana/loki-stack \
  --namespace infra \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=10Gi \
  --set promtail.enabled=true

# Install Tempo
helm install tempo grafana/tempo \
  --namespace infra \
  --set tempo.persistence.enabled=true \
  --set tempo.persistence.size=10Gi
```

**Option 2: Custom Manifests** (if Helm not preferred)

**Access:**
- **Grafana:** `localhost:3000` (admin/admin)
- **Prometheus:** `localhost:9090`
- **Alertmanager:** `localhost:9093`

**Pre-configured Dashboards:**
1. Kubernetes cluster overview
2. Service metrics (latency, throughput, errors)
3. Kafka/Redpanda monitoring
4. Resource usage (CPU, memory, disk)
5. Custom Example-App metrics

**Alerting Rules:**
- Service down > 1 minute
- Error rate > 5%
- Latency p95 > 500ms
- Disk usage > 80%
- Memory usage > 90%

---

### REQ-0.4: Infrastructure as Code

**Decision: Docker Compose + Kubernetes Manifests + Makefile**

**Rationale:**
- **Docker Compose**: Simple, fast iteration for local services
- **Kubernetes Manifests**: Production-like environment
- **Makefile**: Simple commands to orchestrate everything
- **Terraform**: Phase 3 (when we deploy to Azure)

**Directory Structure:**

```
example-app/
├── deployment/
│   ├── docker-compose/
│   │   ├── docker-compose.yml          # Full stack
│   │   ├── docker-compose.infra.yml    # Just infrastructure
│   │   └── docker-compose.override.yml # Local overrides
│   │
│   ├── k8s/
│   │   ├── namespaces/
│   │   │   ├── infra.yaml
│   │   │   └── services.yaml
│   │   │
│   │   ├── infra/
│   │   │   ├── redpanda/
│   │   │   │   ├── statefulset.yaml
│   │   │   │   ├── service.yaml
│   │   │   │   └── kustomization.yaml
│   │   │   │
│   │   │   ├── prometheus/
│   │   │   │   └── (Helm-managed)
│   │   │   │
│   │   │   ├── grafana/
│   │   │   │   └── (Helm-managed)
│   │   │   │
│   │   │   └── loki/
│   │   │       └── (Helm-managed)
│   │   │
│   │   └── services/
│   │       └── (Future: market-data, strategy, etc.)
│   │
│   └── terraform/
│       └── azure/
│           ├── main.tf
│           ├── variables.tf
│           ├── outputs.tf
│           └── modules/
│               ├── aks/
│               ├── event-hubs/
│               └── key-vault/
│
├── scripts/
│   ├── setup-dev-environment.sh
│   ├── verify-environment.sh
│   ├── start-local-infra.sh
│   ├── stop-local-infra.sh
│   └── deploy-to-k8s.sh
│
└── Makefile
```

**Makefile Commands:**

```makefile
# Makefile
.PHONY: help dev-setup infra-up infra-down k8s-up k8s-down test

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev-setup:  ## Set up development environment
	@./scripts/setup-dev-environment.sh

verify:  ## Verify development environment
	@./scripts/verify-environment.sh

infra-up:  ## Start infrastructure with Docker Compose
	@docker-compose -f deployment/docker-compose/docker-compose.infra.yml up -d
	@echo "Waiting for services to be ready..."
	@./scripts/wait-for-infra.sh

infra-down:  ## Stop infrastructure
	@docker-compose -f deployment/docker-compose/docker-compose.infra.yml down

k8s-up:  ## Deploy infrastructure to Kubernetes
	@./scripts/deploy-to-k8s.sh

k8s-down:  ## Delete Kubernetes resources
	@kubectl delete namespace infra services

test:  ## Run tests
	@pytest tests/ -v

clean:  ## Clean up everything
	@docker-compose -f deployment/docker-compose/docker-compose.infra.yml down -v
	@k3d cluster delete example-app
```

---

### REQ-0.5: CI/CD Pipeline

**Decision: GitHub Actions**

**Rationale:**
- Already using GitHub for code
- Free for public repos (2,000 minutes/month for private)
- Native integration with GitHub features
- Familiar YAML syntax

**Workflows:**

**1. CI Pipeline (`.github/workflows/ci.yml`)**

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install poetry
          poetry install
      
      - name: Run black (format check)
        run: poetry run black --check src/ tests/
      
      - name: Run isort (import sort check)
        run: poetry run isort --check-only src/ tests/
      
      - name: Run flake8 (linting)
        run: poetry run flake8 src/ tests/
      
      - name: Run mypy (type checking)
        run: poetry run mypy src/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy (vulnerability scanner)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
      
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

  test:
    runs-on: ubuntu-latest
    needs: [lint-and-format, security-scan]
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install poetry
          poetry install
      
      - name: Run unit tests
        run: |
          poetry run pytest tests/unit/ -v --cov=src --cov-report=xml --cov-report=term
      
      - name: Run integration tests
        run: |
          poetry run pytest tests/integration/ -v
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
          fail_ci_if_error: true

  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            your-org/example-app:latest
            your-org/example-app:${{ github.sha }}
          cache-from: type=registry,ref=your-org/example-app:buildcache
          cache-to: type=registry,ref=your-org/example-app:buildcache,mode=max
```

**2. Dependency Update (`.github/workflows/dependencies.yml`)**

```yaml
name: Update Dependencies

on:
  schedule:
    - cron: '0 0 * * 1'  # Every Monday at midnight
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install poetry
        run: pip install poetry
      
      - name: Update dependencies
        run: poetry update
      
      - name: Run tests
        run: |
          poetry run pytest tests/ -v
      
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: 'chore: update dependencies'
          title: 'Update Python dependencies'
          body: 'Automated dependency update'
          branch: 'dependency-updates'
```

---

### REQ-0.6: Secrets Management

**Decision: .env files + git-secrets + Docker Secrets**

**Local Development:**

```bash
# .env (NEVER commit this)
ALPACA_API_KEY=PKXXX...
ALPACA_SECRET_KEY=XXX...
DATABASE_PASSWORD=xxx
REDIS_PASSWORD=xxx
```

```python
# src/shared/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    alpaca_api_key: str
    alpaca_secret_key: str
    database_password: str
    redis_password: str
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

**Pre-commit Hook:**

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package.lock.json

  - repo: https://github.com/awslabs/git-secrets
    rev: 1.3.0
    hooks:
      - id: git-secrets
```

**Kubernetes Secrets:**

```bash
# Create secret from .env file
kubectl create secret generic app-secrets \
  --from-env-file=.env \
  --namespace=services

# Use in deployment
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: market-data
        envFrom:
        - secretRef:
            name: app-secrets
```

**Azure Migration (Future):**

```python
# When migrating to Azure
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://example-app-kv.vault.azure.net/", credential=credential)

alpaca_api_key = client.get_secret("alpaca-api-key").value
```

---

### REQ-0.7: Development Environment Setup

**One-Command Setup:**

```bash
# scripts/setup-dev-environment.sh
#!/bin/bash
set -e

echo "🚀 Setting up Example-App development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl not installed"; exit 1; }

# Install k3d if not present
if ! command -v k3d &> /dev/null; then
    echo "📦 Installing k3d..."
    brew install k3d
fi

# Install Helm if not present
if ! command -v helm &> /dev/null; then
    echo "📦 Installing Helm..."
    brew install helm
fi

# Create k3d cluster
echo "🏗️ Creating Kubernetes cluster..."
k3d cluster create example-app --config deployment/k8s/k3d-config.yaml

# Add Helm repos
echo "📚 Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Create namespaces
echo "🏷️ Creating namespaces..."
kubectl apply -f deployment/k8s/namespaces/

# Install observability stack
echo "📊 Installing observability stack..."
make infra-up

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install poetry
poetry install

# Install pre-commit hooks
echo "🔒 Installing pre-commit hooks..."
poetry run pre-commit install

# Create .env template
if [ ! -f .env ]; then
    echo "📝 Creating .env template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual secrets"
fi

echo "✅ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Run 'make verify' to verify setup"
echo "  3. Run 'make infra-up' to start infrastructure"
echo "  4. Access Grafana at http://localhost:3000 (admin/admin)"
```

---

### REQ-0.8: Service Template

**Template Structure:**

```
templates/python-service/
├── {{cookiecutter.service_name}}/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── README.md
│   │
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── metrics.py
│   │   ├── logging_config.py
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py
│   │   │
│   │   ├── models/
│   │   │   └── __init__.py
│   │   │
│   │   ├── services/
│   │   │   └── __init__.py
│   │   │
│   │   └── kafka/
│   │       ├── consumer.py
│   │       └── producer.py
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   │
│   │   ├── unit/
│   │   │   └── test_example.py
│   │   │
│   │   └── integration/
│   │       └── test_example_integration.py
│   │
│   └── k8s/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── configmap.yaml
│       └── kustomization.yaml
```

**FastAPI Template (main.py):**

```python
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
import logging
from .config import settings
from .logging_config import setup_logging
from .api import routes

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="{{ cookiecutter.service_name }}",
    description="{{ cookiecutter.description }}",
    version="0.1.0"
)

# Add Prometheus metrics
Instrumentator().instrument(app).expose(app)

# Health checks
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/ready")
async def readiness_check():
    # Check dependencies (Kafka, DB, etc.)
    return {"status": "ready"}

# Include routes
app.include_router(routes.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Scaffolding Command:**

```bash
# scripts/create-service.sh
#!/bin/bash

read -p "Service name (e.g., market-data): " SERVICE_NAME
read -p "Description: " DESCRIPTION

cookiecutter templates/python-service/ \
  service_name=$SERVICE_NAME \
  description="$DESCRIPTION"

echo "✅ Service created: src/services/$SERVICE_NAME"
```

---

## 📊 Component Integration

### Service → Kafka → Service

```python
# Producer
from aiokafka import AIOKafkaProducer
import json

producer = AIOKafkaProducer(
    bootstrap_servers='redpanda.infra.svc.cluster.local:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

await producer.start()
await producer.send('market-data.candles.1m', {'symbol': 'AAPL', 'price': 150.25})
await producer.stop()

# Consumer
from aiokafka import AIOKafkaConsumer

consumer = AIOKafkaConsumer(
    'market-data.candles.1m',
    bootstrap_servers='redpanda.infra.svc.cluster.local:9092',
    value_deserializer=lambda v: json.loads(v.decode('utf-8')),
    group_id='strategy-service'
)

await consumer.start()
async for msg in consumer:
    print(f"Received: {msg.value}")
```

### Service → Observability

```python
# Metrics
from prometheus_client import Counter, Histogram

request_count = Counter('http_requests_total', 'Total HTTP requests')
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')

# Logging (structured)
import structlog

logger = structlog.get_logger()
logger.info("market_data_received", symbol="AAPL", price=150.25)

# Tracing (OpenTelemetry)
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("process_market_data"):
    # Your code here
    pass
```

---

## 🧪 Testing Strategy

### Infrastructure Tests

```python
# tests/integration/test_infrastructure.py
import pytest
import asyncio
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer

@pytest.mark.integration
async def test_kafka_connectivity():
    """Test that we can produce and consume from Kafka."""
    producer = AIOKafkaProducer(bootstrap_servers='localhost:19092')
    await producer.start()
    
    await producer.send('test-topic', b'test-message')
    await producer.stop()
    
    consumer = AIOKafkaConsumer(
        'test-topic',
        bootstrap_servers='localhost:19092',
        group_id='test-group',
        auto_offset_reset='earliest'
    )
    await consumer.start()
    
    msg = await asyncio.wait_for(consumer.__anext__(), timeout=10)
    assert msg.value == b'test-message'
    
    await consumer.stop()

@pytest.mark.integration
def test_prometheus_metrics():
    """Test that Prometheus is scraping metrics."""
    import requests
    
    response = requests.get('http://localhost:9090/api/v1/targets')
    assert response.status_code == 200
    
    data = response.json()
    # Check that targets are up
    assert any(t['health'] == 'up' for t in data['data']['activeTargets'])

@pytest.mark.integration
def test_grafana_accessibility():
    """Test that Grafana is accessible."""
    import requests
    
    response = requests.get('http://localhost:3000/api/health')
    assert response.status_code == 200
```

---

## 📋 Implementation Phases

### Phase 0.1: Cluster Setup (Week 1)
- Install k3d
- Create cluster with config
- Verify kubectl access
- Create namespaces

### Phase 0.2: Event Bus (Week 1)
- Deploy Redpanda to Kubernetes
- Configure external access
- Create test topics
- Verify produce/consume

### Phase 0.3: Observability (Week 2)
- Install Prometheus via Helm
- Install Grafana via Helm
- Install Loki via Helm
- Install Tempo
- Configure data sources in Grafana
- Import dashboards
- Test metric scraping

### Phase 0.4: IaC & Automation (Week 2)
- Create Docker Compose files
- Create Kubernetes manifests
- Write setup scripts
- Write Makefile
- Test full setup from scratch

### Phase 0.5: CI/CD (Week 3)
- Create GitHub Actions workflows
- Configure secret scanning
- Set up Docker Hub credentials
- Test CI pipeline with dummy service

### Phase 0.6: Secrets & Security (Week 3)
- Configure pre-commit hooks
- Create .env.example
- Document secrets management
- Test secret detection

### Phase 0.7: Documentation & Templates (Week 4)
- Write developer onboarding guide
- Create service template
- Test template generation
- Document common tasks

### Phase 0.8: Validation (Week 4)
- Deploy "hello-world" test service
- End-to-end observability test
- Full teardown and rebuild test
- Performance/resource usage validation

---

## ✅ Design Validation Criteria

**This design is approved when:**

1. ✅ All technology choices are explicit and justified
2. ✅ Architecture diagrams show component relationships
3. ✅ Configuration examples are complete
4. ✅ Integration patterns are documented
5. ✅ Testing strategy is defined
6. ✅ Implementation phases are broken down
7. ✅ No ambiguity remains about "how" to implement

---

## 🛑 APPROVAL CHECKPOINT

**🛑 STOP - DO NOT PROCEED TO TASKS WITHOUT APPROVAL**

**Please review this design and confirm:**

1. Do the technology choices make sense?
2. Is the architecture clear and implementable?
3. Are there any concerns about the approach?
4. Should we use different tools/technologies?
5. Is the phasing reasonable?

**Please respond with:**
- ✅ "Approved - proceed to Tasks"
- 🔄 "I have changes..." (specify changes)
- ❓ "I have questions..." (ask questions)

---

**Once approved, I will create the Phase 0 Tasks document with the specific, actionable tasks to implement this design.**
