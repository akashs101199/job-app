output "endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}
