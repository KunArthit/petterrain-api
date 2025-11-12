#!/bin/bash

echo "🐳 Testing Docker Environment Variable Loading"
echo "=============================================="

# Check if the debug endpoint is available
echo "📡 Calling debug endpoint to check environment variables..."
echo

# Try to call the debug endpoint
if curl -s http://localhost:8080/api/payment/debug/env > /dev/null 2>&1; then
    echo "✅ API is running, fetching environment debug info..."
    echo
    
    # Get the environment variables from the API
    curl -s http://localhost:8080/api/payment/debug/env | jq '.' || curl -s http://localhost:8080/api/payment/debug/env
    
    echo
    echo "=============================================="
    echo "📋 Check the output above:"
    echo "   - If SMTP_USER shows 'SET', environment variables are loaded correctly"
    echo "   - If SMTP_USER shows 'MISSING', the .env file is not being loaded in Docker"
    echo
    echo "💡 If variables are missing:"
    echo "   1. Rebuild Docker image: docker-compose build api"
    echo "   2. Restart containers: docker-compose down && docker-compose up -d"
    echo "   3. Run this test again"
    
else
    echo "❌ API is not responding at http://localhost:8080"
    echo "💡 Make sure Docker containers are running:"
    echo "   docker-compose up -d"
    echo "   docker-compose logs api"
fi

echo