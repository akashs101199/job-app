#!/bin/bash

# Job App - AWS Deployment Script
# This script deploys the application to AWS using Terraform and Docker

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="job-app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/../terraform"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_requirements() {
    log "Checking prerequisites..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed. Please install it first."
    fi

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        error "Terraform is not installed. Please install it first."
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install it first."
    fi

    # Check jq (for JSON processing)
    if ! command -v jq &> /dev/null; then
        warn "jq is not installed. Installing..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y jq
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install jq
        fi
    fi

    log "All prerequisites are installed."
}

validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
        error "Invalid environment. Must be dev, staging, or production."
    fi

    if [[ ! -f "${TERRAFORM_DIR}/environments/${ENVIRONMENT}.tfvars" ]]; then
        error "Environment file not found: ${TERRAFORM_DIR}/environments/${ENVIRONMENT}.tfvars"
    fi

    if [[ ! -f "${SCRIPT_DIR}/../.env.${ENVIRONMENT}" ]]; then
        warn "Environment file not found: ${SCRIPT_DIR}/../.env.${ENVIRONMENT}"
        warn "Please create this file before deploying."
    fi

    log "Environment validation passed for: $ENVIRONMENT"
}

build_docker_images() {
    log "Building Docker images..."

    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

    # Login to ECR
    log "Logging in to ECR..."
    aws ecr get-login-password --region "${AWS_REGION}" | \
        docker login --username AWS --password-stdin "${AWS_REGISTRY}"

    # Build backend
    log "Building backend image..."
    docker build \
        -t "${AWS_REGISTRY}/${PROJECT_NAME}-backend:${ENVIRONMENT}-$(git rev-parse --short HEAD)" \
        -f Api/Dockerfile \
        .

    # Build frontend
    log "Building frontend image..."
    docker build \
        -t "${AWS_REGISTRY}/${PROJECT_NAME}-frontend:${ENVIRONMENT}-$(git rev-parse --short HEAD)" \
        -f client/Dockerfile \
        .

    # Tag as latest
    docker tag "${AWS_REGISTRY}/${PROJECT_NAME}-backend:${ENVIRONMENT}-$(git rev-parse --short HEAD)" \
        "${AWS_REGISTRY}/${PROJECT_NAME}-backend:latest"
    docker tag "${AWS_REGISTRY}/${PROJECT_NAME}-frontend:${ENVIRONMENT}-$(git rev-parse --short HEAD)" \
        "${AWS_REGISTRY}/${PROJECT_NAME}-frontend:latest"

    log "Docker images built successfully."
}

push_docker_images() {
    log "Pushing Docker images to ECR..."

    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

    # Create ECR repositories if they don't exist
    for repo in backend frontend; do
        if ! aws ecr describe-repositories --repository-names "${PROJECT_NAME}-${repo}" \
            --region "${AWS_REGION}" &>/dev/null; then
            log "Creating ECR repository: ${PROJECT_NAME}-${repo}"
            aws ecr create-repository \
                --repository-name "${PROJECT_NAME}-${repo}" \
                --region "${AWS_REGION}" \
                --encryption-configuration encryptionType=AES
        fi
    done

    # Push images
    docker push "${AWS_REGISTRY}/${PROJECT_NAME}-backend:latest"
    docker push "${AWS_REGISTRY}/${PROJECT_NAME}-frontend:latest"

    log "Docker images pushed successfully."
}

terraform_init() {
    log "Initializing Terraform..."

    cd "${TERRAFORM_DIR}"

    terraform init \
        -backend-config="region=${AWS_REGION}"

    log "Terraform initialized."
}

terraform_plan() {
    log "Planning Terraform deployment..."

    cd "${TERRAFORM_DIR}"

    terraform plan \
        -var-file="environments/${ENVIRONMENT}.tfvars" \
        -var="aws_region=${AWS_REGION}" \
        -out="tfplan"

    log "Terraform plan created. Review the plan above."
}

terraform_apply() {
    log "Applying Terraform configuration..."

    read -p "Do you want to proceed with the deployment? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        error "Deployment cancelled by user."
    fi

    cd "${TERRAFORM_DIR}"

    terraform apply "tfplan"

    log "Terraform apply completed successfully."
}

run_migrations() {
    log "Running database migrations..."

    # Get ECS task definition
    TASK_DEF=$(aws ecs describe-task-definition \
        --task-definition "${PROJECT_NAME}-${ENVIRONMENT}-backend" \
        --region "${AWS_REGION}" \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)

    # Get cluster and service info
    CLUSTER="${PROJECT_NAME}-${ENVIRONMENT}-cluster"
    SUBNETS=$(aws ec2 describe-subnets \
        --filters "Name=tag:Environment,Values=${ENVIRONMENT}" \
        --query 'Subnets[0].SubnetId' \
        --output text \
        --region "${AWS_REGION}")

    # Run migration task
    aws ecs run-task \
        --cluster "${CLUSTER}" \
        --task-definition "${TASK_DEF}" \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNETS}],assignPublicIp=DISABLED}" \
        --overrides '{
            "containerOverrides": [{
                "name": "backend",
                "command": ["npx", "prisma", "migrate", "deploy"]
            }]
        }' \
        --region "${AWS_REGION}"

    log "Database migrations completed."
}

update_ecs_services() {
    log "Updating ECS services to use new images..."

    CLUSTER="${PROJECT_NAME}-${ENVIRONMENT}-cluster"

    for service in backend frontend; do
        log "Updating ${service} service..."

        aws ecs update-service \
            --cluster "${CLUSTER}" \
            --service "${PROJECT_NAME}-${ENVIRONMENT}-${service}" \
            --force-new-deployment \
            --region "${AWS_REGION}"

        log "${service} service updated."
    done

    log "Waiting for services to stabilize..."
    sleep 30

    log "All services updated successfully."
}

# Main execution
main() {
    log "Starting deployment for environment: $ENVIRONMENT"

    check_requirements
    validate_environment
    build_docker_images
    push_docker_images
    terraform_init
    terraform_plan
    terraform_apply
    update_ecs_services
    run_migrations

    log "${GREEN}Deployment completed successfully!${NC}"
    log "Application is available at: $(terraform output -raw alb_dns_name 2>/dev/null || echo 'DNS name not available')"
}

# Run main function
main "$@"
