---
name: API
type: base
description: Backend API services (REST, GraphQL, gRPC)
includes:
  - api-design-template.md
  - schema-template.md
  - api-versioning.md
examples:
  - FastAPI REST service
  - Express.js GraphQL API
  - Django REST Framework
  - Spring Boot microservice
---

# API Profile

The **API** profile is optimized for backend service development. It includes templates for API design, database schemas, and versioning strategies.

## What You Get

**In addition to General profile**, you receive:

### Templates
- `api-design-template.md` - API specifications
  - Endpoint definitions (REST/GraphQL/gRPC)
  - Request/response schemas  
  - Authentication/authorization
  - Rate limiting
  - Error codes
- `schema-template.md` - Database schema documentation
  - Table/collection definitions
  - Relationships and constraints
  - Indexes and performance
  - Migration strategy

### Rules
- `api-versioning.md` - API versioning strategy
  - Version numbering (semantic versioning)
  - Deprecation policy
  - Breaking change management
  - Backward compatibility

## When to Use

- Building RESTful APIs
- Creating GraphQL services
- Developing gRPC microservices
- Implementing backend-for-frontend (BFF) services

## Technology Stack Detection

Agent will recommend this profile when detecting:
- Python: `fastapi`, `flask`, `django-rest-framework` in `requirements.txt`
- Node: `express`, `koa`, `fastify`, `apollo-server` in `package.json`
- Go: `gin`, `echo`, `chi` in `go.mod`
- Java: `spring-boot`, Maven/Gradle configs
- No frontend indicators (if both, suggests `full-stack`)

## Composition

Can be combined with modifiers:
- `api+devsecops` - API with security (OAuth, rate limiting, input validation)
- `api+mlops` - API with ML inference endpoints
- `api+devops` - API with advanced CI/CD (blue-green deployment, canary releases)
