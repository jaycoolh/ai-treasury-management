# Development Guide

## Getting Started

### Prerequisites

1. **Node.js 18+**

   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **pnpm 8+**

   ```bash
   npm install -g pnpm
   pnpm --version  # Should be 8.x or higher
   ```

3. **Claude Code CLI**

   ```bash
   curl -fsSL https://claude.ai/install.sh | bash
   # Or: brew install --cask claude-code
   ```

4. **Hedera Testnet Accounts**

   - Create accounts at [portal.hedera.com](https://portal.hedera.com)
   - Note account IDs and private keys

5. **Anthropic API Key**
   - Get from [console.anthropic.com](https://console.anthropic.com)

### Initial Setup

```bash
# Clone repository
git clone <your-repo>
cd treasury-agent-system

# Run setup script
pnpm run setup

# Configure environment
vim apps/uk-agent/.env.uk  # Add UK credentials
vim apps/us-agent/.env.us  # Add US credentials
```

## Project Structure

```
treasury-agent-system/
├── apps/                   # Agent applications
│   ├── uk-agent/          # UK treasury agent
│   └── us-agent/          # US treasury agent
├── packages/              # Shared packages
│   ├── mcp-a2a/          # A2A messaging MCP
│   ├── mcp-hedera/       # Hedera blockchain MCP
│   ├── shared-skills/    # Treasury skills
│   ├── shared-types/     # TypeScript types
│   └── shared-config/    # Build config
└── scripts/              # Utility scripts
```

## Development Workflow

### Building Packages

```bash
# Build all packages
pnpm run build

# Build specific package
pnpm --filter @treasury/mcp-hedera build

# Clean and rebuild
pnpm run clean
pnpm run build
```

### Running Agents

**Terminal 1 - UK Agent:**

```bash
pnpm start:uk
# Or for development with hot reload:
pnpm dev:uk
```

**Terminal 2 - US Agent:**

```bash
pnpm start:us
# Or for development:
pnpm dev:us
```

### Testing Agent Communication

**Terminal 3 - Interact with UK Agent:**

```bash
cd apps/uk-agent
claude

# Example commands:
# "Check balance with the Hedera MCP"
# "Send a message to the US agent requesting their balance"
# "Transfer 100 HBAR to the US treasury account"
```

## Package Development

### Adding a New MCP Server

1. **Create package structure:**

   ```bash
   mkdir -p packages/mcp-custom/src
   cd packages/mcp-custom
   ```

2. **Create package.json:**

   ```json
   {
     "name": "@treasury/mcp-custom",
     "type": "module",
     "bin": {
       "mcp-custom": "./dist/index.js"
     },
     "dependencies": {
       "@modelcontextprotocol/sdk": "^1.0.0"
     }
   }
   ```

3. **Implement MCP server:**

   ```typescript
   // src/index.ts
   import { Server } from "@modelcontextprotocol/sdk/server/index.js";
   // ... implement server
   ```

4. **Add to agent MCP config:**
   ```json
   // apps/uk-agent/.claude/mcp.json
   {
     "mcpServers": {
       "custom": {
         "command": "node",
         "args": ["../../packages/mcp-custom/dist/index.js"]
       }
     }
   }
   ```

### Creating a New Skill

1. **Create skill directory:**

   ```bash
   mkdir -p packages/shared-skills/my-skill
   ```

2. **Create SKILL.md:**

   ```markdown
   ---
   name: my-skill
   description: What the skill does and when to use it
   ---

   # My Skill

   ## Instructions

   Step-by-step guidance for Claude...
   ```

3. **Link to agents:**
   ```bash
   ./scripts/link-skills.sh
   # Or manually:
   ln -sf ../../../packages/shared-skills/my-skill apps/uk-agent/.claude/skills/my-skill
   ```

### Modifying Shared Types

```bash
# Edit types
vim packages/shared-types/src/treasury.ts

# Rebuild
pnpm --filter @treasury/shared-types build

# Rebuild dependent packages
pnpm --filter uk-agent build
pnpm --filter us-agent build
```

## Testing

### Manual Testing

**Test A2A Communication:**

```bash
# Terminal 1: Start UK agent
pnpm start:uk

# Terminal 2: Start US agent
pnpm start:us

# Terminal 3: Send test message
curl -X POST http://localhost:4000/a2a/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "sendMessage",
    "params": {
      "message": {
        "messageId": "test-123",
        "role": "user",
        "parts": [{"kind": "text", "text": "Test message"}],
        "kind": "message"
      }
    },
    "id": 1
  }'
```

**Test Hedera MCP:**

```bash
cd apps/uk-agent
claude

# In Claude Code:
# "Use the Hedera MCP to check my balance"
# "Transfer 10 HBAR to account 0.0.12345"
```

### Debugging

**Enable debug logging:**

```bash
# In .env.uk or .env.us
LOG_LEVEL=debug
```

**Check A2A messages:**

```bash
# View incoming messages
ls -la apps/uk-agent/messages/inbox/
cat apps/uk-agent/messages/inbox/*.json

# View archived messages
ls -la apps/uk-agent/messages/archive/
```

**Monitor A2A server logs:**

```bash
# UK server logs will show:
# - Incoming messages
# - Agent processing
# - Tool calls
# - Responses sent
```

## Common Development Tasks

### Update Dependencies

```bash
# Update all dependencies
pnpm update --recursive --latest

# Update specific package
pnpm --filter @treasury/mcp-hedera update @hiero-ledger/sdk
```

### Add New Agent

1. Copy existing agent structure
2. Update configuration files
3. Create entity-specific skills
4. Add to root package.json scripts

### Modify Compliance Rules

```bash
# UK compliance
vim apps/uk-agent/.claude/skills/uk-compliance/SKILL.md

# US compliance
vim apps/us-agent/.claude/skills/us-compliance/SKILL.md

# No rebuild needed - Skills are loaded at runtime
```

### Change Agent Models

```bash
# Edit agent settings
vim apps/uk-agent/.claude/settings.json

# Change model:
{
  "model": "claude-opus-4-20250514"
}
```

## Troubleshooting

### MCP Server Not Connecting

**Symptoms:**

- Claude can't see MCP tools
- "MCP server failed to start" errors

**Solutions:**

```bash
# 1. Check MCP server build
pnpm --filter @treasury/mcp-hedera build

# 2. Test MCP server manually
node packages/mcp-hedera/dist/index.js --ledger-id=testnet

# 3. Check environment variables
cat apps/uk-agent/.env.uk | grep HEDERA

# 4. Verify MCP config path
cat apps/uk-agent/.claude/mcp.json
```

### Skills Not Loading

**Symptoms:**

- Agent doesn't follow compliance rules
- Skills not appearing in agent context

**Solutions:**

```bash
# 1. Check symlinks
ls -la apps/uk-agent/.claude/skills/

# 2. Re-link skills
./scripts/link-skills.sh

# 3. Verify skill frontmatter
head -20 packages/shared-skills/treasury-management/SKILL.md
```

### A2A Messages Not Received

**Symptoms:**

- Messages not appearing in inbox
- Partner agent not responding

**Solutions:**

```bash
# 1. Check both agents are running
curl http://localhost:4000/health
curl http://localhost:5000/health

# 2. Verify partner URLs in env
grep PARTNER_AGENT_URL apps/uk-agent/.env.uk

# 3. Check message directory
ls -la apps/uk-agent/messages/inbox/

# 4. Check A2A server logs for errors
```

### Hedera Transactions Failing

**Symptoms:**

- "Insufficient balance" errors
- Transaction timeouts

**Solutions:**

```bash
# 1. Check account balance
# Use Claude: "Check my Hedera balance"

# 2. Verify credentials
echo $HEDERA_OPERATOR_ID
echo $HEDERA_OPERATOR_KEY | cut -c1-10  # First 10 chars

# 3. Test network connectivity
curl https://testnet.hedera.com/health

# 4. Check Hedera dashboard
# Visit portal.hedera.com
```

## Code Quality

### Type Checking

```bash
# Check all packages
pnpm run typecheck

# Check specific package
pnpm --filter uk-agent typecheck
```

### Linting

```bash
# Add ESLint configuration (optional)
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Create .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["plugin:@typescript-eslint/recommended"],
  "rules": {}
}

# Run linter
pnpm exec eslint . --ext .ts
```

## Performance Optimization

### Build Times

```bash
# Use TypeScript incremental builds
# Already configured in tsconfig.base.json

# Parallel builds
pnpm run build --workspace-concurrency=4
```

### Agent Response Times

- Keep Skills concise (< 500 lines in SKILL.md)
- Use specific tool selection (don't load all tools)
- Set appropriate model (Haiku for simple tasks)

## Contributing

1. **Create feature branch:**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and test:**

   ```bash
   pnpm run build
   pnpm run typecheck
   # Test manually
   ```

3. **Commit and push:**

   ```bash
   git add .
   git commit -m "feat: add my feature"
   git push origin feature/my-feature
   ```

4. **Create pull request**

## Resources

- [A2A Protocol Spec](https://google-a2a.github.io/A2A)
- [Claude Agent SDK Docs](https://docs.anthropic.com/en/docs/agent-sdk/overview)
- [Hedera SDK Docs](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [MCP Protocol](https://modelcontextprotocol.io)
