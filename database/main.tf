provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "bookshop_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "bookshop-vpc"
  }
}

resource "aws_subnet" "bookshop_db_subnet_a" {
  vpc_id            = aws_vpc.bookshop_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${data.aws_region.current.name}a"

  tags = {
    Name = "bookshop-db-subnet-a"
  }
}

resource "aws_subnet" "bookshop_db_subnet_b" {
  vpc_id            = aws_vpc.bookshop_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${data.aws_region.current.name}b"

  tags = {
    Name = "bookshop-db-subnet-b"
  }
}

resource "aws_db_subnet_group" "bookshop_db_subnet_group" {
  name       = "bookshop-db-subnet-group"
  subnet_ids = [aws_subnet.bookshop_db_subnet_a.id, aws_subnet.bookshop_db_subnet_b.id]

  tags = {
    Name = "Bookshop DB Subnet Group"
  }
}

data "aws_region" "current" {}

resource "aws_security_group" "bookshop_db_sg" {
  name        = "bookshop-db-sg"
  description = "Allow PostgreSQL traffic from within the VPC"
  vpc_id      = aws_vpc.bookshop_vpc.id

  ingress {
    description      = "PostgreSQL from VPC"
    from_port        = 5432
    to_port          = 5432
    protocol         = "tcp"
    cidr_blocks      = [aws_vpc.bookshop_vpc.cidr_block]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bookshop-db-sg"
  }
}

resource "aws_db_instance" "bookshop_db" {
  allocated_storage    = 20            
  engine               = "postgres"     
  engine_version       = "15.3"         
  instance_class       = "db.t3.micro"  
  
  db_name              = "bookshop"     
  username             = "mainadmin"    
  password             = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.bookshop_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.bookshop_db_sg.id]

  skip_final_snapshot  = true

  provisioner "local-exec" {
    command = "psql -h ${self.endpoint} -U ${self.username} -d ${self.db_name} -f ${path.module}/setup.sql"
    environment = {
      PGPASSWORD = var.db_password
    }
  }
}