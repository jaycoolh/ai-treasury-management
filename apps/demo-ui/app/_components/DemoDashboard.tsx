"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AgentId = "UK" | "US";
type AgentEventKind =
  | "message_received"
  | "assistant_update"
  | "tool_use"
  | "result"
  | "partner_message"
  | "response_sent"
  | "error"
  | "log";

type AgentEvent = {
  id: string;
  timestamp: string;
  agent: AgentId;
  kind: AgentEventKind;
  contextId?: string;
  taskId?: string;
  sender?: string;
  text?: string;
  data?: Record<string, unknown>;
};

type StreamStatus = "connecting" | "open" | "error";

type StreamDebug = {
  lastEventType: string;
  lastEventAt: string;
  lastRaw: string;
  lastError: string;
  lastRecentCount: number;
  lastAddedCount: number;
  currentEventCount: number;
};

const KIND_LABELS: Record<AgentEventKind, string> = {
  message_received: "Message received",
  assistant_update: "Reasoning",
  tool_use: "Tool call",
  result: "Analysis",
  partner_message: "Message sent",
  response_sent: "Response sent",
  error: "Error",
  log: "Log line",
};

const PRESET_TRIGGERS = [
  {
    title: "Invoice due: 50 HBAR",
    detail: "Software license payment",
    message: "AP INVOICE: 50 HBAR due for software license",
    target: "UK" as AgentId,
  },
  {
    title: "Invoice due: 1000 HBAR",
    detail: "Large vendor invoice due ASAP",
    message:
      "NEW AP INVOICE: 1000 HBAR due for hardware supplier ASAP. Account ID to transfer to: 0.0.5115129",
    target: "US" as AgentId,
  },
  {
    title: "Cash surplus: 5000 HBAR",
    detail: "Evaluate yield-bearing options",
    message: "CASH SURPLUS: 5000 HBAR above target threshold",
    target: "US" as AgentId,
  },
  {
    title: "Payroll run: 12000 HBAR",
    detail: "Upcoming payroll cycle",
    message: "PAYROLL RUN: 12000 HBAR scheduled next week",
    target: "UK" as AgentId,
  },
];

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const sortByTimestamp = (events: AgentEvent[]) =>
  [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

const byNewest = (events: AgentEvent[]) =>
  [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

const DISPLAY_KINDS: AgentEventKind[] = [
  "assistant_update",
  "result",
  "tool_use",
  "partner_message",
];

const truncate = (value?: string, max = 160) => {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const formatInline = (value: string) => {
  return value
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
};

const renderMarkdown = (value?: string) => {
  if (!value) return "";
  const escaped = escapeHtml(value);
  const lines = escaped.split(/\r?\n/);
  const chunks: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      chunks.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        chunks.push("<ul>");
        inList = true;
      }
      chunks.push(`<li>${formatInline(line.slice(2))}</li>`);
      continue;
    }

    closeList();

    if (line.startsWith("### ")) {
      chunks.push(`<h4>${formatInline(line.slice(4))}</h4>`);
    } else if (line.startsWith("## ")) {
      chunks.push(`<h3>${formatInline(line.slice(3))}</h3>`);
    } else if (line.startsWith("# ")) {
      chunks.push(`<h2>${formatInline(line.slice(2))}</h2>`);
    } else {
      chunks.push(`<p>${formatInline(line)}</p>`);
    }
  }

  closeList();
  return chunks.join("");
};

const useAgentStream = (baseUrl: string, agent: AgentId) => {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("connecting");
  const [debug, setDebug] = useState<StreamDebug>({
    lastEventType: "none",
    lastEventAt: "--",
    lastRaw: "",
    lastError: "",
    lastRecentCount: 0,
    lastAddedCount: 0,
    currentEventCount: 0,
  });
  const eventMapRef = useRef<Map<string, AgentEvent>>(new Map());

  useEffect(() => {
    let isActive = true;

    const addEvents = (incoming: AgentEvent[] | AgentEvent) => {
      const array = Array.isArray(incoming) ? incoming : [incoming];
      if (!array.length) return;
      let addedCount = 0;
      const nextMap = new Map(eventMapRef.current);
      for (const event of array) {
        if (!event?.id) continue;
        const resolved = {
          ...event,
          agent: event.agent || agent,
        } as AgentEvent;
        nextMap.set(resolved.id, resolved);
        addedCount += 1;
      }
      const sorted = sortByTimestamp(Array.from(nextMap.values())).slice(-400);
      eventMapRef.current = new Map(sorted.map((item) => [item.id, item]));
      setEvents(sorted);
      setDebug((prev) => ({
        ...prev,
        lastAddedCount: addedCount,
        currentEventCount: sorted.length,
      }));
    };

    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const loadRecent = async () => {
      try {
        const response = await fetch(`${baseUrl}/events/recent?limit=200`);
        if (!response.ok) throw new Error("Failed to fetch recent events");
        const data: AgentEvent[] = await response.json();
        setDebug((prev) => ({
          ...prev,
          lastRecentCount: data.length,
        }));
        addEvents(data);
      } catch (error) {
        if (isActive) {
          setStatus("error");
          setDebug((prev) => ({
            ...prev,
            lastError: "Failed to fetch recent events.",
          }));
        }
      }
    };

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(loadRecent, 5000);
    };

    const stopPolling = () => {
      if (!pollTimer) return;
      clearInterval(pollTimer);
      pollTimer = null;
    };

    loadRecent();
    startPolling();

    // Keep a live SSE connection for agent events.
    const source = new EventSource(`${baseUrl}/events`);
    source.addEventListener("log", (event) => {
      try {
        const raw = (event as MessageEvent).data;
        const data = JSON.parse(raw) as AgentEvent;
        setDebug((prev) => ({
          ...prev,
          lastEventType: "log",
          lastEventAt: new Date().toLocaleTimeString(),
          lastRaw: raw.slice(0, 500),
          lastError: "",
        }));
        addEvents([data]);
      } catch (error) {
        setDebug((prev) => ({
          ...prev,
          lastError: "Failed to parse log event payload.",
        }));
      }
    });
    source.addEventListener("bootstrap", (event) => {
      try {
        const raw = (event as MessageEvent).data;
        const data = JSON.parse(raw) as AgentEvent[];
        setDebug((prev) => ({
          ...prev,
          lastEventType: "bootstrap",
          lastEventAt: new Date().toLocaleTimeString(),
          lastRaw: raw.slice(0, 500),
          lastError: "",
        }));
        addEvents(data);
      } catch (error) {
        setDebug((prev) => ({
          ...prev,
          lastError: "Failed to parse bootstrap payload.",
        }));
      }
    });
    source.onmessage = (event) => {
      setDebug((prev) => ({
        ...prev,
        lastEventType: "message",
        lastEventAt: new Date().toLocaleTimeString(),
        lastRaw: event.data.slice(0, 500),
      }));
    };
    source.onopen = () => {
      setStatus("open");
      setDebug((prev) => ({
        ...prev,
        lastError: "",
      }));
    };
    source.onerror = () => {
      if (isActive) setStatus("error");
      setDebug((prev) => ({
        ...prev,
        lastError: "EventSource error.",
      }));
    };

    return () => {
      isActive = false;
      stopPolling();
      source.close();
    };
  }, [baseUrl, agent]);

  return { events, status, debug };
};

const sendTrigger = async (baseUrl: string, message: string) => {
  // A2A JSON-RPC payload for message/send.
  const payload = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "message/send",
    params: {
      message: {
        messageId: crypto.randomUUID(),
        role: "user",
        parts: [{ kind: "text", text: message }],
        kind: "message",
        metadata: { sender: "arp-system" },
      },
    },
  };

  const response = await fetch(`${baseUrl}/a2a/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to send trigger");
  }
};

export default function DemoDashboard() {
  const ukUrl = process.env.NEXT_PUBLIC_UK_AGENT_URL || "http://localhost:4000";
  const usUrl = process.env.NEXT_PUBLIC_US_AGENT_URL || "http://localhost:5001";
  const {
    events: ukEvents,
    status: ukStatus,
    debug: ukDebug,
  } = useAgentStream(ukUrl, "UK");
  const {
    events: usEvents,
    status: usStatus,
    debug: usDebug,
  } = useAgentStream(usUrl, "US");
  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    setDebugEnabled(window.location.search.includes("debug=1"));
  }, []);

  const [customMessage, setCustomMessage] = useState("");
  const [customTarget, setCustomTarget] = useState<AgentId>("UK");
  const [sendStatus, setSendStatus] = useState<string>("");

  const filteredUk = useMemo(
    () => ukEvents.filter((event) => DISPLAY_KINDS.includes(event.kind)),
    [ukEvents],
  );
  const filteredUs = useMemo(
    () => usEvents.filter((event) => DISPLAY_KINDS.includes(event.kind)),
    [usEvents],
  );
  const allEvents = useMemo(
    () => sortByTimestamp([...filteredUk, ...filteredUs]),
    [filteredUk, filteredUs],
  );

  const recentUk = useMemo(
    () => byNewest(filteredUk).slice(0, 20),
    [filteredUk],
  );
  const recentUs = useMemo(
    () => byNewest(filteredUs).slice(0, 20),
    [filteredUs],
  );

  const flowEvents = useMemo(
    () =>
      byNewest(
        allEvents.filter((event) => event.kind === "partner_message"),
      ).slice(0, 8),
    [allEvents],
  );

  const handleSend = async (target: AgentId, message: string) => {
    const baseUrl = target === "UK" ? ukUrl : usUrl;
    setSendStatus(`Sending to ${target}...`);
    try {
      await sendTrigger(baseUrl, message);
      setSendStatus(`Sent to ${target}: ${truncate(message, 80)}`);
    } catch (error) {
      setSendStatus(`Failed to send to ${target}.`);
    }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-title">Treasury Agent Demo</div>
          <div className="brand-subtitle">US / UK Agent Collaboration</div>
        </div>
        <div className="status-row">
          <div className="status-pill">
            <span
              className={`status-indicator ${
                ukStatus === "open" ? "live" : ukStatus
              }`}
            />
            UK stream {ukStatus}
          </div>
          <div className="status-pill">
            <span
              className={`status-indicator ${
                usStatus === "open" ? "live" : usStatus
              }`}
            />
            US stream {usStatus}
          </div>
          <div className="status-pill">
            <span className="status-indicator live" />
            Events tracked {allEvents.length}
          </div>
        </div>
      </header>

      <section className="grid">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title uk">UK Treasury Agent</h2>
            <div className="event-tags">{filteredUk.length} events</div>
          </div>
          <div className="event-flow">
            {recentUk.length === 0 && (
              <div className="flow-empty">Waiting for UK agent activity.</div>
            )}
            {recentUk.map((event) => (
              <div key={event.id} className={`flow-card kind-${event.kind}`}>
                <div className="flow-card-header">
                  <span className={`badge badge-${event.kind}`}>
                    {KIND_LABELS[event.kind]}
                  </span>
                  <span className="time-chip">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                {event.kind === "tool_use" ? (
                  <div className="tool-line">{event.text || "Tool call"}</div>
                ) : (
                  <div
                    className="markdown"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(event.text || ""),
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title flow">A2A Communication</h2>
            <div className="event-tags">Cross-agent flow</div>
          </div>
          <div className="flow-list">
            {flowEvents.length === 0 && (
              <div className="flow-empty">
                Trigger a scenario to see the conversation.
              </div>
            )}
            {flowEvents.map((event) => (
              <div
                key={event.id}
                className={`flow-bubble flow-${event.agent.toLowerCase()}`}
              >
                <div className="flow-bubble-header">
                  <span className="flow-agent">
                    {event.agent} {KIND_LABELS[event.kind]}
                  </span>
                  <span className="flow-time">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <div
                  className="markdown"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(
                      event.text || KIND_LABELS[event.kind],
                    ),
                  }}
                />
              </div>
            ))}
          </div>
          <div className="footer-note">
            Showing {flowEvents.length} message events across both agents.
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title us">US Treasury Agent</h2>
            <div className="event-tags">{filteredUs.length} events</div>
          </div>
          <div className="event-flow">
            {recentUs.length === 0 && (
              <div className="flow-empty">Waiting for US agent activity.</div>
            )}
            {recentUs.map((event) => (
              <div key={event.id} className={`flow-card kind-${event.kind}`}>
                <div className="flow-card-header">
                  <span className={`badge badge-${event.kind}`}>
                    {KIND_LABELS[event.kind]}
                  </span>
                  <span className="time-chip">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                {event.kind === "tool_use" ? (
                  <div className="tool-line">{event.text || "Tool call"}</div>
                ) : (
                  <div
                    className="markdown"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(event.text || ""),
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-header">
            <h2 className="panel-title flow">Trigger Scenarios</h2>
            <div className="event-tags">Send events into the system</div>
          </div>
          <div className="trigger-panel">
            <div className="trigger-grid">
              {PRESET_TRIGGERS.map((preset) => (
                <button
                  key={preset.title}
                  className="trigger-button"
                  type="button"
                  onClick={() => handleSend(preset.target, preset.message)}
                >
                  <span>{preset.target} agent</span>
                  <strong>{preset.title}</strong>
                  <div className="footer-note">{preset.detail}</div>
                </button>
              ))}
            </div>
            <div className="trigger-form">
              <select
                className="trigger-select"
                value={customTarget}
                onChange={(event) =>
                  setCustomTarget(event.target.value as AgentId)
                }
              >
                <option value="UK">UK agent</option>
                <option value="US">US agent</option>
              </select>
              <input
                className="trigger-input"
                placeholder="Custom event message (e.g., Invoice for 400 HBAR)"
                value={customMessage}
                onChange={(event) => setCustomMessage(event.target.value)}
              />
              <button
                className="trigger-submit"
                type="button"
                onClick={() => {
                  if (!customMessage.trim()) return;
                  handleSend(customTarget, customMessage.trim());
                  setCustomMessage("");
                }}
              >
                Send event
              </button>
            </div>
            <div className="footer-note">{sendStatus}</div>
          </div>
        </div>
        {debugEnabled && (
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <div className="panel-header">
              <h2 className="panel-title flow">Debug Feed</h2>
              <div className="event-tags">debug=1</div>
            </div>
            <div className="trigger-panel">
              <div className="event-text">
                UK url: {ukUrl} | status: {ukStatus} | recent count:{" "}
                {ukDebug.lastRecentCount} | added: {ukDebug.lastAddedCount} |
                events: {ukDebug.currentEventCount}
              </div>
              <div className="event-text">
                UK last event: {ukDebug.lastEventType} at {ukDebug.lastEventAt}
              </div>
              <div className="event-text">UK error: {ukDebug.lastError}</div>
              <div className="event-tags">{ukDebug.lastRaw}</div>
              <div className="event-text">
                US url: {usUrl} | status: {usStatus} | recent count:{" "}
                {usDebug.lastRecentCount} | added: {usDebug.lastAddedCount} |
                events: {usDebug.currentEventCount}
              </div>
              <div className="event-text">
                US last event: {usDebug.lastEventType} at {usDebug.lastEventAt}
              </div>
              <div className="event-text">US error: {usDebug.lastError}</div>
              <div className="event-tags">{usDebug.lastRaw}</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
