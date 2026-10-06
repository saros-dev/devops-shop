# devops-shop

> A production-inspired DevOps & SRE laboratory built around a real full-stack application, automated CI/CD, infrastructure automation, and end-to-end observability.

`devops-shop` is a full-stack application created as a hands-on **DevOps, SRE, and observability engineering laboratory**.

The application itself is intentionally simple.

The infrastructure around it is the real project.

The goal is to explore how a software application moves from source code to containers, automated testing, image publishing, deployment, monitoring, distributed tracing, logging, and eventually cloud-native infrastructure.

---

## Architecture

The current architecture is:

```text
                         Developer
                             │
                             │ git push
                             ▼
                       ┌───────────┐
                       │  GitLab   │
                       │   CI/CD   │
                       └─────┬─────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
                 Tests           Docker Build
                                      │
                                      ▼
                              Container Registry
                                      │
                                      ▼
                                  Ansible
                                      │
                                      ▼
                              Docker Compose
                                      │
             ┌────────────────────────┼───────────────────────┐
             │                        │                       │
             ▼                        ▼                       ▼
         Frontend                    API                 PostgreSQL
             │                        │
             │                        │
             │                OpenTelemetry
             │                        │
             │                        ▼
             │                OTel Collector
             │                  │       │
             │                  │       └──────────► Tempo
             │                  │
             │                  └──────────────────► SarosObserv*
             │
             │
             └───────────────────────────────┐
                                             │
                                      Observability
                                             │
                         ┌───────────────────┼──────────────────┐
                         ▼                   ▼                  ▼
                    Prometheus           Grafana              Loki
                                                               ▲
                                                               │
                                                             Alloy
```

`*` SarosObserv integration is part of the broader project ecosystem and is being developed separately.

---

# What this project is

This is not intended to be a production e-commerce platform.

It is a **DevOps/SRE laboratory** built around a realistic application.

The application provides enough complexity to experiment with:

* APIs
* databases
* containers
* CI/CD
* infrastructure automation
* application metrics
* distributed tracing
* database tracing
* logs
* performance investigation
* failures
* deployment automation

The same application is used throughout the infrastructure experiments so that the engineering concepts remain connected.

---

# Technology Stack

## Application

### Backend

* Go
* Chi
* PostgreSQL
* pgx

### Frontend

* React
* TypeScript
* Vite
* Nginx

---

## Infrastructure

* Docker
* Docker Compose
* Linux
* GitLab
* GitLab Container Registry
* Ansible

---

## Observability

* OpenTelemetry
* OpenTelemetry Collector
* Prometheus
* Grafana
* Tempo
* Loki
* Grafana Alloy

---

# Application

The backend provides several API endpoints.

## Health

```http
GET /health
```

## Users

```http
GET  /api/users
POST /api/users
```

## Products

```http
GET /api/products
GET /api/products/search
GET /api/products/{id}
```

## Orders

```http
GET /api/orders
GET /api/orders/{id}
```

## Inventory

```http
GET /api/inventory
```

## Testing endpoints

```http
GET /api/slow
GET /api/error
```

The testing endpoints are intentionally designed for observability experiments.

`/api/slow` introduces artificial latency.

`/api/error` intentionally returns an HTTP 500 response.

This makes it possible to investigate:

```text
Latency
Errors
Traces
Metrics
Logs
```

---

# Frontend

The frontend is built with React and TypeScript.

Current application areas include:

```text
/
├── Products
├── Users
├── Orders
├── Inventory
├── About
├── Learn
├── Docs
│   ├── Getting Started
│   ├── Architecture
│   └── Observability
└── Labs
```

Production frontend traffic is served through Nginx.

Nginx handles:

```text
Browser
   │
   ▼
Frontend Nginx
   │
   ├── React application
   │
   └── /api/*
          │
          ▼
         API
```

---

# PostgreSQL

PostgreSQL is the primary application database.

The current schema contains:

```text
users
products
inventory
carts
cart_items
orders
order_items
payments
```

The development database contains a substantial dataset for realistic testing:

```text
users        10,000
products      5,000
inventory     5,000
orders       50,000
order_items 150,000
payments     50,000
```

This allows the project to be used for experiments involving:

* SQL queries
* API performance
* database latency
* tracing
* application/database relationships
* large result sets

---

# Docker

Docker is the foundation of the current deployment environment.

The application and supporting infrastructure run through Docker Compose.

Current services include:

```text
API
Frontend
PostgreSQL
OpenTelemetry Collector
Tempo
Prometheus
Grafana
Loki
Grafana Alloy
Jaeger
```

The Compose environment provides a reproducible local development and observability stack.

---

# CI/CD

The project uses GitLab CI/CD to automate the software delivery process.

The current pipeline is:

```text
Git Push
   │
   ▼
Tests
   │
   ▼
Go Build
   │
   ▼
Docker Build
   │
   ▼
Container Registry
   │
   ▼
Ansible Deployment
   │
   ▼
Docker Compose
```

The important principle is:

> **Build and deployment should be automated rather than performed manually.**

A normal development workflow is:

```bash
git add .
git commit -m "change"
git push
```

GitLab handles the rest.

---

# Container Registry

Built images are pushed to a private GitLab Container Registry.

The pipeline creates immutable commit-based image tags.

The default branch also maintains the project deployment tag.

This provides a clear separation between:

```text
Source Code
     ↓
CI
     ↓
Container Image
     ↓
Registry
     ↓
Deployment
```

---

# Ansible

Ansible is currently used to automate deployment.

The deployment flow is:

```text
GitLab
   │
   ▼
Container Registry
   │
   ▼
Ansible
   │
   ▼
Deployment Server
   │
   ▼
Docker Compose
```

Ansible handles tasks such as:

* creating deployment directories
* rendering Compose configuration
* copying application configuration
* copying observability configuration
* checking Docker
* pulling images
* starting services

This removes the need for manually configuring the deployment environment after every application change.

---

# OpenTelemetry

OpenTelemetry is one of the most important parts of the project.

The API uses OpenTelemetry instrumentation for HTTP requests and PostgreSQL operations.

The current tracing flow is:

```text
HTTP Request
     │
     ▼
  otelhttp
     │
     ▼
   Go API
     │
     ▼
    pgx
     │
     ▼
  otelpgx
     │
     ▼
 PostgreSQL
```

This allows an HTTP request to be connected to the database operations that occurred during that request.

For example:

```text
GET /api/products
       │
       ├── API processing
       │
       └── PostgreSQL
             │
             └── SELECT ...
```

This is especially useful for root-cause analysis.

Instead of only knowing:

> `/api/products` is slow

the trace can help answer:

> Is the application slow, or is the database query responsible?

---

# Distributed Tracing

The current tracing pipeline is:

```text
Application
     │
     ▼
OpenTelemetry
     │
     ▼
OTel Collector
     │
     ▼
Tempo
     │
     ▼
Grafana
```

The API produces HTTP spans and PostgreSQL spans.

Example database attributes include:

```text
db.system.name
server.address
server.port
user.name
db.namespace
db.query.text
db.operation.name
```

This makes database-level investigation possible directly from application traces.

---

# Metrics

The API exposes Prometheus metrics.

Current custom metrics include:

```text
devops_http_requests_total
devops_http_request_duration_seconds
devops_http_requests_in_flight
```

Examples:

### Request rate

```promql
rate(devops_http_requests_total[5m])
```

### Requests by route

```promql
sum by (route) (
  rate(devops_http_requests_total[5m])
)
```

### HTTP 5xx rate

```promql
sum(
  rate(devops_http_requests_total{status=~"5.."}[5m])
)
```

### 95th percentile latency

```promql
histogram_quantile(
  0.95,
  sum by (le) (
    rate(devops_http_request_duration_seconds_bucket[5m])
  )
)
```

---

# Prometheus

Prometheus collects application metrics.

The architecture is:

```text
Go API
  │
  │ /metrics
  ▼
Prometheus
  │
  ▼
Grafana
```

Prometheus provides the metrics foundation for performance and reliability analysis.

---

# Grafana

Grafana is used as the central visualization layer.

The project uses Grafana to investigate:

```text
Metrics
Traces
Logs
```

The goal is to correlate telemetry rather than looking at each signal independently.

For example:

```text
High latency
    ↓
Prometheus
    ↓
Find affected endpoint
    ↓
Tempo
    ↓
Inspect trace
    ↓
Find PostgreSQL span
    ↓
Inspect database query
    ↓
Loki
    ↓
Correlate application logs
```

---

# Loki + Alloy

Container logs are collected through Grafana Alloy and stored in Loki.

The current pipeline is:

```text
Docker Containers
       │
       ▼
     Alloy
       │
       ▼
      Loki
       │
       ▼
    Grafana
```

Example LogQL queries:

```logql
{container=~".*api.*"}
```

Error investigation:

```logql
{container=~".*api.*"} |= "error"
```

---

# Observability Workflow

One of the main goals of the project is learning how to investigate an incident using multiple telemetry signals.

Example:

```text
User reports:
"Products page is slow"
          │
          ▼
      Prometheus
          │
          ▼
High API latency
          │
          ▼
        Tempo
          │
          ▼
Slow PostgreSQL span
          │
          ▼
      SQL query
          │
          ▼
        Loki
          │
          ▼
Application/database logs
```

This is the core SRE mindset behind the project:

> **Don't guess the root cause. Use telemetry to find it.**

---

# Local Endpoints

When running the Docker Compose environment:

| Service    | Address                  |
| ---------- | ------------------------ |
| Frontend   | `http://localhost:8099`  |
| API        | `http://localhost:8088`  |
| Grafana    | `http://localhost:4000`  |
| Prometheus | `http://localhost:9090`  |
| Tempo      | `http://localhost:3200`  |
| Jaeger     | `http://localhost:16686` |
| Loki       | `http://localhost:3100`  |

---

# Running the Project

Start the complete stack:

```bash
docker compose up -d
```

Check services:

```bash
docker compose ps
```

Stop:

```bash
docker compose down
```

---

# API Testing

Health:

```bash
curl http://localhost:8088/health
```

Products:

```bash
curl http://localhost:8088/api/products
```

Orders:

```bash
curl http://localhost:8088/api/orders
```

Inventory:

```bash
curl http://localhost:8088/api/inventory
```

Users:

```bash
curl http://localhost:8088/api/users
```

Generate latency:

```bash
curl http://localhost:8088/api/slow
```

Generate an error:

```bash
curl http://localhost:8088/api/error
```

Generate telemetry:

```bash
curl -s http://localhost:8088/api/products > /dev/null
curl -s http://localhost:8088/api/orders > /dev/null
curl -s http://localhost:8088/api/inventory > /dev/null
curl -s http://localhost:8088/api/users > /dev/null
```

---

# Development

## Backend

```bash
go test ./...
```

Build:

```bash
go build -o devops-shop ./cmd/api
```

Run:

```bash
go run ./cmd/api
```

---

## Frontend

```bash
cd frontend
npm install
npm run lint
npm run build
```

---

# Project Structure

```text
devops-shop/
│
├── cmd/
│   └── api/
│
├── internal/
│   ├── db/
│   ├── metrics/
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── nginx.conf
│
├── ansible/
│   ├── inventory.ini
│   ├── site.yml
│   └── templates/
│
├── grafana/
│   └── provisioning/
│
├── alloy/
│   └── config.alloy
│
├── otel/
│   └── otel-collector-config.yml
│
├── prometheus/
│   └── prometheus.yml
│
├── tempo/
│   └── tempo.yml
│
├── loki/
│   └── loki.yml
│
├── init.sql
├── compose.yml
├── Dockerfile
├── .dockerignore
├── .gitlab-ci.yml
├── go.mod
├── go.sum
└── README.md
```

---

# What has been learned

The current project provides practical experience with:

```text
Linux
    ↓
Git
    ↓
Go
    ↓
React
    ↓
PostgreSQL
    ↓
Docker
    ↓
Docker Compose
    ↓
GitLab CI/CD
    ↓
Container Registry
    ↓
Ansible
    ↓
OpenTelemetry
    ↓
Prometheus
    ↓
Grafana
    ↓
Tempo
    ↓
Loki
    ↓
Alloy
```

The project therefore covers a significant part of a modern DevOps/SRE workflow without depending on a large cloud environment.

---

# Roadmap

The following technologies are **not currently part of the implemented stack**.

They are planned future experiments.

## Kubernetes

```text
[ ] Kubernetes cluster
[ ] kubeadm
[ ] containerd
[ ] Cilium
[ ] Deployments
[ ] Services
[ ] ConfigMaps
[ ] Secrets
[ ] Ingress
```

## Kubernetes Storage

```text
[ ] StatefulSets
[ ] PersistentVolumes
[ ] PersistentVolumeClaims
[ ] StorageClasses
```

## Distributed Storage

```text
[ ] Ceph
[ ] Rook-Ceph
[ ] Ceph CSI
[ ] RBD
```

## Kubernetes Observability

```text
[ ] Kubernetes metrics
[ ] Kubernetes logs
[ ] Kubernetes traces
[ ] Resource monitoring
```

## Scaling & Reliability

```text
[ ] Resource requests/limits
[ ] Liveness probes
[ ] Readiness probes
[ ] Startup probes
[ ] HPA
[ ] NetworkPolicies
```

## Infrastructure & Delivery

```text
[ ] Helm
[ ] Terraform
[ ] GitOps
[ ] Argo CD
```

These items remain intentionally deferred until the local lab has sufficient resources.

---

# SarosObserv

`devops-shop` is also part of a larger observability ecosystem.

[SarosObserv](https://github.com/saros-dev/sarosobserv) is a separate open-source project focused on building an OpenTelemetry-native observability platform.

The long-term idea is:

```text
                    Applications
                         │
                         ▼
                  OpenTelemetry
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        devops-shop              SarosObserv
```

`devops-shop` provides a realistic workload for generating:

* traces
* metrics
* logs
* database telemetry
* performance data

while SarosObserv is being developed as an independent observability platform.

---

# Learning Philosophy

The project is built around one principle:

> **Learn infrastructure by operating a real application.**

Instead of learning technologies independently, each layer is connected:

```text
Application
    ↓
Container
    ↓
CI/CD
    ↓
Registry
    ↓
Deployment Automation
    ↓
Telemetry
    ↓
Performance Investigation
```

The objective is not to collect technology names.

The objective is to understand how the pieces work together.

---

# Current Status

🟢 **Active DevOps/SRE Laboratory**

Currently implemented:

```text
✓ Go API
✓ React frontend
✓ PostgreSQL
✓ Docker
✓ Docker Compose
✓ GitLab CI/CD
✓ Container Registry
✓ Ansible
✓ OpenTelemetry
✓ PostgreSQL tracing
✓ Prometheus
✓ Grafana
✓ Tempo
✓ Loki
✓ Grafana Alloy
```

Not yet implemented:

```text
○ Kubernetes
○ Cilium
○ Ingress
○ Kubernetes storage
○ Ceph
○ HPA
○ GitOps
```

The current milestone intentionally stops at a lightweight, laptop-friendly infrastructure stack.

---

# License

MIT License

Copyright (c) 2026 Saros Shojaii

See [`LICENSE`](LICENSE) for the full license text.

