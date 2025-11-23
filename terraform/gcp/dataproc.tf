# Dataproc Cluster for Flink
resource "google_dataproc_cluster" "flink" {
  name   = "${var.project_name}-flink-${var.environment}"
  region = var.gcp_region

  cluster_config {
    staging_bucket = google_storage_bucket.dataproc_staging.name

    gce_cluster_config {
      zone = var.gcp_zone  
    }

    master_config {
      num_instances = 1
      machine_type  = "n1-standard-2"
      disk_config {
        boot_disk_size_gb = 30
      }
    }

    worker_config {
      num_instances = 2
      machine_type  = "n1-standard-2"
      disk_config {
        boot_disk_size_gb = 30
      }
    }

    software_config {
      image_version = "2.1-debian11"
      optional_components = ["FLINK"]
    }
  }
}

# Staging bucket for Dataproc
resource "google_storage_bucket" "dataproc_staging" {
  name          = "${var.project_name}-dataproc-staging-${var.environment}"
  location      = var.gcp_region
  force_destroy = true
}
