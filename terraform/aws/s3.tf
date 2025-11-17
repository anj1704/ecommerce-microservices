# Bucket for item images
resource "aws_s3_bucket" "item_images" {
  bucket = "${var.project_name}-item-images-${var.environment}"

  tags = {
    Name = "Item Images"
  }
}

resource "aws_s3_bucket_versioning" "item_images" {
  bucket = aws_s3_bucket.item_images.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "item_images" {
  bucket = aws_s3_bucket.item_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket for ingestion triggers
resource "aws_s3_bucket" "ingestion_trigger" {
  bucket = "${var.project_name}-ingestion-trigger-${var.environment}"

  tags = {
    Name = "Ingestion Trigger"
  }
}

resource "aws_s3_bucket_versioning" "ingestion_trigger" {
  bucket = aws_s3_bucket.ingestion_trigger.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_notification" "ingestion_trigger" {
  bucket = aws_s3_bucket.ingestion_trigger.id

  # add Lambda trigger later
  # lambda_function {
  #   lambda_function_arn = aws_lambda_function.ingestion.arn
  #   events              = ["s3:ObjectCreated:*"]
  #   filter_suffix       = ".json"
  # }
}
