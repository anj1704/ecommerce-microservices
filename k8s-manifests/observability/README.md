# Observability Stack

This directory contains the complete observability stack for the e-commerce microservices platform, including Prometheus for metrics collection, Grafana for visualization, and Loki with Promtail for centralized logging.

## Components

### 1. Prometheus
- **Purpose**: Metrics collection and storage
- **Port**: 9090
- **Access**: ClusterIP service (access via port-forward or Grafana)
- **Configuration**: Scrapes metrics from all microservices and Kubernetes components

### 2. Grafana
- **Purpose**: Metrics and logs visualization
- **Port**: 3000
- **Access**: LoadBalancer service (publicly accessible)
- **Default Credentials**: 
  - Username: `admin`
  - Password: `admin123` (change in production!)
- **Dashboards**:
  - E-Commerce Microservices Metrics: RPS, error rate, latency, status codes
  - Kubernetes Cluster Health: CPU, memory, network, pod counts

### 3. Loki
- **Purpose**: Centralized log aggregation
- **Port**: 3100
- **Access**: ClusterIP service (accessed via Grafana)

### 4. Promtail
- **Purpose**: Log collection agent (DaemonSet)
- **Configuration**: Collects logs from all pods and forwards to Loki

## Deployment

### Manual Deployment

Deploy all components in order:

```bash
# 1. Deploy Prometheus
kubectl apply -f observability/prometheus/rbac.yaml
kubectl apply -f observability/prometheus/configmap.yaml
kubectl apply -f observability/prometheus/deployment.yaml
kubectl apply -f observability/prometheus/service.yaml

# 2. Deploy Loki
kubectl apply -f observability/loki/configmap.yaml
kubectl apply -f observability/loki/deployment.yaml
kubectl apply -f observability/loki/service.yaml

# 3. Deploy Promtail
kubectl apply -f observability/promtail/rbac.yaml
kubectl apply -f observability/promtail/configmap.yaml
kubectl apply -f observability/promtail/deployment.yaml

# 4. Deploy Grafana
kubectl apply -f observability/grafana/secret.yaml
kubectl apply -f observability/grafana/datasources.yaml
kubectl apply -f observability/grafana/dashboards-provisioning.yaml
kubectl apply -f observability/grafana/dashboard-definitions.yaml
kubectl apply -f observability/grafana/deployment.yaml
kubectl apply -f observability/grafana/service.yaml
```

### GitOps Deployment (ArgoCD)

The observability stack is configured for GitOps deployment via ArgoCD. Apply the ArgoCD application:

```bash
kubectl apply -f argocd-apps/observability.yaml
```

## Accessing the Dashboards

### Grafana

1. Get the LoadBalancer URL:
```bash
kubectl get svc grafana -n default
```

2. Access Grafana at `http://<LOADBALANCER_IP>:3000`
3. Login with credentials: `admin` / `admin123`

### Prometheus (via Port-Forward)

```bash
kubectl port-forward svc/prometheus 9090:9090
```

Then access at `http://localhost:9090`

## Service Metrics

All microservices expose Prometheus metrics at `/metrics` endpoint. The services are instrumented using `prometheus-fastapi-instrumentator` which automatically exposes:

- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: Request latency (histogram)
- `http_requests_in_flight`: Currently active requests

Metrics are labeled with:
- `app`: Service name (api-gateway, user-service, order-service, search-service)
- `method`: HTTP method
- `status`: HTTP status code
- `endpoint`: API endpoint path

## Logging

All service logs are automatically collected by Promtail and forwarded to Loki. In Grafana:

1. Go to Explore
2. Select "Loki" as data source
3. Use LogQL queries like:
   - `{app="api-gateway"}` - All API Gateway logs
   - `{app="user-service"} |= "error"` - Error logs from User Service
   - `{namespace="default"}` - All logs from default namespace

## Dashboards

### E-Commerce Microservices Metrics Dashboard

Shows:
- Request Rate (RPS) by service
- Error Rate by service
- Request Latency (p95) by service
- Active Requests by service
- HTTP Status Codes Distribution
- Service Health Status

### Kubernetes Cluster Health Dashboard

Shows:
- CPU Usage by Pod
- Memory Usage by Pod
- Pod Count by Deployment
- Network I/O by Pod
- Node CPU Usage
- Node Memory Usage

## Troubleshooting

### Prometheus not scraping metrics

1. Check Prometheus targets: `http://localhost:9090/targets` (via port-forward)
2. Verify service pods have metrics endpoint: `curl http://<pod-ip>:<port>/metrics`
3. Check Prometheus logs: `kubectl logs -f deployment/prometheus`

### Grafana not showing data

1. Verify Prometheus data source is configured correctly
2. Check Grafana logs: `kubectl logs -f deployment/grafana`
3. Verify Prometheus is running: `kubectl get pods -l app=prometheus`

### Logs not appearing in Loki

1. Check Promtail is running: `kubectl get daemonset promtail`
2. Check Promtail logs: `kubectl logs -f daemonset/promtail`
3. Verify Loki is running: `kubectl get pods -l app=loki`
4. Check Loki logs: `kubectl logs -f deployment/loki`

## Production Considerations

1. **Change Grafana admin password**: Update `grafana/secret.yaml` with a strong password
2. **Persistent Storage**: Configure persistent volumes for Prometheus and Loki data
3. **Resource Limits**: Adjust resource requests/limits based on cluster size
4. **Retention**: Configure appropriate retention periods in Prometheus and Loki
5. **Security**: Use proper RBAC and network policies
6. **High Availability**: Consider running Prometheus and Grafana with multiple replicas

