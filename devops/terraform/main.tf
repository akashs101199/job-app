terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment for remote state (recommended for production)
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "job-app/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr          = var.vpc_cidr
  azs               = data.aws_availability_zones.available.names
  private_subnets  = var.private_subnets
  public_subnets   = var.public_subnets
}

# Security Groups
module "security_groups" {
  source = "./modules/security_groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# RDS MySQL Database
module "rds" {
  source = "./modules/rds"

  project_name           = var.project_name
  environment            = var.environment
  db_identifier          = "${var.project_name}-${var.environment}-db"
  db_name                = var.db_name
  db_username            = var.db_username
  db_password            = var.db_password
  db_instance_class      = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  multi_az               = var.db_multi_az
  backup_retention_days  = var.db_backup_retention_days
  subnet_ids             = module.vpc.private_subnet_ids
  security_group_ids     = [module.security_groups.rds_sg_id]
  skip_final_snapshot    = var.environment != "production"
}

# ECS Cluster
module "ecs_cluster" {
  source = "./modules/ecs"

  project_name        = var.project_name
  environment         = var.environment
  cluster_name        = "${var.project_name}-${var.environment}-cluster"
  container_insights  = var.enable_container_insights
}

# ECR Repositories
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment

  repositories = {
    backend  = "backend"
    frontend = "frontend"
  }

  image_tag_mutability = "IMMUTABLE"
  scan_on_push         = true
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  security_group_id = module.security_groups.alb_sg_id
}

# ECS Tasks & Services
module "ecs_tasks" {
  source = "./modules/ecs_tasks"

  project_name           = var.project_name
  environment            = var.environment
  ecs_cluster_name       = module.ecs_cluster.cluster_name
  ecs_cluster_id         = module.ecs_cluster.cluster_id

  # Backend configuration
  backend_container_name = "backend"
  backend_image         = "${module.ecr.repositories["backend"].repository_url}:latest"
  backend_cpu           = var.backend_cpu
  backend_memory        = var.backend_memory
  backend_port          = 5000
  backend_desired_count = var.backend_desired_count

  # Frontend configuration
  frontend_container_name = "frontend"
  frontend_image         = "${module.ecr.repositories["frontend"].repository_url}:latest"
  frontend_cpu           = var.frontend_cpu
  frontend_memory        = var.frontend_memory
  frontend_port          = 80
  frontend_desired_count = var.frontend_desired_count

  # ALB configuration
  alb_target_group_arn = module.alb.target_group_arn
  alb_security_group_id = module.security_groups.alb_sg_id

  # Network configuration
  private_subnet_ids    = module.vpc.private_subnet_ids
  security_group_ids    = [module.security_groups.ecs_sg_id]

  # Environment variables
  environment_variables = {
    NODE_ENV              = var.environment
    DATABASE_URL          = module.rds.connection_string
    ANTHROPIC_API_KEY     = var.anthropic_api_key
    RAPIDAPI_KEY          = var.rapidapi_key
    JWT_SECRET            = var.jwt_secret
    REACT_APP_API_URL     = "https://${module.alb.dns_name}/api"
    PORT                  = "5000"
  }

  log_group_name        = "/aws/ecs/${var.project_name}-${var.environment}"
  log_retention_days    = var.log_retention_days
}

# Auto Scaling
module "autoscaling" {
  source = "./modules/autoscaling"

  project_name        = var.project_name
  environment         = var.environment

  # Backend scaling
  backend_service_name = module.ecs_tasks.backend_service_name
  backend_min_capacity = var.backend_min_capacity
  backend_max_capacity = var.backend_max_capacity

  # Frontend scaling
  frontend_service_name = module.ecs_tasks.frontend_service_name
  frontend_min_capacity = var.frontend_min_capacity
  frontend_max_capacity = var.frontend_max_capacity

  ecs_cluster_name = module.ecs_cluster.cluster_name
  cpu_target       = var.autoscaling_target_cpu
  memory_target    = var.autoscaling_target_memory
}

# CloudWatch Monitoring
module "monitoring" {
  source = "./modules/monitoring"

  project_name        = var.project_name
  environment         = var.environment
  ecs_cluster_name    = module.ecs_cluster.cluster_name
  ecs_service_names   = [
    module.ecs_tasks.backend_service_name,
    module.ecs_tasks.frontend_service_name
  ]
  rds_instance_id     = module.rds.instance_id
  alb_arn_suffix      = module.alb.arn_suffix
  sns_topic_arn       = module.notifications.sns_topic_arn
}

# SNS Notifications
module "notifications" {
  source = "./modules/notifications"

  project_name = var.project_name
  environment  = var.environment
  email        = var.alert_email
}

# S3 for file uploads
module "s3" {
  source = "./modules/s3"

  project_name      = var.project_name
  environment       = var.environment
  bucket_name       = "${var.project_name}-uploads-${data.aws_caller_identity.current.account_id}"
  versioning_enabled = var.environment == "production"
  enable_encryption = true
  block_public     = true
}

# CloudFront CDN
module "cloudfront" {
  source = "./modules/cloudfront"

  project_name    = var.project_name
  environment     = var.environment
  alb_domain_name = module.alb.dns_name
  domain_name     = var.cloudfront_domain_name
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
