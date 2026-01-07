#!/bin/bash
set -e

echo "🏗️  Building all packages..."
echo ""

# Build in dependency order
echo "📦 Building shared packages..."
pnpm --filter @treasury/shared-types build
pnpm --filter @treasury/mcp-hedera build
pnpm --filter @treasury/mcp-a2a build

echo ""
echo "📦 Building agent applications..."
pnpm --filter uk-agent build
pnpm --filter us-agent build

echo ""
echo "✅ All packages built successfully!"
