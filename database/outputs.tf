output "db_instance_endpoint" {
  description = "The connection endpoint for the RDS (PostgreSQL) database"
  value       = aws_db_instance.bookshop_db.endpoint
}

output "db_instance_port" {
  description = "The port for the RDS (PostgreSQL) database"
  value       = aws_db_instance.bookshop_db.port
}

output "db_instance_name" {
  description = "The database name (SID) of the RDS instance"
  value       = aws_db_instance.bookshop_db.db_name
}

output "db_instance_username" {
  description = "The master username for the RDS instance"
  value       = aws_db_instance.bookshop_db.username
}

output "dynamodb_carts_table_name" {
  description = "The name of the DynamoDB table for Carts"
  value       = aws_dynamodb_table.carts_table.name
}

output "dynamodb_sessions_table_name" {
  description = "The name of the DynamoDB table for Sessions"
  value       = aws_dynamodb_table.sessions_table.name
}