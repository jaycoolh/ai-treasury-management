# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Autonomous cross-border treasury management using Claude Code agents communicating via the Agent-to-Agent (A2A) protocol with Hedera blockchain settlement. Two agents (UK and US) manage treasury operations between business entities.

## Build & Development Commands

```bash
# Initial setup (install, build, link skills)
pnpm run setup

# Build all packages
pnpm run build

# Build specific package
pnpm --filter @treasury/mcp-hedera build

# Type checking
pnpm run typecheck

# Development with hot reload
pnpm dev:uk    # UK agent
pnpm dev:us    # US agent

# Production start (requires built packages)
pnpm start:uk  # UK agent on port 4000
pnpm start:us  # US agent on port 5001

# Clean all build artifacts
pnpm run clean
```

## Architecture

### Monorepo Structure

This is a **pnpm workspace** monorepo:
- `apps/uk-agent/` and `apps/us-agent/` - Claude Code agents with A2A servers
- `packages/mcp-*` - MCP servers (hedera, a2a, arp)
- `packages/shared-types/` - TypeScript type definitions
- `packages/shared-skills/` - Domain skills (treasury-management, fx-management)
- `packages/shared-config/` - Base TypeScript configuration

### Agent Components

Each agent (`apps/uk-agent/`, `apps/us-agent/`) contains:
- `a2a-server/` - Express server implementing A2A JSON-RPC protocol
- `.claude/mcp.json` - MCP server configuration
- `.claude/settings.json` - Claude model and permissions
- `.claude/skills/` - Symlinked skills (run `scripts/link-skills.sh` if missing)
- `.env.uk` or `.env.us` - Environment configuration
- `messages/` - A2A message storage (inbox/archive)

### MCP Servers

Three MCP servers provide tools to agents:
- **mcp-hedera**: Hedera blockchain operations (transfer HBAR, query balances, create tokens)
- **mcp-a2a**: Agent-to-agent messaging (send_message_to_partner, check_partner_messages)
- **mcp-arp**: Accounts receivable/payable management

All use stdio transport and Zod for input validation.

### A2A Protocol

- JSON-RPC 2.0 over HTTP
- Endpoints: `/.well-known/agent-card.json`, `/a2a/jsonrpc`, `/health`
- Messages include: timestamp, from, contextId, taskId, message, metadata.sender
- Messages persisted to filesystem in `messages/inbox/` and `messages/archive/`

### Skills System

Skills provide domain knowledge as markdown files:
- **treasury-management**: Transfer workflows, balance inquiries, consolidation
- **fx-management**: GBP/USD/HBAR conversion, FX gain/loss
- **uk-compliance** (UK agent only): FCA rules, transfer thresholds (£10k/£50k/£100k)
- **us-compliance** (US agent only): FinCEN rules, OFAC screening, BSA/AML ($10k CTR, $3k BSA)

## Key Type Definitions

Located in `packages/shared-types/src/`:
- `a2a.ts`: A2AMessage, SendMessageParams, CheckMessagesResult
- `treasury.ts`: TransferRequest, BalanceInquiry, TreasuryPosition, FXRate
- `hedera.ts`: Hedera operation types
- `arp.ts`: Accounts receivable/payable types

## Environment Configuration

Each agent requires its own env file (`apps/uk-agent/.env.uk`, `apps/us-agent/.env.us`):
- Hedera: `UK_HEDERA_ACCOUNT_ID`, `UK_HEDERA_PRIVATE_KEY`
- A2A: `UK_A2A_PORT`, `UK_PARTNER_AGENT_URL`, `UK_PARTNER_HEDERA_ACCOUNT_ID`
- ARP: `UK_ARP_DATA_DIR`
- Shared: `HEDERA_NETWORK` (testnet/mainnet), `ANTHROPIC_API_KEY`

## Code Conventions

- TypeScript strict mode
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- JSDoc comments for public APIs
- Zod schemas for MCP tool input validation
- Skills follow progressive disclosure pattern (overview → detailed instructions)

## Common Workflows

**Cross-Border Transfer**: UK agent validates → sends A2A notification → US agent acknowledges → UK executes Hedera transfer → US confirms receipt

**Balance Inquiry**: Agent queries local Hedera balance → requests partner balance via A2A → consolidates total position

## Important Notes

- MCP servers must be built before Claude Code can invoke them
- After adding skills, run `scripts/link-skills.sh` to symlink to agent directories
- Use `pnpm --filter <package>` for targeted operations
- A2A servers run on localhost (use HTTPS in production)
- Compliance skills encode regulatory requirements - do not bypass
