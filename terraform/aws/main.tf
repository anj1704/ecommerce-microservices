# Get default VPC
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  # us-east-1e is unable to host EKS control plane
  filter {
    name   = "availability-zone"
    values = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1f"]
  }
}

# locals {
#   vpc_id     = data.aws_vpc.default.id
#   vpc_cidr   = data.aws_vpc.default.cidr_block
#   subnet_ids = data.aws_subnets.default.ids
# }

locals {
  vpc_cidr   = data.aws_vpc.default.cidr_block
  subnet_ids = data.aws_subnets.default.ids
  vpc_id   = data.aws_vpc.default.id
  public_subnet_id  = tolist(data.aws_subnets.default.ids)[0] 
  private_subnet_id = tolist(data.aws_subnets.default.ids)[1]
}

# Elastic IP for the NAT Gateway (Static Public IP)
resource "aws_eip" "nat" {
  domain = "vpc"
  tags = {
    Name = "${var.project_name}-nat-eip"
  }
}

# NAT Gateway (In the PUBLIC subnet)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = local.public_subnet_id

  tags = {
    Name = "${var.project_name}-nat-gateway"
  }
}

# Private Route Table 
resource "aws_route_table" "private" {
  vpc_id = local.vpc_id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-private-rt"
  }
}

# Associate the Second Subnet with the Private Route Table - converts it from "Public" to "Private"
resource "aws_route_table_association" "private_subnet" {
  subnet_id      = local.private_subnet_id
  route_table_id = aws_route_table.private.id
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
