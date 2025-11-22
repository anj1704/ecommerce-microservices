# Observability Stack Implementation

This document describes the comprehensive observability stack implemented for the e-commerce microservices platform as per requirement (g) of the assignment.

## Overview

The observability stack consists of:
1. **Prometheus** - Metrics collection and storage
2. **Grafana** - Metrics and logs visualization with pre-configured dashboards
3. **Loki** - Centralized log aggregation
4. **Promtail** - Log collection agent (DaemonSet)

## Implementation Details

### 1. Metrics Collection (Prometheus)

**Location**: `k8s-manifests/observability/prometheus/`

**Components**:
- `deployment.yaml`: Prometheus deployment with ServiceAccount
- `service.yaml`: ClusterIP service exposing Prometheus on port 9090
- `configmap.yaml`: Prometheus configuration for scraping:
  - All microservices (api-gateway, user-service, order-service, search-service)
  - Kubernetes API server
  - Kubernetes nodes
  - Kubernetes pods (with annotations)
  - cAdvisor metrics
- `rbac.yaml`: ServiceAccount and ClusterRole for Kubernetes API access

**Scraping Configuration**:
- Scrape interval: 15 seconds
- Service discovery: Kubernetes pod discovery using `app` labels
- Metrics path: `/metrics` (exposed by all services)

### 2. Metrics Visualization (Grafana)

**Location**: `k8s-manifests/observability/grafana/`

**Components**:
- `deployment.yaml`: Grafana deployment with volume mounts for dashboards
- `service.yaml`: LoadBalancer service exposing Grafana on port 3000
- `secret.yaml`: Admin credentials (admin/admin123)
- `datasources.yaml`: Auto-provisioned data sources (Prometheus and Loki)
- `dashboards-provisioning.yaml`: Dashboard provisioning configuration
- `dashboard-definitions.yaml`: Pre-configured dashboards:
  - **E-Commerce Microservices Metrics**: RPS, error rate, latency, status codes, health
  - **Kubernetes Cluster Health**: CPU, memory, network, pod counts, node metrics

**Dashboards Show**:
- Request Rate (RPS) by Service
- Error Rate by Service
- Request Latency (p95) by Service
- Active Requests by Service
- HTTP Status Codes Distribution
- Service Health Status
- CPU/Memory Usage by Pod
- Network I/O by Pod
- Node CPU/Memory Usage

### 3. Centralized Logging (Loki)

**Location**: `k8s-manifests/observability/loki/`

**Components**:
- `deployment.yaml`: Loki deployment for log storage
- `service.yaml`: ClusterIP service exposing Loki on port 3100
- `configmap.yaml`: Loki configuration with:
  - Filesystem storage backend
  - 30-day retention period
  - 16MB ingestion rate limit

### 4. Log Collection (Promtail)

**Location**: `k8s-manifests/observability/promtail/`

**Components**:
- `deployment.yaml`: DaemonSet for log collection on all nodes
- `configmap.yaml`: Promtail configuration for:
  - Kubernetes pod log collection
  - System log collection
  - Log forwarding to Loki
- `rbac.yaml`: ServiceAccount and ClusterRole for Kubernetes API access

## Service Instrumentation

All microservices have been updated to expose Prometheus metrics:

**Updated Files**:
- `services/api-gateway/main.py` - Added prometheus-fastapi-instrumentator
- `services/user-service/main.py` - Added prometheus-fastapi-instrumentator
- `services/order-service/main.py` - Added prometheus-fastapi-instrumentator
- `services/search-service/main.py` - Added prometheus-fastapi-instrumentator

**Updated Requirements**:
- All `requirements.txt` files updated with `prometheus-fastapi-instrumentator==6.1.0`

**Metrics Exposed**:
- `http_requests_total` - Total HTTP requests (labeled by app, method, status, endpoint)
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_in_flight` - Currently active requests

## Deployment

### GitOps (ArgoCD)

An ArgoCD application manifest is provided at:
- `k8s-manifests/argocd-apps/observability.yaml`

This allows the observability stack to be managed via GitOps, ensuring:
- Automated synchronization
- Self-healing
- Version control

### Manual Deployment

See `k8s-manifests/observability/README.md` for detailed deployment instructions.

## Access

### Grafana
- **URL**: `http://<LOADBALANCER_IP>:3000`
- **Username**: `admin`
- **Password**: `admin123` (change in production!)

### Prometheus
- **Port-forward**: `kubectl port-forward svc/prometheus 9090:9090`
- **URL**: `http://localhost:9090`

## Key Metrics Tracked

### Service Metrics
- **RPS (Requests Per Second)**: Rate of incoming requests per service
- **Error Rate**: Percentage of 5xx errors
- **Latency (p95)**: 95th percentile request latency
- **Active Requests**: Currently processing requests
- **Status Codes**: Distribution of HTTP status codes

### Cluster Metrics
- **CPU Usage**: By pod and node
- **Memory Usage**: By pod and node
- **Network I/O**: Bytes sent/received per pod
- **Pod Count**: Number of pods per deployment

## Logging

All logs from microservices are automatically collected and can be queried in Grafana using LogQL:

- `{app="api-gateway"}` - All API Gateway logs
- `{app="user-service"} |= "error"` - Error logs from User Service
- `{namespace="default"}` - All logs from default namespace

## Compliance with Requirements

✅ **Metrics**: Prometheus deployed and configured  
✅ **Grafana**: Deployed with dashboards showing:
   - Key service metrics (RPS, error rate, latency)
   - Kubernetes cluster health  
✅ **Logging**: Centralized logging solution (Loki + Promtail) implemented  
✅ **Log Aggregation**: All microservices logs aggregated  
✅ **Analytics Job**: Logs from analytics job will be collected (when deployed)

## Next Steps

1. **Deploy the stack**: Apply all manifests or use ArgoCD
2. **Rebuild services**: Rebuild Docker images with updated requirements.txt
3. **Verify metrics**: Check Prometheus targets at `/targets`
4. **Access Grafana**: Use LoadBalancer IP to access dashboards
5. **Test logging**: Generate some logs and verify in Grafana Explore

## Production Considerations

1. Change Grafana admin password
2. Configure persistent storage for Prometheus and Loki
3. Adjust resource limits based on cluster size
4. Configure appropriate retention periods
5. Implement proper RBAC and network policies
6. Consider high availability with multiple replicas

