output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.alb.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = module.alb.zone_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs_cluster.cluster_name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = module.ecs_cluster.cluster_arn
}

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.endpoint
  sensitive   = false
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = module.rds.instance_id
}

output "rds_port" {
  description = "RDS database port"
  value       = module.rds.port
}

output "backend_ecr_repository_url" {
  description = "Backend ECR repository URL"
  value       = module.ecr.repositories["backend"].repository_url
}

output "frontend_ecr_repository_url" {
  description = "Frontend ECR repository URL"
  value       = module.ecr.repositories["frontend"].repository_url
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "s3_bucket_name" {
  description = "S3 bucket for file uploads"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3.bucket_arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = module.ecs_tasks.log_group_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = module.notifications.sns_topic_arn
}

output "deployment_summary" {
  description = "Deployment summary"
  value = {
    environment         = var.environment
    region              = var.aws_region
    alb_endpoint        = module.alb.dns_name
    ecs_cluster         = module.ecs_cluster.cluster_name
    database_endpoint   = module.rds.endpoint
    backend_service     = module.ecs_tasks.backend_service_name
    frontend_service    = module.ecs_tasks.frontend_service_name
  }
}
