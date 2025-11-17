variable "db_password" {
  description = "The master password for the RDS database"
  type        = string
  sensitive   = true
}