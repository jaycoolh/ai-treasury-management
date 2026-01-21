---
name: treasury-management
description: Corporate treasury operations including cash positioning, intercompany transfers, FX management, and compliance. Use when discussing treasury, cash management, or financial transfers between entities.
---

# Treasury Management

## Intercompany Transfer Workflow

When transferring funds between UK and US entities:

1. **Validate the request**
   - Confirm amount and currency
   - Check business justification
   - Verify authorized limits

2. **Check compliance requirements**
   - UK transfers >£10,000 need documented justification
   - US transfers >$10,000 need FinCEN compliance check
   - Cross-border transfers need FX documentation

3. **Communicate with partner entity**
   - Use `send_message_to_partner` MCP tool to notify partner
   - Include: amount, currency, business purpose, expected settlement date
   - Wait for partner acknowledgment before proceeding

4. **Execute transfer on Hedera blockchain**
   - Use Hedera MCP `TRANSFER_HBAR_TOOL` to execute
   - Include memo with transfer reference and business purpose
   - Confirm transaction on Hedera network

5. **Record transaction**
   - Document transaction ID from Hedera
   - Update treasury records
   - Generate compliance report if needed

## Balance Inquiry Workflow

To check treasury position:

1. **Check local balance**
   - Use Hedera MCP `GET_HBAR_BALANCE_QUERY_TOOL` for local entity balance

2. **Request partner balance** (if consolidation needed)
   - Use A2A MCP `send_message_to_partner` to request balance
   - Wait for partner response with their position

3. **Consolidate positions**
   - Calculate total treasury position across entities
   - Account for any pending transfers
   - Report consolidated view to user

## FX Management

For cross-currency transfers (GBP ↔ USD):

1. **Query current spot rate**
   - Use external FX rate source or document current market rate
   - Note: HBAR is the transfer currency on Hedera

2. **Document rate at execution**
   - Record the FX rate used for valuation
   - Calculate equivalent amounts in both currencies

3. **Calculate conversions**
   - Document HBAR equivalent amounts
   - Note any material FX gains/losses for accounting

4. **Compliance**
   - FX transactions may have additional reporting requirements
   - Document the business purpose and rate justification

## Message Templates

### Transfer Notification to Partner

```
Initiating transfer: [AMOUNT] HBAR for [PURPOSE].
Expected settlement: [DATE].
Please confirm receipt capability and account readiness.
Reference: [REFERENCE_ID]
```

### Transfer Confirmation

```
Transfer confirmed received: [AMOUNT] HBAR.
Transaction ID: [HEDERA_TX_ID]
Balance updated. Current balance: [NEW_BALANCE] HBAR.
Reference: [REFERENCE_ID]
```

### Balance Inquiry Request

```
Balance inquiry request for treasury position consolidation.
Please provide current HBAR balance and any pending transfers.
```

### Balance Response

```
Current balance: [BALANCE] HBAR
Pending incoming: [PENDING_IN] HBAR
Pending outgoing: [PENDING_OUT] HBAR
As of: [TIMESTAMP]
```

## Compliance Thresholds

### UK Entity
- Transfers >£10,000 equivalent: Requires business justification
- Transfers >£100,000 equivalent: Requires CFO approval
- All cross-border: Document FX rates and business purpose

### US Entity
- Transfers >$10,000 equivalent: FinCEN reporting required
- Transfers >$100,000 equivalent: Additional audit trail needed
- All cross-border: Enhanced due diligence required

## Error Handling

If transfer fails:
1. Document the failure reason
2. Notify partner agent of failure via A2A
3. Check Hedera transaction status
4. Retry if transient error, or escalate to user

If partner agent doesn't respond:
1. Wait reasonable timeout (e.g., 30 seconds)
2. Retry message once
3. If still no response, alert user and await manual intervention

## Cash Sweeping

Sweeping moves excess cash to a designated sweep account when balance exceeds operating needs.

### When to Evaluate Sweeping

Evaluate sweeping on **any incoming financial event**:
- AP invoice notifications
- AR payment receipts
- Balance updates
- Partner transfer completions

### Sweep Decision Process

1. **Check current HBAR balance**
   - Use Hedera MCP `GET_HBAR_BALANCE_QUERY_TOOL`

2. **Check outstanding obligations**
   - Query AR/AP for upcoming payables
   - Consider any pending transfers

3. **Calculate available surplus**
   - Surplus = Current Balance - Operating Buffer - Upcoming Obligations
   - Operating Buffer: 500 HBAR (minimum to maintain for operations)

4. **Execute sweep if surplus exists**
   - If surplus > 0, transfer surplus to sweep account
   - Use Hedera MCP `TRANSFER_HBAR_TOOL`
   - Sweep account is configured per entity (see environment config)
   - Include memo: "SWEEP: [DATE] excess funds"

### Sweep Configuration

Each entity has a designated sweep account configured via environment:
- UK: `UK_SWEEP_ACCOUNT_ID`
- US: `US_SWEEP_ACCOUNT_ID`

### Sweep Message Template

```
Executing cash sweep: [AMOUNT] HBAR to sweep account [ACCOUNT_ID].
Reason: Balance [CURRENT] exceeds operating buffer [BUFFER] + obligations [OBLIGATIONS].
Surplus calculated: [SURPLUS] HBAR.
```

### Post-Sweep Actions

1. Confirm transaction on Hedera
2. Log sweep details for audit
3. Notify partner if relevant to consolidated position

## Audit Trail

All transactions must record:
- Timestamp
- Initiating entity
- Receiving entity
- Amount and currency
- Business purpose
- Hedera transaction ID
- Approval status (if applicable)
- FX rate (if cross-currency)
