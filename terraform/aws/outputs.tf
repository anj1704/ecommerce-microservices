# VPC outputs
output "vpc_id" {
  description = "VPC ID"
  value       = local.vpc_id
}

output "subnet_ids" {
  description = "Subnet IDs"
  value       = local.subnet_ids
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
