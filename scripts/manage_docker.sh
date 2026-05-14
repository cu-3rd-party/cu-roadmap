#!/bin/bash

# Default action
ACTION=${1:-up}

case $ACTION in
  "up")
    echo "🚀 Starting all containers..."
    docker-compose up -d
    ;;
  "down")
    echo "🛑 Stopping all containers..."
    docker-compose down
    ;;
  "rebuild-front")
    echo "🔄 Rebuilding Frontend..."
    docker-compose up -d --no-deps --build frontend
    ;;
  "rebuild-back")
    echo "🔄 Rebuilding Backend..."
    docker-compose up -d --no-deps --build backend
    ;;
  "logs")
    docker-compose logs -f
    ;;
  *)
    echo "Usage: $0 {up|down|rebuild-front|rebuild-back|logs}"
    exit 1
    ;;
esac
