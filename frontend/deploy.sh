#!/bin/bash
set -e

echo "Deploying Frontend to S3..."

# Get Terraform outputs
cd ../terraform/aws
export S3_BUCKET=$(terraform output -raw frontend_bucket_name)
export API_GW=$(kubectl get svc api-gateway -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

cd ../../frontend

# Update API URL in build
# echo "Updating API URL to: http://${API_GW}:8080"
# sed -i "s|baseURL: 'http://.*:8080'|baseURL: 'http://${API_GW}:8080'|g" src/api.js

# Build
echo "Building frontend..."
npm run build

# Upload to S3
echo "Uploading to S3: $S3_BUCKET"
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

echo "Deployment complete!"
echo "Frontend URL: http://${S3_BUCKET}.s3-website-us-east-1.amazonaws.com"
