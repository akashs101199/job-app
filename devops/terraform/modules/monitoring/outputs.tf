output "dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "insights_log_group" {
  description = "Log group for CloudWatch Insights"
  value       = aws_cloudwatch_log_group.insights.name
}
