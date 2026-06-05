#!/bin/bash
# Deployment script for CinemaBro on home server
# This script receives webhook triggers and updates the running container

set -e

LOG_FILE="/var/log/cinemabro-deploy.log"
DEPLOYMENT_DIR="/opt/cinemabro"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "Deployment triggered"

cd $DEPLOYMENT_DIR

# Pull latest changes
log "Pulling latest changes from GitHub..."
git fetch origin
git reset --hard origin/main

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
else
    log "WARNING: .env file not found"
fi

# Rebuild and restart container
log "Building Docker image..."
docker-compose build --pull

log "Stopping old container..."
docker-compose down

log "Starting new container..."
docker-compose up -d

log "Waiting for health check..."
sleep 10

if docker-compose ps | grep -q "healthy"; then
    log "Deployment successful!"
else
    log "ERROR: Container failed health check"
    exit 1
fi

log "Cleaning up old images..."
docker image prune -f

log "Deployment complete"
