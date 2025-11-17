# Setup Guide

## Prerequisites

- AWS Account
- Terraform installed
- Docker installed
- Python 3.11+

## Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/ecommerce-microservices.git
cd ecommerce-microservices
```

## Step 2: Configure AWS Credentials

```bash
aws configure
```

## Step 3: Deploy Infrastructure

```bash
cd terraform/aws
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your settings

terraform init
terraform plan
terraform apply
```

## Step 4: Get Connection Details

```bash
terraform output rds_endpoint
terraform output s3_item_images_bucket
```

## Step 5: Run Services Locally

```bash
docker-compose up
```

## Next Steps

See [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow.
