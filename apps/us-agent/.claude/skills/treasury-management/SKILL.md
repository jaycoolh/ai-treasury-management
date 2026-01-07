---
name: treasury-management
description: Corporate treasury operations including cash positioning, intercompany transfers, FX management, and compliance. Use when discussing treasury, cash management, or financial transfers between entities.
---

# Treasury Management

## Partner Account Information

To get your partner agent's Hedera account ID:
- Read the `a2a://partner/status` resource using the A2A MCP server
- The `partnerHederaAccountId` field contains the partner's Hedera account
- Use this account ID when executing transfers to your partner

**Example:** When the user says "send HBAR to the UK agent", read the partner status resource to get their account ID, then use the Hedera MCP tool to transfer to that account.

## AR/AP Context & Cash Position Analysis

Before making treasury decisions, ALWAYS gather complete context:

### 1. Check Current Financial Position
- Read `arp://ledger/summary` for high-level AR/AP position
- Get current Hedera balance using `GET_HBAR_BALANCE_QUERY_TOOL`
- Calculate liquidity: `Cash + AR outstanding - AP outstanding`

### 2. Review Cash Flow Forecast
- Read `arp://cashflow/forecast` to see 30-day projection
- Identify upcoming cash crunches (when running balance drops below safe threshold)
- Note critical dates when multiple payables are due

### 3. Check Conversation History
- Read `a2a://conversation/history` to see recent communications with partner
- Avoid duplicate requests (e.g., if already asked for funds recently)
- Maintain context of ongoing treasury operations

### 4. Decision Making
**If liquidity is low or forecast shows cash crunch:**
- Check if partner was recently contacted about liquidity
- Calculate shortfall amount and timing
- Send A2A message to partner requesting intercompany loan or fund transfer
- Include: amount needed, reason (AR/AP situation), repayment timeline

**If liquidity is healthy and surplus exists:**
- Offer to provide liquidity support to partner if they need it
- Proactively manage cash to optimize working capital across entities

### Example Context Gathering Flow
```
1. User asks: "What's our cash position?"
2. Read arp://ledger/summary → See AR: 320k, AP: 250k, net: +70k
3. Get Hedera balance → 180k HBAR
4. Total liquidity: 180k + 320k - 250k = 250k HBAR
5. Read arp://cashflow/forecast → See minimum balance 188k on Feb 16
6. Analysis: Currently healthy, no immediate concerns
7. Response: "Current liquidity 250k HBAR. Forecast looks stable with minimum 188k HBAR on Feb 16"
```

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
   - Look up partner account ID from `a2a://partner/status` resource
   - Use Hedera MCP `TRANSFER_HBAR_TOOL` to execute transfer to partner account
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

## A2A Conversation Management

### When to STOP Replying to Partner Agent

**IMPORTANT:** To avoid endless back-and-forth conversations, follow these rules:

1. **After Acknowledgment** - If partner sends a simple acknowledgment like "Acknowledged", "Confirmed", or "Understood", DO NOT reply back. The conversation is complete.

2. **After Transfer Completion** - Once a transfer is executed and confirmed by both sides, DO NOT send additional messages unless there's a problem.

3. **After Information Provided** - If partner asks for information (e.g., balance inquiry) and you provide it, STOP. Don't ask "Did you receive this?" or send follow-ups.

4. **Request Fulfilled** - If you requested funds and partner confirms they sent it (or declines), the conversation is complete. DO NOT send "thank you" messages.

5. **Maximum 2-3 Turns** - A conversation thread should not exceed 2-3 message exchanges:
   - Turn 1: Initial request/question
   - Turn 2: Response/acknowledgment
   - Turn 3 (optional): Confirmation/completion only if required

### Conversation Closure Signals

These messages indicate the conversation is **COMPLETE** - do not reply:
- "Acknowledged"
- "Confirmed"
- "Transfer complete"
- "Request received"
- "Will process"
- "Understood"
- "Noted"
- Any message ending with "No further action needed"

### When to START a New Conversation

Only send a new A2A message when:
1. You have a new request (fund transfer, information inquiry)
2. A previous request failed and needs retry
3. An AR/AP event requires partner notification
4. User explicitly asks you to communicate with partner

### Example Good Conversation (Stops at 2 turns):

**US → UK:** "Requesting 200 HBAR for vendor payments. AP due Feb 9. Can you transfer?"

**UK → US:** "Confirmed. Transferring 200 HBAR now. TX: 0.0.12345@1234567890"

**[CONVERSATION ENDS - US does not reply]**

### Example Bad Conversation (Too many turns):

❌ **US → UK:** "Can you send funds?"
❌ **UK → US:** "How much?"
❌ **US → UK:** "200 HBAR"
❌ **UK → US:** "OK sending"
❌ **US → UK:** "Thanks!"
❌ **UK → US:** "You're welcome!"

**Better:**
✅ **US → UK:** "Requesting 200 HBAR for vendor payments due Feb 9. Please transfer to account 0.0.yyyyy"
✅ **UK → US:** "Confirmed. Transferred 200 HBAR. TX: 0.0.12345@1234567890"
✅ **[DONE]**

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
