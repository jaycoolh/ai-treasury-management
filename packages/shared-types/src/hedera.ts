/**
 * Hedera blockchain type definitions
 */

export type HederaNetwork = 'mainnet' | 'testnet';

export interface HederaAccountInfo {
  accountId: string;
  balance: number;
  publicKey: string;
}

export interface HederaTransferParams {
  to: string;
  amount: number;
  memo?: string;
}

export interface HederaTransferResult {
  transactionId: string;
  status: string;
  consensusTimestamp?: string;
  receipt?: any;
}

export interface HederaBalanceParams {
  accountId: string;
}

export interface HederaBalanceResult {
  accountId: string;
  balance: number;
  tokens?: Array<{
    tokenId: string;
    balance: number;
  }>;
}

export interface HederaTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
}

export interface HederaTokenResult {
  tokenId: string;
  transactionId: string;
  status: string;
}
