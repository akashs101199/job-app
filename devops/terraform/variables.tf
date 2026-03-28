variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "job-app"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# Database Configuration
variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "job_app_db"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = false
}

variable "db_backup_retention_days" {
  description = "RDS backup retention days"
  type        = number
  default     = 7
}

# ECS Configuration
variable "backend_cpu" {
  description = "Backend task CPU (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Backend task memory in MB (512, 1024, 2048, etc)"
  type        = number
  default     = 1024
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
  default     = 2
}

variable "frontend_cpu" {
  description = "Frontend task CPU"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Frontend task memory in MB"
  type        = number
  default     = 512
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks"
  type        = number
  default     = 2
}

# Auto Scaling Configuration
variable "backend_min_capacity" {
  description = "Backend minimum task count"
  type        = number
  default     = 2
}

variable "backend_max_capacity" {
  description = "Backend maximum task count"
  type        = number
  default     = 6
}

variable "frontend_min_capacity" {
  description = "Frontend minimum task count"
  type        = number
  default     = 2
}

variable "frontend_max_capacity" {
  description = "Frontend maximum task count"
  type        = number
  default     = 4
}

variable "autoscaling_target_cpu" {
  description = "Target CPU utilization for auto scaling (%)"
  type        = number
  default     = 70
}

variable "autoscaling_target_memory" {
  description = "Target memory utilization for auto scaling (%)"
  type        = number
  default     = 80
}

# API Keys and Secrets
variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
}

variable "rapidapi_key" {
  description = "RapidAPI key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

# Monitoring Configuration
variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "alert_email" {
  description = "Email for CloudWatch alerts"
  type        = string
}

# CloudFront Configuration
variable "cloudfront_domain_name" {
  description = "Custom domain name for CloudFront (optional)"
  type        = string
  default     = ""
}

# Tags
variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
