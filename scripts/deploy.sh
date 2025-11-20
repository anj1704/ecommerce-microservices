#!/bin/bash
set -e

echo "Getting AWS Account ID and RDS Endpoint..."
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export RDS_ENDPOINT=$(cd terraform/aws && terraform output -raw rds_endpoint)

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "RDS Endpoint: $RDS_ENDPOINT"

# Update all YAML files with actual values
# find . -type f -name "*.yaml" -exec sed -i '' "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" {} \;
# find . -type f -name "*.yaml" -exec sed -i '' "s/ecommerce-ms-postgres-dev.xxxxx.us-east-1.rds.amazonaws.com:5432/$RDS_ENDPOINT/g" {} \;

cd k8s-manifests

echo "--- Pre-loading Secrets ---"
kubectl apply -f applications/user-service/secret.yaml

echo "Initializing database..."
kubectl delete job init-database --ignore-not-found
kubectl apply -f jobs/init-db-job.yaml
echo "Waiting for DB Job to complete..."
kubectl wait --for=condition=complete --timeout=120s job/init-database

echo "Deploying services..."
kubectl apply -f applications/user-service/
kubectl apply -f applications/order-service/
kubectl apply -f applications/search-service/
kubectl apply -f applications/api-gateway/

echo "Waiting for deployments..."
kubectl wait --for=condition=available --timeout=300s deployment/user-service
kubectl wait --for=condition=available --timeout=300s deployment/order-service
kubectl wait --for=condition=available --timeout=300s deployment/search-service
kubectl wait --for=condition=available --timeout=300s deployment/api-gateway

echo "All services deployed!"
kubectl get pods
kubectl get services

cd ..

