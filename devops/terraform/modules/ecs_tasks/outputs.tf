output "backend_task_definition_arn" {
  description = "Backend task definition ARN"
  value       = aws_ecs_task_definition.backend.arn
}

output "backend_service_name" {
  description = "Backend service name"
  value       = aws_ecs_service.backend.name
}

output "backend_service_arn" {
  description = "Backend service ARN"
  value       = aws_ecs_service.backend.arn
}

output "frontend_task_definition_arn" {
  description = "Frontend task definition ARN"
  value       = aws_ecs_task_definition.frontend.arn
}

output "frontend_service_name" {
  description = "Frontend service name"
  value       = aws_ecs_service.frontend.name
}

output "frontend_service_arn" {
  description = "Frontend service ARN"
  value       = aws_ecs_service.frontend.arn
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.tasks.name
}

output "log_group_arn" {
  description = "CloudWatch log group ARN"
  value       = aws_cloudwatch_log_group.tasks.arn
}
