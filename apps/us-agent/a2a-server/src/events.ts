import type { Response } from "express";
import { config } from "./config.js";

export type AgentEventKind =
  | "message_received"
  | "assistant_update"
  | "tool_use"
  | "result"
  | "partner_message"
  | "response_sent"
  | "error"
  | "log";

export type AgentEvent = {
  id: string;
  timestamp: string;
  agent: "UK" | "US";
  kind: AgentEventKind;
  contextId?: string;
  taskId?: string;
  sender?: string;
  text?: string;
  data?: Record<string, unknown>;
};

type PartialAgentEvent = Omit<AgentEvent, "id" | "timestamp" | "agent"> & {
  id?: string;
  timestamp?: string;
  agent?: AgentEvent["agent"];
};

const MAX_EVENTS = 500;
const debugEnabled = process.env.EVENT_DEBUG === "1";
// Keep a rolling buffer for UI bootstrap and history.
const recentEvents: AgentEvent[] = [];
const clients = new Set<Response>();

const normalizeText = (
  value?: string,
  maxLength = 240,
  preserveNewlines = false,
): string | undefined => {
  if (!value) return undefined;
  const cleaned = preserveNewlines
    ? value.replace(/\r\n/g, "\n").trim()
    : value.replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 3)}...`;
};

const maxLengthForKind = (kind: AgentEventKind) => {
  if (
    kind === "assistant_update" ||
    kind === "result" ||
    kind === "partner_message"
  ) {
    return 8000;
  }
  return 240;
};

const preserveNewlinesForKind = (kind: AgentEventKind) =>
  kind === "assistant_update" ||
  kind === "result" ||
  kind === "partner_message";

export const recordEvent = (event: PartialAgentEvent): AgentEvent => {
  const normalized: AgentEvent = {
    id: event.id ?? crypto.randomUUID(),
    timestamp: event.timestamp ?? new Date().toISOString(),
    agent: event.agent ?? config.entity,
    kind: event.kind,
    contextId: event.contextId,
    taskId: event.taskId,
    sender: event.sender,
    text: normalizeText(
      event.text,
      maxLengthForKind(event.kind),
      preserveNewlinesForKind(event.kind),
    ),
    data: event.data,
  };

  recentEvents.push(normalized);
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.splice(0, recentEvents.length - MAX_EVENTS);
  }

  const payload = `event: log\ndata: ${JSON.stringify(normalized)}\n\n`;
  clients.forEach((client) => {
    client.write(payload);
  });

  if (debugEnabled) {
    console.log(
      `[events] ${normalized.kind} -> ${clients.size} client(s) (${recentEvents.length} total)`
    );
  }

  return normalized;
};

export const getRecentEvents = (limit = 200): AgentEvent[] => {
  if (limit <= 0) return [];
  return recentEvents.slice(-Math.min(limit, MAX_EVENTS));
};

export const addSseClient = (res: Response) => {
  clients.add(res);
  if (debugEnabled) {
    console.log(`[events] SSE client connected (${clients.size} total)`);
  }
};

export const removeSseClient = (res: Response) => {
  clients.delete(res);
  if (debugEnabled) {
    console.log(`[events] SSE client disconnected (${clients.size} total)`);
  }
};

export const summarizeAssistantUpdate = (): string =>
  "Agent is evaluating the request.";

export const getEventStats = () => ({
  totalEvents: recentEvents.length,
  connectedClients: clients.size,
});
