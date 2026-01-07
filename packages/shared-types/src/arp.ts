/**
 * AR/AP (Accounts Receivable / Accounts Payable) Type Definitions
 * All amounts are in HBAR
 */

export type InvoiceStatus = "outstanding" | "paid" | "overdue";
export type AgingBucket = "current" | "30" | "60" | "90+";

/**
 * Accounts Receivable Entry
 */
export interface AREntry {
  invoiceId: string;
  customer: string;
  amount: number; // HBAR
  dueDate: string; // ISO 8601 date
  issuedDate: string; // ISO 8601 date
  status: InvoiceStatus;
  agingBucket: AgingBucket;
  description?: string;
}

/**
 * Accounts Payable Entry
 */
export interface APEntry {
  invoiceId: string;
  vendor: string;
  amount: number; // HBAR
  dueDate: string; // ISO 8601 date
  receivedDate: string; // ISO 8601 date
  status: InvoiceStatus;
  agingBucket: AgingBucket;
  description?: string;
}

/**
 * AR Ledger - Collection of all receivables
 */
export interface ARLedger {
  entries: AREntry[];
  totalOutstanding: number; // HBAR
  totalOverdue: number; // HBAR
  agingSummary: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
  };
}

/**
 * AP Ledger - Collection of all payables
 */
export interface APLedger {
  entries: APEntry[];
  totalOutstanding: number; // HBAR
  totalOverdue: number; // HBAR
  agingSummary: {
    current: number;
    days30: number;
    days60: number;
    days90Plus: number;
  };
}

/**
 * Ledger Summary - High-level view of AR/AP position
 */
export interface LedgerSummary {
  totalAR: number; // HBAR
  totalAP: number; // HBAR
  netPosition: number; // HBAR (AR - AP)
  arOverdue: number; // HBAR
  apOverdue: number; // HBAR
  criticalItemsCount: number; // Number of items due within 7 days
  lastUpdated: string; // ISO 8601 timestamp
}

/**
 * Cash Flow Forecast Entry
 */
export interface CashFlowForecastEntry {
  date: string; // ISO 8601 date
  projectedInflows: number; // HBAR - Expected AR collections
  projectedOutflows: number; // HBAR - Expected AP payments
  netCashflow: number; // HBAR - Inflows - Outflows
  runningBalance: number; // HBAR - Projected balance at end of day
}

/**
 * Cash Flow Forecast
 */
export interface CashFlowForecast {
  startDate: string; // ISO 8601 date
  endDate: string; // ISO 8601 date
  currentBalance: number; // HBAR - Starting balance
  entries: CashFlowForecastEntry[];
  minimumProjectedBalance: number; // HBAR - Lowest balance in forecast period
  minimumBalanceDate: string; // ISO 8601 date - When minimum occurs
}

/**
 * AR/AP Event - Posted to A2A inbox to notify agent
 */
export interface ARPEvent {
  eventId: string;
  eventType:
    | "invoice_issued"
    | "payment_received"
    | "invoice_overdue"
    | "payment_due_soon"
    | "bill_received"
    | "payment_made"
    | "bill_overdue"
    | "payment_upcoming";
  timestamp: string; // ISO 8601 timestamp
  entity: "AR" | "AP";
  invoiceId: string;
  amount: number; // HBAR
  description: string;
  dueDate?: string; // ISO 8601 date
  priority: "low" | "medium" | "high" | "critical";
}
