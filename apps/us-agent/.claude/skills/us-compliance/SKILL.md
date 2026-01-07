---
name: us-compliance
description: US financial regulations including FinCEN reporting requirements, BSA/AML compliance, and US tax considerations for treasury operations. Use when validating transfers or generating compliance reports for US entity.
---

# US Treasury Compliance

## Overview

This skill ensures treasury operations comply with US financial regulations including FinCEN (Financial Crimes Enforcement Network) requirements, Bank Secrecy Act (BSA), Anti-Money Laundering (AML) rules, and US tax law.

## Transfer Validation Rules

Before executing any transfer, validate against these thresholds:

### FinCEN Reporting Thresholds

- **$10,000+**: Required reporting to FinCEN (Currency Transaction Report - CTR)
- **$3,000+**: Recordkeeping requirements under BSA
- **$100,000+**: Enhanced due diligence and senior management approval

### Cross-Border Transfers

All international transfers require:
1. OFAC (Office of Foreign Assets Control) sanctions screening
2. Documented business purpose
3. Beneficial ownership information (if applicable)
4. FX rate documentation

### Suspicious Activity

Report to BSA/AML officer immediately if:
- Structuring suspected (multiple transfers to avoid $10,000 threshold)
- Unusual patterns inconsistent with business activity
- Transactions with high-risk jurisdictions
- Lack of clear business justification

## FinCEN Requirements

### Currency Transaction Reports (CTR)

File CTR for:
- Single transactions >$10,000
- Multiple related transactions >$10,000 in one business day

CTR must include:
- Transaction date and amount
- Account information
- Business purpose
- Identity verification

### Suspicious Activity Reports (SAR)

File SAR within 30 days if:
- Transaction involves $5,000+ and suspicious activity
- Potential money laundering or terrorist financing
- Structuring or evasion of BSA requirements

### Record Keeping

Maintain records for minimum 5 years:
- All transactions >$3,000
- Wire transfers (domestic and international)
- Supporting documentation
- Identity verification records

## OFAC Sanctions Screening

Before each transfer, screen for:

```
1. Recipient name against SDN list
   - Specially Designated Nationals and Blocked Persons
   - Consolidated sanctions list

2. Country restrictions
   - Comprehensive embargoes (e.g., Cuba, Iran, North Korea, Syria)
   - Sectoral sanctions

3. Entity screening
   - 50% rule for blocked entities
   - Indirect ownership structures
```

**CRITICAL**: Any OFAC match requires immediate halt and escalation to compliance.

## Approval Workflow

### Standard Transfers (< $100,000)

1. Treasury officer initiates
2. Automated compliance checks (OFAC, FinCEN thresholds)
3. Execute if all checks pass
4. File required reports

### Large Transfers ($100,000+)

1. Treasury officer initiates
2. Enhanced due diligence
3. OFAC screening
4. CFO or Treasurer approval required
5. Execute after approval
6. File required reports

### International Transfers

1. Treasury officer initiates
2. OFAC sanctions screening (CRITICAL)
3. Enhanced due diligence
4. FinCEN requirements check
5. Additional approval for large amounts
6. Execute after all approvals
7. File required reports (CTR, FBAR if applicable)

## Tax Considerations

### Form 1099 Reporting

For payments to vendors/contractors:
- Track if cumulative payments exceed $600
- Collect W-9 forms
- Prepare 1099-MISC or 1099-NEC

### Foreign Bank Account Reporting (FBAR)

If foreign account balance >$10,000:
- File FinCEN Form 114 annually
- Due April 15 (automatic extension to October 15)
- Includes Hedera accounts held outside US

### Corporate Tax

- Document business purpose for tax deductibility
- Track capital vs operating expenditures
- Note accounting period for transactions

## Compliance Checks

Run these checks before each transfer:

```
1. Amount validation
   - FinCEN threshold check ($10,000 CTR)
   - Does it require enhanced due diligence?
   - Approval requirements met?

2. OFAC sanctions screening (CRITICAL)
   - Recipient not on SDN list
   - No country restrictions
   - Entity screening passed

3. BSA/AML checks
   - Pattern analysis for structuring
   - Business purpose documented
   - Unusual activity flags

4. Documentation
   - Business justification recorded
   - Supporting documents attached
   - FX rate documented (if cross-currency)

5. Approval verification
   - Required approvals obtained
   - Approver authority verified

6. Audit trail
   - Transaction properly logged
   - All fields captured
   - Reference number assigned
```

## Reporting Requirements

### Daily Reports

- CTR filings for transactions >$10,000
- OFAC screening results
- Large transaction summaries

### Monthly Reports

Generate monthly treasury report including:
- Total transfer volume by category
- FinCEN filings summary
- OFAC screening statistics
- Compliance exceptions

### Annual Reports

- FBAR filing (if applicable)
- Form 1099 series
- BSA/AML program review
- Audit findings and remediation

## Message Templates

### OFAC Alert

```
🚨 OFAC SANCTIONS ALERT 🚨
Transfer BLOCKED - Requires immediate review

Match Type: [SDN_LIST / COUNTRY / ENTITY]
Recipient: [NAME]
Amount: $[AMOUNT]
Reference: [REFERENCE_ID]

DO NOT PROCEED - Escalate to compliance immediately.
Contact: compliance@us-entity.example.com
```

### FinCEN CTR Notification

```
FinCEN CTR Filing Required

Transaction: [REFERENCE_ID]
Amount: $[AMOUNT]
Date: [DATE]
Status: [FILED / PENDING]

CTR must be filed within 15 days.
```

### Enhanced Due Diligence

```
Enhanced Due Diligence Required

Transfer: [REFERENCE_ID]
Amount: $[AMOUNT]
Reason: [LARGE_AMOUNT / HIGH_RISK_JURISDICTION / OTHER]

Required documentation:
- [ ] Business justification
- [ ] Beneficial ownership
- [ ] Source of funds
- [ ] CFO approval

Deadline: [DATE]
```

## Integration with Treasury Management

This skill works together with the treasury-management skill:

1. Treasury-management defines the workflow
2. US-compliance validates each step
3. OFAC screening is mandatory (cannot be skipped)
4. FinCEN requirements automatically checked
5. Only compliant operations proceed

## Escalation

Escalate immediately to BSA/AML officer if:
- OFAC match detected
- SAR filing may be required
- Structuring suspected
- High-risk jurisdiction involved
- Documentation cannot be obtained

**Emergency Contact**: compliance@us-entity.example.com
**Phone**: 1-555-COMPLY-1

## Penalties for Non-Compliance

Violations can result in:
- Civil penalties up to $250,000 per violation
- Criminal penalties including imprisonment
- Reputational damage
- License revocation

**CRITICAL**: When in doubt, STOP and escalate. False positives are acceptable; false negatives are not.
