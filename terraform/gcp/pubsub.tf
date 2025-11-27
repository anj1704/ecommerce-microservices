# Topic for order events (from AWS Order Service)
resource "google_pubsub_topic" "order_events" {
  name = "order-events"
  
  labels = {
    environment = var.environment
    service     = "order-processing"
  }
  
  message_retention_duration = "86400s" # 1 day
}

# Topic for analytics results (from GCP processing)
resource "google_pubsub_topic" "analytics_results" {
  name = "analytics-results"
  
  labels = {
    environment = var.environment
    service     = "analytics"
  }
  
  message_retention_duration = "86400s"
}

# Subscription for the analytics processor (Cloud Run will use this)
resource "google_pubsub_subscription" "order_events_processor" {
  name  = "order-events-processor-sub"
  topic = google_pubsub_topic.order_events.id
  
  # Acknowledge within 60 seconds
  ack_deadline_seconds = 60
  
  # Retry failed messages
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  # Dead letter after 5 failures
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dlq.id
    max_delivery_attempts = 5
  }
}

# Subscription for local analytics consumer
resource "google_pubsub_subscription" "analytics_results_local" {
  name  = "analytics-results-local-sub"
  topic = google_pubsub_topic.analytics_results.id
  
  ack_deadline_seconds = 60
  
  # Pull subscription (for local script)
  message_retention_duration = "604800s" # 7 days
}

# Dead letter queue topic
resource "google_pubsub_topic" "dlq" {
  name = "order-events-dlq"
  
  labels = {
    environment = var.environment
    purpose     = "dead-letter-queue"
  }
}

# DLQ Subscription (for manual inspection)
resource "google_pubsub_subscription" "dlq_sub" {
  name  = "order-events-dlq-sub"
  topic = google_pubsub_topic.dlq.id
  
  message_retention_duration = "604800s" # 7 days
}
