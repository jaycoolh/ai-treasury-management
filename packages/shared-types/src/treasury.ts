/**
 * Treasury-related type definitions
 */

export type Currency = 'HBAR' | 'USD' | 'GBP';

export type Entity = 'UK' | 'US';

export interface TransferRequest {
  from: Entity;
  to: Entity;
  amount: number;
  currency: Currency;
  memo: string;
  businessJustification?: string;
  expectedSettlementDate?: string;
}

export interface TransferResponse {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  confirmationMessage: string;
}

export interface BalanceInquiry {
  entity: Entity;
  currency: Currency;
}

export interface BalanceResponse {
  entity: Entity;
  currency: Currency;
  balance: number;
  timestamp: string;
}

export interface ComplianceCheck {
  entity: Entity;
  transferAmount: number;
  currency: Currency;
  requiresApproval: boolean;
  requiresDocumentation: boolean;
  thresholds: {
    documentationRequired: number;
    approvalRequired: number;
  };
}

export interface FXRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: string;
  source: string;
}

export interface TreasuryPosition {
  entity: Entity;
  balances: Array<{
    currency: Currency;
    amount: number;
  }>;
  pendingTransfers: TransferRequest[];
  timestamp: string;
}
