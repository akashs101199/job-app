# Staging Environment Variables

environment = "staging"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr        = "10.0.0.0/16"
public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets = ["10.0.10.0/24", "10.0.11.0/24"]

# Database Configuration
db_instance_class        = "db.t3.small"
db_allocated_storage     = 50
db_multi_az              = false
db_backup_retention_days = 14

# ECS Configuration
backend_cpu            = 512
backend_memory         = 1024
backend_desired_count  = 2

frontend_cpu           = 256
frontend_memory        = 512
frontend_desired_count = 2

# Auto Scaling
backend_min_capacity  = 2
backend_max_capacity  = 5
frontend_min_capacity = 1
frontend_max_capacity = 3

autoscaling_target_cpu    = 75
autoscaling_target_memory = 80

# Monitoring
enable_container_insights = true
log_retention_days       = 30

# Notifications
alert_email = "staging-alerts@yourdomain.com"

# CloudFront
cloudfront_domain_name = "staging-api.yourdomain.com"
