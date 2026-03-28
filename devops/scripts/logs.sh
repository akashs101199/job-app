#!/bin/bash

# Job App - Logs Viewing Script
# This script retrieves and displays logs from CloudWatch

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-dev}
SERVICE=${2:-all}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="job-app"
LINES=${3:-100}

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Main execution
main() {
    log "Fetching logs for environment: $ENVIRONMENT"
    echo ""

    LOG_GROUP="/ecs/${PROJECT_NAME}-${ENVIRONMENT}"

    if [ "$SERVICE" = "all" ]; then
        # Fetch logs for all services
        for service in backend frontend; do
            log "=== ${service^^} Logs (last $LINES lines) ==="

            aws logs tail "$LOG_GROUP" \
                --log-stream-names "${service}" \
                --follow=false \
                --lines "$LINES" \
                --region "$AWS_REGION" \
                2>/dev/null || warn "Could not fetch logs for $service"

            echo ""
        done
    else
        log "=== ${SERVICE^^} Logs (last $LINES lines) ==="

        aws logs tail "$LOG_GROUP" \
            --log-stream-names "$SERVICE" \
            --follow=false \
            --lines "$LINES" \
            --region "$AWS_REGION" \
            2>/dev/null || warn "Could not fetch logs for $SERVICE"
    fi
}

# Show usage
if [ "$ENVIRONMENT" = "--help" ] || [ "$ENVIRONMENT" = "-h" ]; then
    cat << EOF
Usage: $0 [ENVIRONMENT] [SERVICE] [LINES]

Arguments:
  ENVIRONMENT  Environment name (dev, staging, production) [default: dev]
  SERVICE      Service to view logs for (backend, frontend, all) [default: all]
  LINES        Number of lines to fetch [default: 100]

Examples:
  # View backend logs in dev environment
  $0 dev backend 50

  # View all logs in production
  $0 production all 200

  # Stream backend logs with follow (requires tail command with --follow support)
  aws logs tail /ecs/${PROJECT_NAME}-production --log-stream-names backend --follow
EOF
    exit 0
fi

main "$@"
