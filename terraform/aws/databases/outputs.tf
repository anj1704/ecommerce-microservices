output "rds_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}

output "rds_database_name" {
  value = aws_db_instance.main.db_name
}

output "rds_username" {
  value = aws_db_instance.main.username
}

output "dynamodb_carts_table" {
  value = aws_dynamodb_table.shopping_carts.name
}

output "dynamodb_sessions_table" {
  value = aws_dynamodb_table.user_sessions.name
}

output "s3_item_images_bucket" {
  value = aws_s3_bucket.item_images.id
}

output "s3_ingestion_bucket" {
  value = aws_s3_bucket.ingestion_trigger.id
}
