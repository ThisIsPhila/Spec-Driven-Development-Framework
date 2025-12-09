---
name: DevOps
type: modifier
description: Advanced CI/CD and infrastructure automation
includes:
  - pipeline-design-template.md
  - infrastructure-template.md
  - deployment-checklist.md
examples:
  - api+devops - Backend with blue-green deployment
  - web+devops - React app with preview environments
  - full-stack+devops - Complete infrastructure automation
---

# DevOps Modifier

The **DevOps** modifier adds advanced CI/CD and infrastructure-as-code workflows to any base profile. It emphasizes automation, deployment strategies, and infrastructure documentation.

## What You Get

**Added to your base profile:**

### Templates
- `pipeline-design-template.md` - CI/CD pipeline specifications
  - Pipeline stages (lint, test, build, deploy)
  - Deployment strategies (rolling, blue-green, canary)
  - Environment management (dev, staging, production)
  - Rollback procedures
  - Secret management in CI
- `infrastructure-template.md` - Infrastructure as Code documentation
  - Terraform/Pulumi/CloudFormation specs
  - Resource definitions
  - Network architecture
  - Monitoring and alerting setup
  - Cost estimation

### Rules
- `deployment-checklist.md` - Pre-deployment verification
  - Health checks configured
  - Rollback plan tested
  - Database migrations reviewed
  - Feature flags validated
  - Monitoring alerts configured
  - Zero-downtime deployment verified

## When to Use

- Building cloud-native applications
- Deploying to Kubernetes
- Managing infrastructure as code
- Requiring advanced deployment strategies
- Multi-environment setups (dev, staging, prod)

## Agent Detection

Agent will recommend this modifier when detecting:
- IaC tools: `terraform`, `pulumi`, `cloudformation`
- CI/CD configs: `.github/workflows`, `.gitlab-ci.yml`, `Jenkinsfile`
- Container orchestration: `docker-compose.yml`, `kubernetes/`, `helm/`
- Cloud SDKs: `@aws-sdk`, `@google-cloud`, `@azure`

## Composition Examples

- `api+devops` - Backend with Kubernetes deployment
- `web+devops` - React app with preview environments
- `full-stack+devops` - Complete automation pipeline
- `api+devsecops+devops` - Secure automated deployment
