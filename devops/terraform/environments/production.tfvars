# Production Environment Variables

environment = "production"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr        = "10.0.0.0/16"
public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnets = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]

# Database Configuration
db_instance_class        = "db.t3.small"
db_allocated_storage     = 100
db_multi_az              = true
db_backup_retention_days = 30

# ECS Configuration
backend_cpu            = 1024
backend_memory         = 2048
backend_desired_count  = 3

frontend_cpu           = 512
frontend_memory        = 1024
frontend_desired_count = 3

# Auto Scaling
backend_min_capacity  = 3
backend_max_capacity  = 10
frontend_min_capacity = 2
frontend_max_capacity = 6

autoscaling_target_cpu    = 70
autoscaling_target_memory = 75

# Monitoring
enable_container_insights = true
log_retention_days       = 90

# Notifications
alert_email = "ops-alerts@yourdomain.com"

# CloudFront
cloudfront_domain_name = "api.yourdomain.com"
