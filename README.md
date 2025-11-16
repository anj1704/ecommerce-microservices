# E-Commerce Microservices Platform

Intelligent e-commerce platform with semantic search, real-time analytics, and multi-cloud architecture.

## Architecture

- **Primary Cloud**: AWS (EKS, RDS, DynamoDB, MSK, Lambda, OpenSearch)
- **Secondary Cloud**: GCP (GKE, Dataproc for Flink analytics)
- **Languages**: Python 3.11+
- **Orchestration**: Kubernetes with GitOps (ArgoCD)

## Services

1. **API Gateway** - Request routing and authentication
2. **User Service** - User management and authentication
3. **Order Service** - Cart and order management
4. **Search Service** - Semantic search with BERT embeddings
5. **Ingestion Service** (Lambda) - Item data processing
6. **Analytics Service** (Flink) - Real-time stream processing

## Prerequisites

- AWS Account with Admin access
- GCP Account with Admin access
- Terraform >= 1.5.0
- kubectl >= 1.28
- Docker Desktop
- Python 3.11+
- Node.js 18+ (for frontend)

## Quick Start

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## Project Structure

```
├── services/           # Microservices code
├── lambda/            # AWS Lambda functions
├── flink-job/         # Flink analytics job
├── terraform/         # Infrastructure as Code
├── k8s-manifests/     # Kubernetes manifests
├── frontend/          # Web UI
├── scripts/           # Utility scripts
└── docs/              # Documentation
```

## License

MIT
