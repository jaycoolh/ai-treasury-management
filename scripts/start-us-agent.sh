#!/bin/bash
set -e

echo "🇺🇸 Starting US Treasury Agent..."
echo ""

# Check if env file exists
if [ ! -f apps/us-agent/.env.us ]; then
  echo "❌ Error: apps/us-agent/.env.us not found"
  echo "   Run 'pnpm run setup' first"
  exit 1
fi

# Load environment
export $(cat apps/us-agent/.env.us | grep -v '^#' | xargs)

# Start A2A server
cd apps/us-agent
pnpm dev
