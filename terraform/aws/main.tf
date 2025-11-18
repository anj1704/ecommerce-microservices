# Get default VPC
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

locals {
  vpc_id     = data.aws_vpc.default.id
  vpc_cidr   = data.aws_vpc.default.cidr_block
  subnet_ids = data.aws_subnets.default.ids
}

# Database module
module "databases" {
  source = "./databases"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = local.vpc_id
  vpc_cidr     = local.vpc_cidr
  subnet_ids   = local.subnet_ids
  db_username  = var.db_username
  db_password  = var.db_password
}
