resource "aws_dynamodb_table" "carts_table" {
  name         = "bookshop-carts"
  billing_mode = "PAY_PER_REQUEST" 
  hash_key     = "user_id"         

  attribute {
    name = "user_id"
    type = "S"
  }

  tags = {
    Name = "bookshop-carts-table"
  }
}

resource "aws_dynamodb_table" "sessions_table" {
  name         = "bookshop-sessions"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "user_id"    
  range_key = "login_at"   

  attribute {
    name = "user_id"
    type = "S" # String
  }
  attribute {
    name = "login_at"
    type = "S"
  }

  tags = {
    Name = "bookshop-sessions-table"
  }
}