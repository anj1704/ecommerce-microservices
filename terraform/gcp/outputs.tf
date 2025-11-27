output "pubsub_order_topic" {
  value       = google_pubsub_topic.order_events.id
  description = "Pub/Sub topic for order events"
}

output "pubsub_analytics_topic" {
  value       = google_pubsub_topic.analytics_results.id
  description = "Pub/Sub topic for analytics results"
}

output "order_service_email" {
  value       = google_service_account.order_service.email
  description = "Service account email for Order Service"
}

output "analytics_processor_email" {
  value       = google_service_account.analytics_processor.email
  description = "Service account email for Analytics Processor"
}

output "analytics_subscription_id" {
  value       = google_pubsub_subscription.analytics_results_local.id
  description = "Subscription ID for local analytics consumer"
}
