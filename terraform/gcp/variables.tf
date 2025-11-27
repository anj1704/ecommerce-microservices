variable "gcp_project_id" {
  type = string
}

variable "gcp_region" {
  type    = string
  default = "us-central1"
}

variable "gcp_zone" {
  type    = string
  default = "us-central1-a"  
}

variable "project_name" {
  type = string
  default = "ecommerce"
}

variable "environment" {
  type = string
  default = "dev"
}
