#!/bin/bash

# Job App - Health Check Script
# This script checks the health of the deployed application

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="job-app"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

failed() {
    echo -e "${RED}[✗]${NC} $1"
}

check_health() {
    local service=$1
    local url=$2
    local expected_status=$3

    log "Checking health of $service..."

    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

        if [ "$response" = "$expected_status" ]; then
            success "$service is healthy (HTTP $response)"
            return 0
        else
            failed "$service returned HTTP $response (expected $expected_status)"
            return 1
        fi
    else
        warn "curl not found, skipping HTTP checks"
        return 0
    fi
}

# Main execution
main() {
    log "Starting health checks for environment: $ENVIRONMENT"
    echo ""

    CLUSTER="${PROJECT_NAME}-${ENVIRONMENT}-cluster"
    failed_checks=0

    # Check ALB health
    log "Fetching ALB DNS name..."
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --region "$AWS_REGION" \
        --query "LoadBalancers[?contains(LoadBalancerName, '${PROJECT_NAME}-${ENVIRONMENT}')].DNSName" \
        --output text)

    if [ -z "$ALB_DNS" ]; then
        error "Could not find ALB for environment: $ENVIRONMENT"
        exit 1
    fi

    success "Found ALB: $ALB_DNS"
    echo ""

    # Check ECS cluster
    log "Checking ECS cluster..."
    CLUSTER_STATUS=$(aws ecs describe-clusters \
        --clusters "$CLUSTER" \
        --region "$AWS_REGION" \
        --query 'clusters[0].status' \
        --output text)

    if [ "$CLUSTER_STATUS" = "ACTIVE" ]; then
        success "ECS cluster is active"
    else
        failed "ECS cluster status is $CLUSTER_STATUS"
        ((failed_checks++))
    fi

    # Check ECS services
    log "Checking ECS services..."
    for service in backend frontend; do
        SERVICE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-${service}"

        RUNNING_COUNT=$(aws ecs describe-services \
            --cluster "$CLUSTER" \
            --services "$SERVICE_NAME" \
            --region "$AWS_REGION" \
            --query 'services[0].runningCount' \
            --output text)

        DESIRED_COUNT=$(aws ecs describe-services \
            --cluster "$CLUSTER" \
            --services "$SERVICE_NAME" \
            --region "$AWS_REGION" \
            --query 'services[0].desiredCount' \
            --output text)

        if [ "$RUNNING_COUNT" -eq "$DESIRED_COUNT" ] && [ "$RUNNING_COUNT" -gt 0 ]; then
            success "${service^} service: $RUNNING_COUNT/$DESIRED_COUNT tasks running"
        else
            failed "${service^} service: $RUNNING_COUNT/$DESIRED_COUNT tasks running"
            ((failed_checks++))
        fi
    done
    echo ""

    # Check RDS database
    log "Checking RDS database..."
    DB_STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier "${PROJECT_NAME}-${ENVIRONMENT}-db" \
        --region "$AWS_REGION" \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text 2>/dev/null || echo "not found")

    if [ "$DB_STATUS" = "available" ]; then
        success "RDS database is available"
    elif [ "$DB_STATUS" = "not found" ]; then
        warn "RDS database not found (may be in dev environment)"
    else
        failed "RDS database status is $DB_STATUS"
        ((failed_checks++))
    fi
    echo ""

    # Check HTTP endpoints
    log "Checking HTTP endpoints..."
    check_health "Frontend" "http://${ALB_DNS}" "200" || ((failed_checks++))
    check_health "API" "http://${ALB_DNS}/api/health" "200" || ((failed_checks++))
    echo ""

    # Summary
    log "Health check summary:"
    if [ $failed_checks -eq 0 ]; then
        echo -e "${GREEN}All health checks passed!${NC}"
        exit 0
    else
        echo -e "${RED}$failed_checks health checks failed${NC}"
        exit 1
    fi
}

main "$@"
