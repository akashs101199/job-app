#!/bin/bash

# Job App - AWS Rollback Script
# This script rolls back a deployment to the previous stable version

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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}"))" && pwd)"

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

# Main execution
main() {
    log "Starting rollback for environment: $ENVIRONMENT"

    CLUSTER="${PROJECT_NAME}-${ENVIRONMENT}-cluster"

    # Get previous task definition revision
    log "Fetching previous task definition revisions..."

    for service in backend frontend; do
        log "Rolling back ${service} service..."

        # Get current task definition
        CURRENT_TASK_DEF=$(aws ecs describe-services \
            --cluster "$CLUSTER" \
            --services "${PROJECT_NAME}-${ENVIRONMENT}-${service}" \
            --region "$AWS_REGION" \
            --query 'services[0].taskDefinition' \
            --output text)

        if [ -z "$CURRENT_TASK_DEF" ]; then
            error "Could not find task definition for ${service}"
        fi

        # Extract family and revision
        FAMILY=$(echo "$CURRENT_TASK_DEF" | sed 's/:/ /g' | awk '{print $(NF-1)}')
        REVISION=$(echo "$CURRENT_TASK_DEF" | sed 's/:/ /g' | awk '{print $NF}')

        # Get previous revision
        PREVIOUS_REVISION=$((REVISION - 1))

        if [ $PREVIOUS_REVISION -lt 1 ]; then
            error "No previous revision available for rollback (current revision: $REVISION)"
        fi

        PREVIOUS_TASK_DEF="${FAMILY}:${PREVIOUS_REVISION}"

        log "Rolling back ${service} from revision $REVISION to $PREVIOUS_REVISION"

        # Update service to use previous task definition
        aws ecs update-service \
            --cluster "$CLUSTER" \
            --service "${PROJECT_NAME}-${ENVIRONMENT}-${service}" \
            --task-definition "$PREVIOUS_TASK_DEF" \
            --force-new-deployment \
            --region "$AWS_REGION" > /dev/null

        log "${service} service rolled back successfully"
    done

    log "Waiting for services to stabilize..."
    sleep 30

    log "${GREEN}Rollback completed successfully!${NC}"
    log "Please verify that the application is working correctly"
}

main "$@"
