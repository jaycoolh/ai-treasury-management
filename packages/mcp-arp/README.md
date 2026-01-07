# AR/AP MCP Server

Model Context Protocol (MCP) server for Accounts Receivable and Accounts Payable management. Provides treasury agents with real-time AR/AP data and cash flow forecasting.

## Features

### Resources

- **`arp://ledger/summary`** - High-level summary of AR/AP position
  - Total AR and AP
  - Net position (AR - AP)
  - Overdue amounts
  - Critical items due within 7 days

- **`arp://ledger/ar`** - Full accounts receivable ledger
  - All outstanding invoices
  - Aging buckets (current, 30, 60, 90+ days)
  - Customer details

- **`arp://ledger/ap`** - Full accounts payable ledger
  - All outstanding bills
  - Aging buckets
  - Vendor details

- **`arp://cashflow/forecast`** - 30-day cash flow projection
  - Projected inflows from AR collections
  - Projected outflows from AP payments
  - Running balance forecast
  - Minimum projected balance and date

### Tools

- **`post_arp_event`** - Post AR/AP events to partner agent
  - Simulates accounting system notifications
  - Event types: invoice_issued, payment_received, bill_received, etc.
  - Priority levels for urgent items

## Configuration

Set the data directory via environment variable:

```bash
ARP_DATA_DIR=./data
```

## Data Files

The server reads from three JSON files in the data directory:

### `ar-ledger.json`
```json
[
  {
    "invoiceId": "AR-001",
    "customer": "Customer Name",
    "amount": 50000,
    "dueDate": "2026-02-15",
    "issuedDate": "2026-01-15",
    "status": "outstanding",
    "agingBucket": "current",
    "description": "Invoice description"
  }
]
```

### `ap-ledger.json`
```json
[
  {
    "invoiceId": "AP-001",
    "vendor": "Vendor Name",
    "amount": 30000,
    "dueDate": "2026-02-10",
    "receivedDate": "2026-01-10",
    "status": "outstanding",
    "agingBucket": "current",
    "description": "Bill description"
  }
]
```

### `cash-forecast.json`
```json
{
  "startDate": "2026-01-08",
  "endDate": "2026-02-07",
  "currentBalance": 125000,
  "entries": [
    {
      "date": "2026-01-15",
      "projectedInflows": 50000,
      "projectedOutflows": 30000,
      "netCashflow": 20000,
      "runningBalance": 145000
    }
  ],
  "minimumProjectedBalance": 100000,
  "minimumBalanceDate": "2026-01-20"
}
```

## Usage in Treasury Skills

Agents should read these resources to make informed treasury decisions:

```markdown
1. Read arp://ledger/summary for current position
2. Get Hedera balance
3. Calculate liquidity: Cash + AR - AP
4. Read arp://cashflow/forecast for upcoming obligations
5. Make decisions based on complete context
```

## Development

```bash
# Build
pnpm run build

# Development mode
pnpm run dev

# Type checking
pnpm run typecheck
```

## Integration

Add to agent's `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "arp": {
      "command": "node",
      "args": ["../../packages/mcp-arp/dist/index.js"],
      "env": {
        "ARP_DATA_DIR": "${UK_ARP_DATA_DIR}"
      }
    }
  }
}
```

## Architecture

```
┌─────────────────────────┐
│   Treasury Agent        │
│                         │
│  - Hedera Balance       │
│  - AR/AP Context        │
│  - Cash Forecast        │
│  - Conversation History │
└───────────┬─────────────┘
            │
            │ MCP Protocol
            ▼
┌─────────────────────────┐
│   AR/AP MCP Server      │
│                         │
│  Resources:             │
│  - ledger/summary       │
│  - ledger/ar            │
│  - ledger/ap            │
│  - cashflow/forecast    │
│                         │
│  Tools:                 │
│  - post_arp_event       │
└───────────┬─────────────┘
            │
            │ File Read
            ▼
┌─────────────────────────┐
│   Data Files            │
│                         │
│  - ar-ledger.json       │
│  - ap-ledger.json       │
│  - cash-forecast.json   │
└─────────────────────────┘
```

## Status Codes

### Invoice Status
- `outstanding` - Not yet paid, not overdue
- `paid` - Fully paid
- `overdue` - Past due date, not paid

### Aging Buckets
- `current` - Due within 30 days
- `30` - 30-59 days past issue/receipt
- `60` - 60-89 days past issue/receipt
- `90+` - 90+ days past issue/receipt
