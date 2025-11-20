#!/bin/bash

set -e

# Login to ECR
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Create ECR repositories
for service in user-service order-service search-service api-gateway; do
  aws ecr create-repository --repository-name ecommerce-ms-${service} --region us-east-1 || true
done

# Build and push each service
cd services

for service in user-service order-service search-service api-gateway; do
  echo "Building ${service}..."
  cd ${service}
  docker build -t ${service}:latest .
  docker tag ${service}:latest ${ECR_REGISTRY}/ecommerce-ms-${service}
  docker push ${ECR_REGISTRY}/ecommerce-ms-${service}
  cd ..
done

cd ..
