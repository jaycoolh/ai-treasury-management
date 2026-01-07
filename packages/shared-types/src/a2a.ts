/**
 * A2A (Agent-to-Agent) protocol type definitions
 */

export interface A2AMessage {
  timestamp: number;
  from: string;
  contextId: string;
  taskId: string;
  message: string;
  metadata?: {
    sender?: string;
    [key: string]: any;
  };
  raw: any;
}

export interface A2AMessageFile {
  timestamp: number;
  from: string;
  contextId: string;
  taskId: string;
  message: string;
  raw: any;
}

export interface SendMessageParams {
  message: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
}

export interface CheckMessagesParams {
  mark_as_read?: boolean;
}

export interface CheckMessagesResult {
  messages: A2AMessage[];
  count: number;
}
