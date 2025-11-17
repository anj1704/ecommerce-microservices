output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "s3_item_images_bucket" {
  description = "S3 bucket for item images"
  value       = aws_s3_bucket.item_images.id
}

output "s3_ingestion_bucket" {
  description = "S3 bucket for ingestion triggers"
  value       = aws_s3_bucket.ingestion_trigger.id
}

output "dynamodb_carts_table" {
  description = "DynamoDB shopping carts table"
  value       = aws_dynamodb_table.shopping_carts.name
}

output "dynamodb_sessions_table" {
  description = "DynamoDB user sessions table"
  value       = aws_dynamodb_table.user_sessions.name
}

output "vpc_id" {
  description = "VPC ID"
  value       = local.vpc_id
}

output "subnet_ids" {
  description = "Subnet IDs"
  value       = local.subnet_ids
}
