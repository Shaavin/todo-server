#!/bin/bash

# Function to cleanpu Docker containersr and processes on script exit
cleanup() {
    echo "Cleaning up..."
    docker-compose -f ../docker-compose.yaml stop
    exit 0
}

# Set up trap for cleanup on script exit
trap cleanup EXIT

echo "Starting the Docker container..."
docker-compose -f ../docker-compose.yaml up -d --wait

echo "Running DB migrations..."
docker exec todo_server npm run db:migrate

echo "Running DB seed script..."
docker exec todo_server npm run db:seed

echo "Running end-to-end tests..."
docker exec todo_server npm run test:e2e