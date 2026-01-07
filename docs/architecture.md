# Treasury Agent System Architecture

## Overview

The Treasury Agent System enables autonomous cross-border treasury management between UK and US business entities using AI agents communicating via the Agent-to-Agent (A2A) protocol with settlement on the Hedera blockchain.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    UK BUSINESS AGENT                            │
├─────────────────────────────────────────────────────────────────┤
│  Claude Code Agent (Interactive)                                │
│  ├─ Skills: treasury-management, uk-compliance, fx-management   │
│  └─ MCP Servers: Hedera (blockchain), A2A (messaging)           │
│                                                                 │
│  A2A Server (Autonomous - Port 4000)                            │
│  ├─ Receives messages from US agent                             │
│  ├─ Claude Agent SDK processes autonomously                     │
│  ├─ Skills + MCP tools execute operations                       │
│  └─ Responds via A2A protocol                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ A2A Protocol
                              │ (JSON-RPC over HTTP)
                              ▼
                    ┌────────────────────┐
                    │  Hedera Network    │
                    │  (Testnet/Mainnet) │
                    └────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    US BUSINESS AGENT                            │
├─────────────────────────────────────────────────────────────────┤
│  Claude Code Agent (Interactive)                                │
│  ├─ Skills: treasury-management, us-compliance, fx-management   │
│  └─ MCP Servers: Hedera (blockchain), A2A (messaging)           │
│                                                                 │
│  A2A Server (Autonomous - Port 5001)                            │
│  ├─ Receives messages from UK agent                             │
│  ├─ Claude Agent SDK processes autonomously                     │
│  ├─ Skills + MCP tools execute operations                       │
│  └─ Responds via A2A protocol                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Layers

### Layer 1: User Interaction

- **Claude Code CLI**: Interactive interface for treasury officers
- Users issue natural language commands
- Agent interprets intent using Skills

### Layer 2: Agent Intelligence

- **Claude Agent SDK**: Autonomous processing engine
- **Skills**: Domain knowledge (treasury, compliance, FX)
- **MCP Tools**: Execution capabilities (blockchain, messaging)

### Layer 3: Communication

- **A2A Protocol**: Standardized agent-to-agent messaging (JSON-RPC 2.0 over HTTP)
- **JSON-RPC Methods**: `message/send` for sending messages, `tasks/get` for querying
- **Express Servers**: HTTP endpoints for A2A communication at `/a2a/jsonrpc`

### Layer 4: Execution

- **Hedera SDK**: Blockchain operations (transfers, queries)
- **MCP Servers**: Tool interfaces
- **File System**: Message persistence and audit logs

## Data Flow

### Interactive Mode (User → Agent)

```
1. User Input
   └─→ Claude Code CLI

2. Intent Understanding
   └─→ Skills (treasury-management, uk/us-compliance)

3. Tool Selection
   └─→ MCP Tools (Hedera for blockchain, A2A for messaging)

4. Execution
   ├─→ Hedera MCP: Execute blockchain transfer
   └─→ A2A MCP: Send notification to partner agent

5. Response
   └─→ User receives confirmation
```

### Autonomous Mode (Agent → Agent)

```
1. US Agent sends message via A2A
   └─→ HTTP POST to UK A2A server (port 4000)
       Method: message/send (JSON-RPC 2.0)

2. UK A2A Server receives message
   └─→ AgentExecutor invoked

3. Claude Agent SDK processes
   ├─→ Loads Skills (treasury-management, uk-compliance)
   ├─→ Connects to MCP Servers (Hedera, A2A)
   ├─→ Analyzes incoming message
   └─→ Determines required actions

4. Agent executes operations
   ├─→ Query Hedera balance
   ├─→ Validate compliance rules
   └─→ Prepare response

5. Response sent back
   └─→ A2A protocol returns message to US agent
```

### A2A JSON-RPC Message Format

**Endpoint:** `POST /a2a/jsonrpc`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "message/send",
  "params": {
    "message": {
      "kind": "message",
      "role": "user",
      "messageId": "unique-message-id",
      "parts": [
        {
          "kind": "text",
          "text": "Message content"
        }
      ]
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "result": {
    "kind": "message",
    "messageId": "response-message-id",
    "role": "agent",
    "parts": [
      {
        "kind": "text",
        "text": "Agent response"
      }
    ],
    "contextId": "correlation-id"
  }
}
```

## Skills Architecture

### Shared Skills

Located in `packages/shared-skills/`:

- **treasury-management**: Workflow guidance for intercompany transfers
- **fx-management**: FX rate handling and documentation

### Agent-Specific Skills

Located in `apps/{uk|us}-agent/.claude/skills/`:

- **uk-compliance**: FCA requirements, UK tax, approval thresholds
- **us-compliance**: FinCEN, OFAC, BSA/AML, US tax

### Skill Loading

Skills are symlinked from shared package to agent directories:

```
apps/uk-agent/.claude/skills/treasury-management -> packages/shared-skills/treasury-management
```

## MCP Server Architecture

### Hedera MCP

**Purpose**: Blockchain operations on Hedera network

**Tools**:

- `TRANSFER_HBAR_TOOL`: Execute HBAR transfers
- `GET_HBAR_BALANCE_QUERY_TOOL`: Query account balances

**Configuration**:

- Operator ID and private key from env
- Network selection (testnet/mainnet)
- Stdio transport for Claude Code integration

### A2A MCP

**Purpose**: Inter-agent communication

**Tools**:

- `send_message_to_partner`: Send message to partner agent
- `check_partner_messages`: Poll for incoming messages

**Configuration**:

- Partner agent URL
- Message directory path
- Stdio transport

## Security Model

### Authentication

**Current (Demo)**:

- No authentication between A2A servers
- LocalHost-only communication

**Production Requirements**:

- OAuth 2.0 or API key authentication in AgentCard
- TLS/HTTPS for all A2A communication
- Hedera private keys in secure key management

### Authorization

**Compliance Rules**:

- Skills define authorization thresholds
- UK: CFO approval for £100,000+
- US: Enhanced due diligence for $100,000+

**Permission Modes**:

- Interactive mode: User approval for sensitive operations
- Autonomous mode: `bypassPermissions` for A2A server

### Audit Trail

**Logged Information**:

- All A2A messages (inbox and archive)
- Hedera transaction IDs
- Compliance checks and approvals
- Agent decision logs

## Deployment Models

### Local Development (Current)

```
Machine: localhost
UK Agent: Port 4000
US Agent: Port 5001
Network: Hedera testnet
```

### Production Deployment

```
UK Server: https://uk-treasury.company.com
US Server: https://us-treasury.company.com
Network: Hedera mainnet
Authentication: OAuth 2.0
Monitoring: CloudWatch/Datadog
```

## Scalability Considerations

### Horizontal Scaling

- A2A servers are stateless (except InMemoryTaskStore)
- Can run multiple instances behind load balancer
- Message storage needs distributed solution (Redis, Database)

### Message Queue

For high-volume scenarios:

- Replace file-based message storage with queue (SQS, RabbitMQ)
- Maintain message ordering guarantees
- Add retry logic for failed processing

### Monitoring

**Metrics to Track**:

- A2A message latency
- Hedera transaction success rate
- Compliance validation failures
- Agent processing time

## Technology Stack

| Layer           | Technology                | Purpose                        |
| --------------- | ------------------------- | ------------------------------ |
| AI Agent        | Claude Sonnet 4           | Natural language understanding |
| Agent Framework | Claude Agent SDK          | Autonomous operation           |
| Skills          | Markdown files            | Domain knowledge               |
| Tools           | MCP Servers               | Execution capabilities         |
| Communication   | A2A Protocol (a2a-js SDK) | Agent messaging                |
| Blockchain      | Hedera SDK                | Transfers and queries          |
| Runtime         | Node.js + TypeScript      | Application logic              |
| Packaging       | pnpm workspaces           | Monorepo management            |

## Future Enhancements

1. **Multi-Entity Support**: More than 2 entities
2. **Smart Contracts**: Hedera smart contracts for complex logic
3. **Analytics Dashboard**: Real-time treasury position
4. **Advanced Compliance**: ML-based fraud detection
5. **Integration**: ERP/accounting system connectors
