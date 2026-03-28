variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "cluster_id" {
  description = "ECS cluster ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "ecs_tasks_security_group_id" {
  description = "ECS tasks security group ID"
  type        = string
}

variable "backend_image_url" {
  description = "Backend Docker image URL"
  type        = string
}

variable "backend_cpu" {
  description = "Backend task CPU"
  type        = number
}

variable "backend_memory" {
  description = "Backend task memory"
  type        = number
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
}

variable "backend_target_group_arn" {
  description = "Backend target group ARN"
  type        = string
}

variable "backend_environment_variables" {
  description = "Backend environment variables"
  type        = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "frontend_image_url" {
  description = "Frontend Docker image URL"
  type        = string
}

variable "frontend_cpu" {
  description = "Frontend task CPU"
  type        = number
}

variable "frontend_memory" {
  description = "Frontend task memory"
  type        = number
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks"
  type        = number
}

variable "frontend_target_group_arn" {
  description = "Frontend target group ARN"
  type        = string
}

variable "frontend_environment_variables" {
  description = "Frontend environment variables"
  type        = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
