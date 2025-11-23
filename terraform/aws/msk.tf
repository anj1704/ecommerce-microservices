# MSK Cluster Configuration
resource "aws_msk_configuration" "main" {
  name              = "${var.project_name}-msk-config"
  kafka_versions    = ["3.5.1"]
  server_properties = <<PROPERTIES
auto.create.topics.enable=true
delete.topic.enable=true
default.replication.factor=2
min.insync.replicas=1
num.partitions=3
log.retention.hours=168
allow.everyone.if.no.acl.found=false
PROPERTIES
}

# Security group for MSK
resource "aws_security_group" "msk" {
  name_prefix = "${var.project_name}-msk-"
  description = "Security group for MSK cluster"
  vpc_id      = local.vpc_id

  # EKS ACCESS (Internal)
  ingress {
    from_port       = 9096
    to_port         = 9096
    protocol        = "tcp"
    security_groups = [aws_eks_cluster.main.vpc_config[0].cluster_security_group_id]
    description     = "Kafka SASL (Internal) from EKS"
  }

  # GCP ACCESS (Public)
  ingress {
    from_port   = 9196
    to_port     = 9196
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Kafka SASL (Public) from internet/GCP"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-msk-sg"
  }
}

# MSK Cluster
resource "aws_msk_cluster" "main" {
  cluster_name           = "${var.project_name}-kafka-${var.environment}"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 2  # Minimum for production

  broker_node_group_info {
    instance_type   = "kafka.t3.small"  
    client_subnets  = [local.public_subnet_id, local.msk_subnet_id]
    security_groups = [aws_security_group.msk.id]

    storage_info {
      ebs_storage_info {
        volume_size = 100
      }
    }

    # Uncomment only after creating the MSK cluster
    # Public access for cross-cloud
    connectivity_info {
      public_access {
        type = "SERVICE_PROVIDED_EIPS"
      }
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.main.arn
    revision = aws_msk_configuration.main.latest_revision
  }

  client_authentication {
    sasl {
      scram = true
      iam = true
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.msk.name
      }
    }
  }

  tags = {
    Name = "${var.project_name}-msk-cluster"
  }
}

# CloudWatch Log Group for MSK
resource "aws_cloudwatch_log_group" "msk" {
  name              = "/aws/msk/${var.project_name}-kafka-${var.environment}"
  retention_in_days = 7

  tags = {
    Name = "MSK Logs"
  }
}

# Secrets Manager for Kafka credentials
resource "aws_secretsmanager_secret" "kafka_credentials" {
  name = "AmazonMSK_${var.project_name}/kafka/credentials-${var.environment}"

  kms_key_id = aws_kms_key.msk_secret_key.id

  recovery_window_in_days = 0

  tags = {
    Name = "Kafka SASL Credentials"
  }
}

resource "aws_kms_key" "msk_secret_key" {
  description             = "Customer Managed Key for MSK Secrets"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "${var.project_name}-msk-key"
  }
}

resource "aws_secretsmanager_secret_version" "kafka_credentials" {
  secret_id = aws_secretsmanager_secret.kafka_credentials.id
  secret_string = jsonencode({
    username = "kafka-admin"
    password = "KafkaPassword123!"  
  })
}

# Associate secret with MSK
resource "aws_msk_scram_secret_association" "main" {
  cluster_arn     = aws_msk_cluster.main.arn
  secret_arn_list = [aws_secretsmanager_secret.kafka_credentials.arn]

  depends_on = [aws_secretsmanager_secret_version.kafka_credentials]
}
