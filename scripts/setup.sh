#!/bin/bash
set -e

echo "🔧 Setting up Treasury Agent System..."
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build all packages
echo "🏗️  Building packages..."
pnpm run build

# Create message directories
echo "📁 Creating message directories..."
mkdir -p apps/uk-agent/messages/{inbox,archive}
mkdir -p apps/us-agent/messages/{inbox,archive}

# Link shared skills
echo "🔗 Linking shared skills..."
./scripts/link-skills.sh

# Copy env files
echo "🔐 Setting up environment files..."
if [ ! -f apps/uk-agent/.env.uk ]; then
  cp .env.example apps/uk-agent/.env.uk
  echo "   ⚠️  Edit apps/uk-agent/.env.uk with your UK credentials"
fi

if [ ! -f apps/us-agent/.env.us ]; then
  cp .env.example apps/us-agent/.env.us
  echo "   ⚠️  Edit apps/us-agent/.env.us with your US credentials"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Next steps:"
echo "═══════════════════════════════════════════════════════════════"
echo "1. Edit apps/uk-agent/.env.uk with UK Hedera credentials"
echo "2. Edit apps/us-agent/.env.us with US Hedera credentials"
echo "3. Add your ANTHROPIC_API_KEY to both env files"
echo "4. Run 'pnpm start:uk' to start UK agent"
echo "5. Run 'pnpm start:us' to start US agent (in separate terminal)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
