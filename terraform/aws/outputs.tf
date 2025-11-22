# VPC outputs
output "vpc_id" {
  description = "VPC ID"
  value       = local.vpc_id
}

output "subnet_ids" {
  description = "Subnet IDs"
  value       = local.subnet_ids
}

output "public_subnet_id" {
  value = local.public_subnet_id
}

output "private_subnet_id" {
  value = local.private_subnet_id
}

# Database outputs (from module)
output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.databases.rds_endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.databases.rds_database_name
}

output "s3_item_images_bucket" {
  description = "S3 bucket for item images"
  value       = module.databases.s3_item_images_bucket
}

output "s3_ingestion_bucket" {
  description = "S3 bucket for ingestion triggers"
  value       = module.databases.s3_ingestion_bucket
}

output "dynamodb_carts_table" {
  description = "DynamoDB shopping carts table"
  value       = module.databases.dynamodb_carts_table
}

output "dynamodb_sessions_table" {
  description = "DynamoDB user sessions table"
  value       = module.databases.dynamodb_sessions_table
}

output "ecr_repository_url" {
  value = aws_ecr_repository.lambda_ingestion.repository_url
}

output "lambda_function_name" {
  value = aws_lambda_function.ingestion.function_name
}

output "ingestion_bucket" {
  value = module.databases.s3_ingestion_bucket
}

output "eks_cluster_name" {
  value = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "eks_cluster_certificate" {
  value     = aws_eks_cluster.main.certificate_authority[0].data
  sensitive = true
}

output "opensearch_endpoint" {
  description = "OpenSearch domain endpoint"
  value       = aws_opensearch_domain.main.endpoint
  sensitive   = true
}

output "opensearch_dashboard_endpoint" {
  description = "OpenSearch Dashboards endpoint"
  value       = "${aws_opensearch_domain.main.endpoint}/_dashboards"
  sensitive   = true
}

output "frontend_bucket_name" {
  description = "Frontend S3 bucket name"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_website_url" {
  description = "S3 website endpoint"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}
