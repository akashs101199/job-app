# Development Environment Variables

environment = "dev"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr        = "10.0.0.0/16"
public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets = ["10.0.10.0/24", "10.0.11.0/24"]

# Database Configuration
db_instance_class      = "db.t3.micro"
db_allocated_storage   = 20
db_multi_az            = false
db_backup_retention_days = 7

# ECS Configuration
backend_cpu            = 256
backend_memory         = 512
backend_desired_count  = 1

frontend_cpu           = 256
frontend_memory        = 512
frontend_desired_count = 1

# Auto Scaling
backend_min_capacity  = 1
backend_max_capacity  = 2
frontend_min_capacity = 1
frontend_max_capacity = 2

autoscaling_target_cpu    = 80
autoscaling_target_memory = 90

# Monitoring
enable_container_insights = false
log_retention_days       = 7

# Notifications
alert_email = "dev-alerts@yourdomain.com"

# CloudFront
cloudfront_domain_name = ""
