# DevOps Infrastructure for Job App

This directory contains all infrastructure-as-code and deployment automation for the Job App on AWS.

## Overview

The Job App uses a containerized microservices architecture deployed on AWS with the following components:

- **Frontend**: React application served via Nginx, running on ECS Fargate
- **Backend**: Node.js/Express API running on ECS Fargate
- **Database**: AWS RDS MySQL
- **Load Balancing**: AWS Application Load Balancer (ALB)
- **Container Registry**: AWS Elastic Container Registry (ECR)
- **Storage**: AWS S3 for file uploads
- **CDN**: AWS CloudFront for global distribution
- **Monitoring**: AWS CloudWatch for logs and metrics
- **Notifications**: AWS SNS for alerts

## Directory Structure

```
devops/
├── scripts/
│   ├── deploy.sh           # Main deployment automation script
│   ├── rollback.sh         # Rollback to previous deployment
│   ├── health-check.sh     # System health verification
│   └── logs.sh             # View CloudWatch logs
├── terraform/
│   ├── main.tf             # Root Terraform configuration
│   ├── variables.tf        # Variable definitions
│   ├── outputs.tf          # Output values
│   ├── environments/       # Environment-specific configurations
│   │   ├── dev.tfvars      # Development variables
│   │   ├── staging.tfvars  # Staging variables (template)
│   │   └── production.tfvars  # Production variables
│   └── modules/            # Reusable Terraform modules
│       ├── vpc/
│       ├── security_groups/
│       ├── rds/
│       ├── ecs_cluster/
│       ├── ecs_tasks/
│       ├── ecr/
│       ├── alb/
│       ├── autoscaling/
│       ├── monitoring/
│       ├── notifications/
│       ├── s3/
│       └── cloudfront/
├── docker-compose.yml      # Local development environment
├── .env.example            # Environment variables template
├── nginx.conf              # Global Nginx configuration
├── default.conf            # Nginx server configuration
├── Dockerfile files        # In project root (Api/, client/)
└── README.md               # This file
```

## Prerequisites

### Local Development

- Docker and Docker Compose
- Node.js 18+
- npm or yarn

### Deployment (AWS)

- AWS CLI v2
- Terraform >= 1.0
- Docker (for building images)
- AWS Account with appropriate permissions
- Environment variables configured (see `.env.example`)

### IAM Permissions Required

The AWS user/role executing deployments needs:

- EC2, ECS, ECR, RDS, ALB, AutoScaling, IAM, CloudWatch, SNS, S3, CloudFront permissions
- Terraform state management (S3 and DynamoDB for locking)

## Local Development

### Setup

```bash
# Copy environment template
cp devops/.env.example .env

# Edit environment variables
nano .env

# Start services with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate

# View logs
docker-compose logs -f
```

### Services

- **Frontend**: http://localhost:3000 (via Nginx reverse proxy)
- **Backend**: http://localhost:5000
- **Database**: localhost:3306 (MySQL)
- **PhpMyAdmin**: http://localhost:8081 (debug profile)

### Cleanup

```bash
# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Remove all (including images)
docker-compose down -v --rmi all
```

## Deployment Process

### Prerequisites

1. Configure AWS credentials

```bash
aws configure
export AWS_REGION=us-east-1  # or your preferred region
```

2. Set environment variables

```bash
cp devops/.env.example .env.production
# Edit .env.production with your configuration
export $(cat .env.production | grep -v '^#' | xargs)
```

3. Ensure Terraform variables are configured

```bash
# Edit environment-specific variables
nano devops/terraform/environments/production.tfvars
```

### Deployment Steps

#### 1. Development Environment

```bash
./devops/scripts/deploy.sh dev
```

#### 2. Staging Environment

```bash
./devops/scripts/deploy.sh staging
```

#### 3. Production Environment

```bash
# Review plan first
terraform -chdir=devops/terraform plan \
  -var-file=environments/production.tfvars

# Then deploy
./devops/scripts/deploy.sh production
```

### The Deployment Script

The `deploy.sh` script performs:

1. **Prerequisites Check**: Verifies AWS CLI, Terraform, Docker, and jq are installed
2. **Environment Validation**: Checks tfvars and .env files exist
3. **Docker Build**: Builds backend and frontend images
4. **Docker Push**: Pushes images to ECR
5. **Terraform Init**: Initializes Terraform
6. **Terraform Plan**: Reviews infrastructure changes
7. **Terraform Apply**: Creates/updates infrastructure
8. **Database Migrations**: Runs Prisma migrations
9. **ECS Service Updates**: Forces new deployment with new images

## Monitoring and Maintenance

### Health Checks

```bash
./devops/scripts/health-check.sh production
```

Checks:
- ECS cluster status
- ECS service task counts
- RDS database status
- HTTP endpoint availability

### Viewing Logs

```bash
# View backend logs
./devops/scripts/logs.sh production backend 100

# View all logs
./devops/scripts/logs.sh production all 200

# Stream logs in real-time (requires AWS CLI with tail support)
aws logs tail /ecs/job-app-production --follow --log-stream-name-prefix backend
```

### CloudWatch Dashboard

```bash
./devops/scripts/logs.sh --help
# Dashboard URL displayed in Terraform outputs
```

### Metrics to Monitor

- **ECS**: CPU/Memory utilization, task count
- **ALB**: Response time, request count, healthy/unhealthy hosts
- **RDS**: CPU, connections, read/write latency
- **CloudFront**: Cache hit rate, requests, bandwidth

## Rollback Procedure

If deployment issues occur:

```bash
./devops/scripts/rollback.sh production
```

This rolls back to the previous task definition revision for both backend and frontend services.

### Manual Rollback

```bash
# Get previous task definition
aws ecs describe-task-definition \
  --task-definition job-app-production-backend:N-1 \
  --region us-east-1

# Update service
aws ecs update-service \
  --cluster job-app-production-cluster \
  --service job-app-production-backend \
  --task-definition job-app-production-backend:N-1 \
  --force-new-deployment \
  --region us-east-1
```

## Infrastructure Management

### Terraform State

Remote state is stored in S3 (configure in terraform backend):

```bash
cd devops/terraform

# Initialize
terraform init

# Plan changes
terraform plan -var-file=environments/production.tfvars

# Apply changes
terraform apply -var-file=environments/production.tfvars

# Destroy (CAUTION - production data loss!)
terraform destroy -var-file=environments/production.tfvars
```

### Adding/Removing Resources

Edit the appropriate module in `terraform/modules/` and run:

```bash
terraform plan -var-file=environments/production.tfvars
terraform apply -var-file=environments/production.tfvars
```

### Environment Variables

All sensitive values should be in `.env` files:

```bash
# Example .env.production
ENVIRONMENT=production
AWS_REGION=us-east-1
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret
ANTHROPIC_API_KEY=your-api-key
```

## Cost Optimization

### Development Environment
- t3.micro RDS instance
- Single t2.small ECS tasks
- Minimal auto-scaling (1-2 instances)
- 7-day log retention
- Disabled Container Insights

### Production Environment
- t3.small RDS instance with Multi-AZ
- Larger CPU/memory allocation
- Auto-scaling (3-10 instances)
- 90-day log retention
- Enabled Container Insights

### Cost Reduction Tips

1. Use dev environment for testing, not production
2. Enable auto-scaling to reduce idle capacity
3. Archive old logs to Glacier
4. Use reserved instances for baseline capacity
5. Monitor with CloudWatch cost explorer

## Security Best Practices

### Network Security

- Private subnets for databases and backends
- Public subnets only for ALB
- Security groups restrict traffic by service
- NACLs for additional network hardening

### Application Security

- Non-root user in containers
- Secrets managed via environment variables
- Regular security scanning of ECR images
- HTTPS/TLS enforced via CloudFront

### Data Security

- RDS encryption at rest
- Regular automated backups (7-30 days)
- Database access only from ECS tasks
- S3 bucket versioning and lifecycle policies

### Compliance

- CloudWatch logs for audit trail
- SNS notifications for critical events
- IAM roles with least privilege
- Resource tagging for cost allocation

## Troubleshooting

### Deployment Issues

```bash
# Check ECS task logs
./devops/scripts/logs.sh production backend 200

# Check ECS task status
aws ecs describe-tasks \
  --cluster job-app-production-cluster \
  --tasks [task-arn] \
  --region us-east-1

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn [target-group-arn] \
  --region us-east-1
```

### Database Connectivity

```bash
# Check RDS instance
aws rds describe-db-instances \
  --db-instance-identifier job-app-production-db \
  --region us-east-1

# Verify security group allows ECS -> RDS
aws ec2 describe-security-groups \
  --region us-east-1
```

### Docker Issues

```bash
# Check ECR repositories
aws ecr describe-repositories --region us-east-1

# Check image vulnerabilities
aws ecr describe-image-scan-findings \
  --repository-name job-app-backend \
  --image-id imageTag=latest \
  --region us-east-1
```

## CI/CD Integration

See `.github/workflows/` for GitHub Actions pipeline configuration:

- Automated tests on pull requests
- Docker build and push on merge
- Terraform plan/apply on main branch
- Automated rollback on deployment failure

## Disaster Recovery

### Backup Strategy

- RDS automated backups: 7-30 days
- ECR images: Latest 30 versions retained
- S3 versioning: All object versions kept
- CloudFormation state: Stored in S3

### Recovery Procedures

1. **Database Recovery**: Use RDS restore to point in time
2. **Full Infrastructure**: Terraform apply with backed-up state
3. **Application Rollback**: ./devops/scripts/rollback.sh
4. **Data Recovery**: Restore from S3 versioning or snapshots

## Support and Documentation

- AWS Documentation: https://docs.aws.amazon.com
- Terraform Registry: https://registry.terraform.io
- CloudWatch Logs Insights: Query syntax guide in AWS Console
- ECS Best Practices: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-best-practices.html

## Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Review CloudWatch alarms | Daily | Ops |
| Check RDS backups | Weekly | Ops |
| Update dependencies | Weekly | Dev |
| Terraform state backup | Daily | Automation |
| Security patches | As needed | Ops |
| Cost review | Monthly | Ops |
| Disaster recovery drill | Quarterly | Ops |

## Contact and Escalation

For issues or questions:

1. Check CloudWatch logs: `./devops/scripts/logs.sh`
2. Run health checks: `./devops/scripts/health-check.sh`
3. Review recent Terraform changes
4. Check AWS service status: https://status.aws.amazon.com
5. Contact DevOps team or raise GitHub issue

---

**Last Updated**: 2024
**Version**: 1.0
**Maintainer**: DevOps Team
