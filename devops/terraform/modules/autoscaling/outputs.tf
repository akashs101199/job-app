output "backend_target" {
  description = "Backend autoscaling target"
  value       = aws_appautoscaling_target.backend_target.arn
}

output "frontend_target" {
  description = "Frontend autoscaling target"
  value       = aws_appautoscaling_target.frontend_target.arn
}
