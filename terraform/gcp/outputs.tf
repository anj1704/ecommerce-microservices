output "gke_cluster_name" {
  value = google_container_cluster.main.name
}

output "gke_cluster_endpoint" {
  value     = google_container_cluster.main.endpoint
  sensitive = true
}

output "dataproc_cluster_name" {
  value = google_dataproc_cluster.flink.name
}
