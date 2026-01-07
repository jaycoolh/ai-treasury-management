---
name: uk-compliance
description: UK financial regulations, FCA requirements, and reporting thresholds for treasury operations. Use when validating transfers or generating compliance reports for UK entity.
---

# UK Treasury Compliance

## Overview

This skill ensures treasury operations comply with UK financial regulations including FCA (Financial Conduct Authority) requirements and UK tax law.

## Transfer Validation Rules

Before executing any transfer, validate against these thresholds:

### Documentation Thresholds

- **£10,000+**: Requires documented business justification
- **£50,000+**: Requires additional supporting documentation (invoices, contracts, etc.)
- **£100,000+**: Requires CFO or Finance Director approval

### Cross-Border Transfers

All cross-border transfers require:
1. Documented business purpose
2. FX rate documentation (source and timestamp)
3. Appropriate accounting treatment noted

### Suspicious Activity

Report to compliance officer if:
- Transfer patterns are unusual for business operations
- Lack of clear business justification
- Frequent round-trip transfers
- Amounts just below reporting thresholds

## FCA Requirements

### Record Keeping

Maintain records for minimum 7 years:
- Transaction date and amount
- Parties involved (sender and recipient)
- Business purpose
- Supporting documentation
- Approvals obtained

### Audit Trail

Every transaction must have:
- Unique reference number
- Timestamp (with timezone)
- Initiator identity
- Approver identity (if required)
- Hedera transaction ID

## Tax Considerations

### VAT

For service-related transfers:
- Document whether VAT applies
- If reverse charge applies, note for accounting
- Keep records of VAT treatment

### Corporation Tax

- Document if transfer relates to deductible business expense
- Note accounting period for the transaction
- Flag any capital vs revenue considerations

## Approval Workflow

### Standard Transfers (< £100,000)

1. Treasury officer initiates
2. Automated compliance checks
3. Execute if all checks pass

### Large Transfers (£100,000+)

1. Treasury officer initiates
2. Automated compliance checks
3. CFO/Finance Director approval required
4. Execute after approval

### International Transfers

1. Treasury officer initiates
2. Automated compliance checks
3. FX documentation review
4. Additional approval for large amounts
5. Execute after all approvals

## Reporting Requirements

### Monthly Reports

Generate monthly treasury report including:
- Total transfer volume
- Number of transfers by category
- FX gains/losses
- Compliance exceptions (if any)

### Annual Reports

Include in annual financial statements:
- Total cross-border transfer volume
- FX exposure summary
- Material FX gains/losses

## Compliance Checks

Run these checks before each transfer:

```
1. Amount validation
   - Is amount within authorized limits?
   - Does it require additional approval?

2. Documentation check
   - Is business purpose documented?
   - Are supporting documents attached (if required)?
   - Is FX rate documented (if cross-currency)?

3. Approval verification
   - Does transfer require approval?
   - Has approval been obtained?
   - Is approval still valid?

4. Sanctions screening
   - Is recipient on any sanctions list?
   - Are there country-specific restrictions?

5. Audit trail
   - Is transaction properly logged?
   - Are all fields captured?
   - Is reference number assigned?
```

## Message Templates

### Approval Request

```
Approval required for transfer:
Amount: £[AMOUNT]
To: [RECIPIENT_ENTITY]
Purpose: [BUSINESS_JUSTIFICATION]
FX Rate: [RATE] (if applicable)
Reference: [REFERENCE_ID]

Please approve or reject.
```

### Compliance Exception

```
Compliance exception detected:
Issue: [ISSUE_DESCRIPTION]
Transfer: [REFERENCE_ID]
Amount: £[AMOUNT]
Recommendation: [RECOMMENDED_ACTION]
```

## Integration with Treasury Management

This skill works together with the treasury-management skill:

1. Treasury-management defines the workflow
2. UK-compliance validates each step
3. Only compliant operations proceed
4. Exceptions are flagged for review

## Escalation

Escalate to compliance officer if:
- Transfer fails multiple validation checks
- Unusual pattern detected
- Sanctions screening concern
- Documentation incomplete and cannot be resolved

Contact: compliance@uk-entity.example.com
