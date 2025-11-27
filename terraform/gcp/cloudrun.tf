# Cloud Run service for analytics processor
resource "google_cloud_run_service" "analytics_processor" {
  name     = "analytics-processor"
  location = var.gcp_region
  
  template {
    spec {
      service_account_name = google_service_account.analytics_processor.email
      
      containers {
        image = "gcr.io/${var.gcp_project_id}/analytics-processor:latest"
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.gcp_project_id
        }
        
        env {
          name  = "INPUT_SUBSCRIPTION"
          value = google_pubsub_subscription.order_events_processor.name
        }
        
        env {
          name  = "OUTPUT_TOPIC"
          value = google_pubsub_topic.analytics_results.name
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "autoscaling.knative.dev/minScale" = "1"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow Pub/Sub to invoke Cloud Run
resource "google_cloud_run_service_iam_member" "pubsub_invoker" {
  service  = google_cloud_run_service.analytics_processor.name
  location = google_cloud_run_service.analytics_processor.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.analytics_processor.email}"
}

# Create Pub/Sub push subscription to Cloud Run
resource "google_pubsub_subscription" "order_events_push" {
  name  = "order-events-cloudrun-push"
  topic = google_pubsub_topic.order_events.id
  
  push_config {
    push_endpoint = google_cloud_run_service.analytics_processor.status[0].url
    
    oidc_token {
      service_account_email = google_service_account.analytics_processor.email
    }
  }
  
  ack_deadline_seconds = 60
  
  retry_policy {
    minimum_backoff = "10s"
  }
}
