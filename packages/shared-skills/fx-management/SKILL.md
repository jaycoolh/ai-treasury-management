---
name: fx-management
description: Foreign exchange rate handling, currency conversion, and FX documentation for cross-border transfers. Use when dealing with GBP/USD conversions or FX reporting.
---

# FX Management

## Overview

This skill handles foreign exchange (FX) conversions between GBP and USD for treasury operations on the Hedera blockchain. Since Hedera transfers use HBAR, this skill focuses on valuation and reporting.

## FX Rate Documentation

For all cross-currency operations:

1. **Document the spot rate**
   - Record current GBP/USD rate at time of transfer
   - Source: Market rate from reputable FX provider
   - Example: "1 GBP = 1.2750 USD"

2. **Calculate HBAR equivalents**
   - Document HBAR/GBP and HBAR/USD rates
   - Use for valuation purposes
   - Example: "1 HBAR = 0.05 USD = 0.0392 GBP"

3. **Record timestamp**
   - Note exact time of rate capture
   - Include timezone
   - Required for compliance and audit

## Conversion Calculations

### GBP to USD Conversion

```
Amount_USD = Amount_GBP × GBP_USD_Rate
```

Example:
- Transfer value: £50,000 GBP
- FX Rate: 1.2750 GBP/USD
- USD equivalent: $63,750

### HBAR Valuation

```
HBAR_Amount_GBP = HBAR_Count × HBAR_GBP_Rate
HBAR_Amount_USD = HBAR_Count × HBAR_USD_Rate
```

Example:
- Transfer: 50,000 HBAR
- HBAR/USD: $0.05
- HBAR/GBP: £0.0392
- USD value: $2,500
- GBP value: £1,960

## FX Gain/Loss Calculation

For accounting purposes, document FX gains or losses:

```
FX_Gain_Loss = (Settlement_Rate - Booking_Rate) × Amount
```

Example:
- Booked at: 1.2700 GBP/USD
- Settled at: 1.2750 GBP/USD
- Amount: £50,000
- FX Gain: (1.2750 - 1.2700) × 50,000 = $250 gain
```

## Compliance Documentation

### Required Documentation

For each cross-currency transfer, record:

1. **Rate Information**
   - FX rate used
   - Rate source
   - Timestamp of rate
   - Rate type (spot, forward, etc.)

2. **Amounts**
   - Original currency amount
   - Converted currency amount
   - HBAR amount transferred

3. **Business Purpose**
   - Reason for transfer
   - Accounting treatment
   - Cost center or project code

### Reporting Thresholds

**UK Requirements:**
- Transfers >£10,000: Document FX rate and source
- Transfers >£100,000: Enhanced FX documentation
- Material FX gains/losses (>£5,000): Report to finance

**US Requirements:**
- Transfers >$10,000: FX documentation required
- Transfers >$100,000: Enhanced due diligence
- Material FX gains/losses (>$5,000): Report to finance

## FX Rate Sources

Acceptable sources for FX rates:

1. **Bloomberg Terminal** - Institutional standard
2. **Reuters** - Real-time market rates
3. **Central Bank Rates** - BoE or Federal Reserve
4. **Major FX Platforms** - OANDA, XE.com (for reference)

Always document the source used.

## Message Template for FX Documentation

When communicating FX-related transfers:

```
Transfer Details:
Amount: [HBAR_AMOUNT] HBAR
GBP Value: £[GBP_AMOUNT] @ [HBAR_GBP_RATE]
USD Value: $[USD_AMOUNT] @ [HBAR_USD_RATE]
FX Rate: 1 GBP = [GBP_USD_RATE] USD
Rate Source: [SOURCE]
Timestamp: [ISO_TIMESTAMP]
Purpose: [BUSINESS_PURPOSE]
```

## Best Practices

1. **Capture rates immediately** before transfer execution
2. **Use consistent sources** for all FX rate documentation
3. **Document material movements** (>5% from budget rate)
4. **Alert on volatility** if rate moves significantly
5. **Maintain audit trail** of all FX-related decisions

## Error Scenarios

### Rate Unavailable
- Use last known good rate
- Document as "estimated pending confirmation"
- Update when official rate available

### Significant Rate Movement
- If rate moves >2% from expected, alert user
- Recommend re-evaluation of transfer timing
- Document decision to proceed or defer

### Conversion Errors
- Always validate calculations
- Cross-check with alternative source
- Document any discrepancies
