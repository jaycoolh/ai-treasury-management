# Treasury Agent System

Autonomous cross-border treasury management using Claude Code agents communicating via the Agent-to-Agent (A2A) protocol on Hedera blockchain.

## Overview

This system enables autonomous treasury operations between a UK and US business entity using:

- **Claude Code Agents**: AI agents with domain expertise in treasury management
- **A2A Protocol**: Standardized agent-to-agent communication
- **Hedera Blockchain**: Fast, secure cross-border transfers
- **Agent Skills**: Domain knowledge for treasury operations and compliance
- **MCP Servers**: Tools for blockchain operations and inter-agent messaging

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                UK BUSINESS CLAUDE CODE AGENT                 │
│  Skills: treasury-management, uk-compliance, fx-management   │
│  MCP: Hedera (blockchain), A2A (messaging)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ A2A Protocol (JSON-RPC)
                              ▼
                    ┌────────────────────┐
                    │  A2A Message Bus   │
                    │  Express Servers   │
                    └────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                US BUSINESS CLAUDE CODE AGENT                 │
│  Skills: treasury-management, us-compliance, fx-management   │
│  MCP: Hedera (blockchain), A2A (messaging)                   │
└─────────────────────────────────────────────────────────────┘
```

## Repository Structure

```
treasury-agent-system/
├── apps/
│   ├── uk-agent/           # UK Treasury Agent
│   └── us-agent/           # US Treasury Agent
├── packages/
│   ├── mcp-a2a/           # A2A messaging MCP server
│   ├── mcp-hedera/        # Hedera blockchain MCP server
│   ├── shared-skills/     # Treasury domain knowledge
│   ├── shared-types/      # TypeScript type definitions
│   └── shared-config/     # Shared configuration
└── scripts/               # Setup and utility scripts
```

## Prerequisites

- Node.js 18+
- pnpm 8+
- Claude Code CLI
- Anthropic API key
- Hedera testnet/mainnet accounts

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd treasury-agent-system

# Run setup script
pnpm run setup
```

### 2. Configure Environment

Edit the environment files with your credentials:

```bash
# UK Agent
vim apps/uk-agent/.env.uk

# US Agent
vim apps/us-agent/.env.us
```

Required variables:

- `UK_HEDERA_ACCOUNT_ID` / `US_HEDERA_ACCOUNT_ID`
- `UK_HEDERA_PRIVATE_KEY` / `US_HEDERA_PRIVATE_KEY`
- `ANTHROPIC_API_KEY`

### 3. Start Agents

In separate terminals:

```bash
# Terminal 1: Start UK Agent
pnpm start:uk

# Terminal 2: Start US Agent
pnpm start:us
```

### 4. Interact with Agents

Using Claude Code CLI:

```bash
# In UK agent directory
cd apps/uk-agent
claude

# Example prompt:
# "Send a message to the US treasury agent requesting confirmation
#  that they can receive 50,000 HBAR for Q4 operating capital"
```

## Development

### Build All Packages

```bash
pnpm run build
```

### Run Type Checking

```bash
pnpm run typecheck
```

### Clean Build Artifacts

```bash
pnpm run clean
```

### Development Mode

```bash
# UK agent with hot reload
pnpm dev:uk

# US agent with hot reload
pnpm dev:us
```

## Project Components

### Apps

- **uk-agent**: UK treasury agent with A2A server and Claude Code configuration
- **us-agent**: US treasury agent with A2A server and Claude Code configuration

### Packages

- **mcp-a2a**: MCP server providing agent-to-agent messaging tools
- **mcp-hedera**: MCP server providing Hedera blockchain operations
- **shared-skills**: Agent Skills for treasury management, compliance, and FX
- **shared-types**: TypeScript type definitions shared across packages
- **shared-config**: Base TypeScript and build configuration

## Agent Skills

Skills provide domain knowledge to the agents:

- **treasury-management**: Cash positioning, intercompany transfers, compliance workflows
- **uk-compliance**: UK financial regulations and reporting requirements
- **us-compliance**: US FinCEN requirements and regulatory thresholds
- **fx-management**: Foreign exchange rate handling and conversion logic

## MCP Tools

### Hedera MCP

- `TRANSFER_HBAR_TOOL`: Execute HBAR transfers
- `GET_HBAR_BALANCE_QUERY_TOOL`: Query account balances
- `CREATE_FUNGIBLE_TOKEN_TOOL`: Create HTS tokens
- `AIRDROP_FUNGIBLE_TOKEN_TOOL`: Distribute tokens

### A2A MCP

- `send_message_to_partner`: Send message to partner agent
- `check_partner_messages`: Poll for incoming messages

## Example Workflows

### Cross-Border Transfer

1. UK user requests transfer to US entity
2. UK agent validates against uk-compliance rules
3. UK agent sends notification to US agent via A2A
4. US agent receives and acknowledges capability
5. UK agent executes Hedera transfer using Hedera MCP
6. US agent verifies receipt and updates records
7. Both agents log transaction for audit

### Balance Inquiry

1. User asks UK agent for treasury position
2. UK agent queries Hedera balance via MCP
3. UK agent requests US balance via A2A message
4. US agent queries its Hedera balance and responds
5. UK agent consolidates and reports total position

## Security Considerations

- API keys stored in environment files (gitignored)
- Hedera private keys never committed to repository
- A2A servers run on localhost for demo (use HTTPS in production)
- Permission modes configured per agent in `.claude/settings.json`

## Deployment

For production deployment:

- Use HTTPS for A2A communication
- Implement authentication in A2A AgentCard
- Use Hedera mainnet accounts
- Deploy agents to separate servers
- Implement proper logging and monitoring
- Add rate limiting and error handling

## Troubleshooting

### Agent not starting

Check that:

- Environment variables are set correctly
- Hedera credentials are valid
- Ports 4000 and 5000 are not in use
- pnpm dependencies are installed

### MCP server not connecting

Verify:

- MCP server paths in `.claude/mcp.json` are correct
- Packages are built (`pnpm run build`)
- Environment variables are accessible to MCP servers

### Messages not being received

Ensure:

- Both A2A servers are running
- Partner agent URLs are correct in env files
- Message directories exist and are writable

## Documentation

- [Architecture](./docs/architecture.md)
- [Development Guide](./docs/development.md)
- [Deployment Guide](./docs/deployment.md)

## License

MIT

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.
