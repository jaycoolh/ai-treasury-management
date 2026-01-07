#!/bin/bash
set -e

echo "🔗 Linking shared skills to agent directories..."

# Create skills directories
mkdir -p apps/uk-agent/.claude/skills
mkdir -p apps/us-agent/.claude/skills

# Link to UK agent
echo "   Linking to UK agent..."
ln -sf ../../../packages/shared-skills/treasury-management apps/uk-agent/.claude/skills/treasury-management 2>/dev/null || true
ln -sf ../../../packages/shared-skills/fx-management apps/uk-agent/.claude/skills/fx-management 2>/dev/null || true

# Link to US agent
echo "   Linking to US agent..."
ln -sf ../../../packages/shared-skills/treasury-management apps/us-agent/.claude/skills/treasury-management 2>/dev/null || true
ln -sf ../../../packages/shared-skills/fx-management apps/us-agent/.claude/skills/fx-management 2>/dev/null || true

echo "✅ Skills linked successfully"
