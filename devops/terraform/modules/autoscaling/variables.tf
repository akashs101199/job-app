variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "backend_service_name" {
  description = "Backend service name"
  type        = string
}

variable "backend_min_capacity" {
  description = "Backend minimum capacity"
  type        = number
}

variable "backend_max_capacity" {
  description = "Backend maximum capacity"
  type        = number
}

variable "frontend_service_name" {
  description = "Frontend service name"
  type        = string
}

variable "frontend_min_capacity" {
  description = "Frontend minimum capacity"
  type        = number
}

variable "frontend_max_capacity" {
  description = "Frontend maximum capacity"
  type        = number
}

variable "autoscaling_target_cpu" {
  description = "Target CPU utilization percentage"
  type        = number
  default     = 70
}

variable "autoscaling_target_memory" {
  description = "Target memory utilization percentage"
  type        = number
  default     = 80
}
