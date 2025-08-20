#!/bin/bash

# Setup script for custom Docker Compose deployment
echo "🚀 Setting up custom Docker Compose deployment for Perplexica..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p searxng
mkdir -p uploads

# Copy and configure config.toml
echo "⚙️ Setting up configuration..."
if [ ! -f config.toml ]; then
    echo "❌ config.toml not found. Please create it from sample.config.toml"
    echo "   cp sample.config.toml config.toml"
    echo "   Then edit config.toml with your API keys and settings"
    exit 1
fi

# Make entrypoint script executable
echo "🔧 Making scripts executable..."
chmod +x entrypoint.custom.sh

# Build and start the services
echo "🏗️ Building Docker images..."
docker-compose -f docker-compose.custom.yaml build

echo "✅ Setup complete!"
echo ""
echo "📋 To start your custom Perplexica instance:"
echo "   docker-compose -f docker-compose.custom.yaml up -d"
echo ""
echo "📋 To view logs:"
echo "   docker-compose -f docker-compose.custom.yaml logs -f"
echo ""
echo "📋 To stop:"
echo "   docker-compose -f docker-compose.custom.yaml down"
echo ""
echo "📋 Access your Perplexica at: http://localhost:3000"
echo "📋 Access SearxNG at: http://localhost:4000"