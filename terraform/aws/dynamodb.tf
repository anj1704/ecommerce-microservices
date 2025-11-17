# Shopping Carts Table
resource "aws_dynamodb_table" "shopping_carts" {
  name         = "${var.project_name}-shopping-carts-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Name = "Shopping Carts"
  }
}

# User Sessions Table
resource "aws_dynamodb_table" "user_sessions" {
  name         = "${var.project_name}-user-sessions-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Name = "User Sessions"
  }
}
