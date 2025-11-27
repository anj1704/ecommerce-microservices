# Service account for Order Service (running in AWS EKS)
resource "google_service_account" "order_service" {
  account_id   = "order-service"
  display_name = "Order Service (AWS EKS)"
  description  = "Service account for publishing order events from AWS"
}

# Grant publish permission to order-events topic
resource "google_pubsub_topic_iam_member" "order_service_publisher" {
  topic  = google_pubsub_topic.order_events.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.order_service.email}"
}

# Service account for analytics processor (Cloud Run)
resource "google_service_account" "analytics_processor" {
  account_id   = "analytics-processor"
  display_name = "Analytics Processor"
  description  = "Service account for processing order events"
}

# Grant subscriber permission to order-events
resource "google_pubsub_subscription_iam_member" "processor_subscriber" {
  subscription = google_pubsub_subscription.order_events_processor.id
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${google_service_account.analytics_processor.email}"
}

# Grant publisher permission to analytics-results
resource "google_pubsub_topic_iam_member" "processor_publisher" {
  topic  = google_pubsub_topic.analytics_results.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.analytics_processor.email}"
}

# Create service account key for Order Service (download this)
resource "google_service_account_key" "order_service_key" {
  service_account_id = google_service_account.order_service.name
}

# Output the key (base64 encoded - you'll decode and save as JSON)
output "order_service_key_base64" {
  value     = google_service_account_key.order_service_key.private_key
  sensitive = true
  description = "Base64-encoded service account key for Order Service"
}
