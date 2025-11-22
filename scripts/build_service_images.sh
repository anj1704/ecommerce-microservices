#!/bin/bash

set -e

# Login to ECR
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Create ECR repositories
# for service in user-service order-service search-service api-gateway; do
#   aws ecr create-repository --repository-name ecommerce-ms-${service} --region us-east-1 || true
# done

# Build and push each service
cd services

# Note that we tag the images with the default latest tag
# Verify that version numbers in k8s config and docker images match
for service in user-service order-service search-service api-gateway; do
  echo "Building ${service}..."
  cd ${service}
  docker build -t ${service}:v1.0.2 .
  docker tag ${service}:v1.0.2 ${ECR_REGISTRY}/ecommerce-ms-${service}:v1.0.2
  docker push ${ECR_REGISTRY}/ecommerce-ms-${service}:v1.0.2
  cd ..
done

cd ..
