# ECR Repository for Lambda container
resource "aws_ecr_repository" "lambda_ingestion" {
  name                 = "${var.project_name}-lambda-ingestion"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  force_delete = true

  tags = {
    Name = "Lambda Ingestion Repository"
  }
}

# Lambda Function (Container-based)
resource "aws_lambda_function" "ingestion" {
  function_name = "${var.project_name}-ingestion-${var.environment}"
  role          = aws_iam_role.lambda_execution.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.lambda_ingestion.repository_url}:latest"

  timeout     = 300  # 5 minutes
  memory_size = 2048 # 2GB for ML model

  environment {
    variables = {

      RDS_HOST        = split(":", module.databases.rds_endpoint)[0]
      RDS_DATABASE    = module.databases.rds_database_name
      RDS_USER        = module.databases.rds_username
      RDS_PASSWORD    = var.db_password
      IMAGES_BUCKET   = module.databases.s3_item_images_bucket
      
      # VARIABLES FOR BERT MODEL
      HF_HOME = "/tmp"
      TRANSFORMERS_CACHE = "/tmp"
      SENTENCE_TRANSFORMERS_HOME = "/tmp"
      JOBLIB_MULTIPROCESSING     = "0" 
    }
  }

  # VPC configuration to access RDS
  vpc_config {
    # subnet_ids         = local.subnet_ids
    subnet_ids = [local.private_subnet_id]
    security_group_ids = [aws_security_group.lambda.id]
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_permissions
  ]

  tags = {
    Name = "Ingestion Lambda"
  }
}

# Security Group for Lambda
resource "aws_security_group" "lambda" {
  name_prefix = "${var.project_name}-lambda-"
  description = "Security group for Lambda functions"
  vpc_id      = local.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "${var.project_name}-lambda-sg"
  }
}

# Allow Lambda to access RDS
resource "aws_security_group_rule" "lambda_to_rds" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = module.databases.rds_security_group_id
}

# S3 trigger for Lambda
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingestion.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::${module.databases.s3_ingestion_bucket}"
}

resource "aws_s3_bucket_notification" "ingestion_trigger" {
  bucket = module.databases.s3_ingestion_bucket

  lambda_function {
    lambda_function_arn = aws_lambda_function.ingestion.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".json"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}
