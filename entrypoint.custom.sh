#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
node migrate.js

# Start the application
echo "Starting Perplexica application..."
exec node server.js