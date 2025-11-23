# GKE Cluster
resource "google_container_cluster" "main" {
  name     = "${var.project_name}-gke-${var.environment}"
  location = var.gcp_zone

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = "default"
  subnetwork = "default"
}

# Node Pool
resource "google_container_node_pool" "main" {
  name       = "${var.project_name}-node-pool"
  location   = var.gcp_zone
  cluster    = google_container_cluster.main.name
  node_count = 2

  node_config {
    machine_type = "e2-small"
    disk_size_gb = 30

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}
