cd lambda/ingestion

export ECR_REPO=$(terraform output -raw ecr_repository_url)
export INGESTION_BUCKET=$(terraform output -raw ingestion_bucket)
echo "ECR Repo: $ECR_REPO"
echo "Ingestion Bucket: $INGESTION_BUCKET"

# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REPO

# Build image
docker build -t lambda-ingestion:latest .

# Tag for ECR
docker tag lambda-ingestion:latest $ECR_REPO

# Push to ECR
docker push $ECR_REPO

cd ../..
