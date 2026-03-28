terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-${var.environment}-alerts"
      Environment = var.environment
    }
  )
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# Email Subscription (requires confirmation)
resource "aws_sns_topic_subscription" "alert_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Lambda for custom processing of alerts (optional)
resource "aws_sns_topic" "events" {
  name = "${var.project_name}-${var.environment}-events"

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-${var.environment}-events"
      Environment = var.environment
    }
  )
}
