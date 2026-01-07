#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import path from "path";

import {
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import type {
  ARLedger,
  APLedger,
  LedgerSummary,
  CashFlowForecast,
  AREntry,
  APEntry,
} from "@treasury/shared-types";

const ARP_DATA_DIR = process.env.ARP_DATA_DIR || "./data";

console.error("📊 AR/AP MCP Server starting...");
console.error(`   Data Directory: ${ARP_DATA_DIR}`);

// Create the MCP server with modern API
const server = new McpServer(
  {
    name: "arp-treasury",
    version: "1.0.0",
  },
  {
    capabilities: {
      logging: {},
      resources: {},
    },
  }
);

/**
 * Helper: Read and parse JSON file
 */
function readJSONFile<T>(filename: string): T {
  const filePath = path.join(ARP_DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as T;
}

/**
 * Helper: Calculate aging summary from entries
 */
function calculateAgingSummary(
  entries: (AREntry | APEntry)[]
): {
  current: number;
  days30: number;
  days60: number;
  days90Plus: number;
} {
  const summary = {
    current: 0,
    days30: 0,
    days60: 0,
    days90Plus: 0,
  };

  entries.forEach((entry) => {
    if (entry.status !== "outstanding") return;

    switch (entry.agingBucket) {
      case "current":
        summary.current += entry.amount;
        break;
      case "30":
        summary.days30 += entry.amount;
        break;
      case "60":
        summary.days60 += entry.amount;
        break;
      case "90+":
        summary.days90Plus += entry.amount;
        break;
    }
  });

  return summary;
}

/**
 * Helper: Calculate ledger summary
 */
function calculateLedgerSummary(): LedgerSummary {
  try {
    const arEntries = readJSONFile<AREntry[]>("ar-ledger.json");
    const apEntries = readJSONFile<APEntry[]>("ap-ledger.json");

    const totalAR = arEntries
      .filter((e) => e.status === "outstanding")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalAP = apEntries
      .filter((e) => e.status === "outstanding")
      .reduce((sum, e) => sum + e.amount, 0);

    const arOverdue = arEntries
      .filter((e) => e.status === "overdue")
      .reduce((sum, e) => sum + e.amount, 0);

    const apOverdue = apEntries
      .filter((e) => e.status === "overdue")
      .reduce((sum, e) => sum + e.amount, 0);

    // Critical items: due within 7 days
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const criticalItemsCount = [
      ...arEntries.filter(
        (e) =>
          e.status === "outstanding" &&
          new Date(e.dueDate) <= sevenDaysFromNow
      ),
      ...apEntries.filter(
        (e) =>
          e.status === "outstanding" &&
          new Date(e.dueDate) <= sevenDaysFromNow
      ),
    ].length;

    return {
      totalAR,
      totalAP,
      netPosition: totalAR - totalAP,
      arOverdue,
      apOverdue,
      criticalItemsCount,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Failed to calculate ledger summary: ${error.message}`);
  }
}

// Register resource: AR/AP Summary
server.registerResource(
  "ledger-summary",
  "arp://ledger/summary",
  {
    description:
      "High-level summary of AR/AP position including totals and critical items",
    mimeType: "application/json",
  },
  async (): Promise<ReadResourceResult> => {
    try {
      const summary = calculateLedgerSummary();

      return {
        contents: [
          {
            uri: "arp://ledger/summary",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error(`❌ Error reading ledger summary: ${error.message}`);
      return {
        contents: [
          {
            uri: "arp://ledger/summary",
            text: JSON.stringify(
              {
                error: error.message,
                totalAR: 0,
                totalAP: 0,
                netPosition: 0,
                arOverdue: 0,
                apOverdue: 0,
                criticalItemsCount: 0,
                lastUpdated: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// Register resource: AR Ledger
server.registerResource(
  "ar-ledger",
  "arp://ledger/ar",
  {
    description: "Full accounts receivable ledger with all outstanding invoices",
    mimeType: "application/json",
  },
  async (): Promise<ReadResourceResult> => {
    try {
      const entries = readJSONFile<AREntry[]>("ar-ledger.json");

      const totalOutstanding = entries
        .filter((e) => e.status === "outstanding")
        .reduce((sum, e) => sum + e.amount, 0);

      const totalOverdue = entries
        .filter((e) => e.status === "overdue")
        .reduce((sum, e) => sum + e.amount, 0);

      const agingSummary = calculateAgingSummary(entries);

      const arLedger: ARLedger = {
        entries,
        totalOutstanding,
        totalOverdue,
        agingSummary,
      };

      return {
        contents: [
          {
            uri: "arp://ledger/ar",
            text: JSON.stringify(arLedger, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error(`❌ Error reading AR ledger: ${error.message}`);
      return {
        contents: [
          {
            uri: "arp://ledger/ar",
            text: JSON.stringify(
              {
                error: error.message,
                entries: [],
                totalOutstanding: 0,
                totalOverdue: 0,
                agingSummary: {
                  current: 0,
                  days30: 0,
                  days60: 0,
                  days90Plus: 0,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// Register resource: AP Ledger
server.registerResource(
  "ap-ledger",
  "arp://ledger/ap",
  {
    description: "Full accounts payable ledger with all outstanding bills",
    mimeType: "application/json",
  },
  async (): Promise<ReadResourceResult> => {
    try {
      const entries = readJSONFile<APEntry[]>("ap-ledger.json");

      const totalOutstanding = entries
        .filter((e) => e.status === "outstanding")
        .reduce((sum, e) => sum + e.amount, 0);

      const totalOverdue = entries
        .filter((e) => e.status === "overdue")
        .reduce((sum, e) => sum + e.amount, 0);

      const agingSummary = calculateAgingSummary(entries);

      const apLedger: APLedger = {
        entries,
        totalOutstanding,
        totalOverdue,
        agingSummary,
      };

      return {
        contents: [
          {
            uri: "arp://ledger/ap",
            text: JSON.stringify(apLedger, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error(`❌ Error reading AP ledger: ${error.message}`);
      return {
        contents: [
          {
            uri: "arp://ledger/ap",
            text: JSON.stringify(
              {
                error: error.message,
                entries: [],
                totalOutstanding: 0,
                totalOverdue: 0,
                agingSummary: {
                  current: 0,
                  days30: 0,
                  days60: 0,
                  days90Plus: 0,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

// Register resource: Cash Flow Forecast
server.registerResource(
  "cashflow-forecast",
  "arp://cashflow/forecast",
  {
    description:
      "30-day cash flow forecast based on projected AR collections and AP payments",
    mimeType: "application/json",
  },
  async (): Promise<ReadResourceResult> => {
    try {
      const forecast = readJSONFile<CashFlowForecast>("cash-forecast.json");

      return {
        contents: [
          {
            uri: "arp://cashflow/forecast",
            text: JSON.stringify(forecast, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error(`❌ Error reading cash forecast: ${error.message}`);
      return {
        contents: [
          {
            uri: "arp://cashflow/forecast",
            text: JSON.stringify(
              {
                error: error.message,
                startDate: new Date().toISOString().split("T")[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0],
                currentBalance: 0,
                entries: [],
                minimumProjectedBalance: 0,
                minimumBalanceDate: new Date().toISOString().split("T")[0],
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ AR/AP MCP Server running on stdio");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
