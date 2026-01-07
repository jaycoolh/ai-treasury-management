#!/bin/bash
set -e

echo "🇬🇧 Starting UK Treasury Agent..."
echo ""

# Check if env file exists
if [ ! -f apps/uk-agent/.env.uk ]; then
  echo "❌ Error: apps/uk-agent/.env.uk not found"
  echo "   Run 'pnpm run setup' first"
  exit 1
fi

# Load environment
export $(cat apps/uk-agent/.env.uk | grep -v '^#' | xargs)

# Start A2A server
cd apps/uk-agent
pnpm dev
