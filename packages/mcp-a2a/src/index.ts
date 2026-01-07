#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ClientFactory } from "@a2a-js/sdk/client";
import fs from "fs";
import path from "path";
import * as z from "zod";

import {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { A2AMessage } from "@treasury/shared-types";

const PARTNER_AGENT_URL =
  process.env.PARTNER_AGENT_URL || "http://localhost:5001";
const PARTNER_HEDERA_ACCOUNT_ID = process.env.PARTNER_HEDERA_ACCOUNT_ID || "";
const MESSAGES_DIR = process.env.MESSAGES_DIR || "./messages/inbox";

console.error("🔗 A2A MCP Server starting...");
console.error(`   Partner URL: ${PARTNER_AGENT_URL}`);
console.error(`   Partner Account: ${PARTNER_HEDERA_ACCOUNT_ID || "Not configured"}`);
console.error(`   Messages Dir: ${MESSAGES_DIR}`);

// Create the MCP server with modern API
const server = new McpServer(
  {
    name: "a2a-treasury",
    version: "1.0.0",
  },
  {
    capabilities: {
      logging: {},
      tools: {},
      resources: {},
    },
  }
);

const factory = new ClientFactory();

// Register the send_message_to_partner tool
server.registerTool(
  "send_message_to_partner",
  {
    description: "Send a message to the partner treasury agent (UK or US)",
    inputSchema: {
      message: z.string().describe("Message to send to partner agent"),
    },
  },
  async ({ message }: { message: string }, extra): Promise<CallToolResult> => {
    try {
      console.error(`📤 Sending message to ${PARTNER_AGENT_URL}...`);

      const client = await factory.createFromUrl(PARTNER_AGENT_URL);
      const messageId = crypto.randomUUID();

      const response = await client.sendMessage({
        message: {
          messageId,
          role: "user",
          parts: [{ kind: "text", text: message }],
          kind: "message",
        },
      });

      console.error(`✅ Message sent successfully`);

      await server.sendLoggingMessage(
        {
          level: "info",
          data: `Sent message ${messageId} to ${PARTNER_AGENT_URL}`,
        },
        extra.sessionId
      );

      return {
        content: [
          {
            type: "text",
            text: `Message sent successfully.\n\nResponse:\n${JSON.stringify(
              response,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error: any) {
      console.error(`❌ Failed to send message: ${error.message}`);

      await server.sendLoggingMessage(
        {
          level: "error",
          data: `Failed to send message: ${error.message}`,
        },
        extra.sessionId
      );

      return {
        content: [
          {
            type: "text",
            text: `Failed to send message: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register the check_partner_messages tool
server.registerTool(
  "check_partner_messages",
  {
    description: "Check for new messages from the partner agent",
    inputSchema: {
      mark_as_read: z
        .boolean()
        .optional()
        .default(false)
        .describe("Archive messages after reading"),
    },
  },
  async ({ mark_as_read }: { mark_as_read?: boolean }, extra): Promise<CallToolResult> => {
    try {
      console.error(`📥 Checking for messages in ${MESSAGES_DIR}...`);

      if (!fs.existsSync(MESSAGES_DIR)) {
        return {
          content: [
            {
              type: "text",
              text: "No messages.",
            },
          ],
        };
      }

      const files = fs
        .readdirSync(MESSAGES_DIR)
        .filter((f) => f.endsWith(".json"))
        .sort();

      if (files.length === 0) {
        console.error(`   No new messages.`);

        return {
          content: [
            {
              type: "text",
              text: "No new messages.",
            },
          ],
        };
      }

      const messages: A2AMessage[] = files.map((file) => {
        const content = fs.readFileSync(path.join(MESSAGES_DIR, file), "utf-8");
        return JSON.parse(content);
      });

      // Optionally archive messages
      if (mark_as_read) {
        const archiveDir = path.join(path.dirname(MESSAGES_DIR), "archive");
        if (!fs.existsSync(archiveDir)) {
          fs.mkdirSync(archiveDir, { recursive: true });
        }
        files.forEach((file) => {
          fs.renameSync(
            path.join(MESSAGES_DIR, file),
            path.join(archiveDir, file)
          );
        });
        console.error(`   Archived ${files.length} message(s)`);

        await server.sendLoggingMessage(
          {
            level: "info",
            data: `Archived ${files.length} message(s)`,
          },
          extra.sessionId
        );
      }

      console.error(`✅ Found ${messages.length} message(s)`);

      await server.sendLoggingMessage(
        {
          level: "info",
          data: `Found ${messages.length} message(s)`,
        },
        extra.sessionId
      );

      return {
        content: [
          {
            type: "text",
            text: `Found ${messages.length} message(s):\n\n${JSON.stringify(
              messages,
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error: any) {
      console.error(`❌ Failed to check messages: ${error.message}`);

      await server.sendLoggingMessage(
        {
          level: "error",
          data: `Failed to check messages: ${error.message}`,
        },
        extra.sessionId
      );

      return {
        content: [
          {
            type: "text",
            text: `Failed to check messages: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register a resource to expose partner agent connection status
server.registerResource(
  "partner-status",
  "a2a://partner/status",
  {
    description: "Current partner agent connection configuration and Hedera account",
    mimeType: "application/json",
  },
  async (): Promise<ReadResourceResult> => {
    return {
      contents: [
        {
          uri: "a2a://partner/status",
          text: JSON.stringify(
            {
              partnerUrl: PARTNER_AGENT_URL,
              partnerHederaAccountId: PARTNER_HEDERA_ACCOUNT_ID || null,
              messagesDir: MESSAGES_DIR,
              messagesDirExists: fs.existsSync(MESSAGES_DIR),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Register a resource to expose conversation history
server.registerResource(
  "conversation-history",
  "a2a://conversation/history",
  {
    description: "Historical conversation messages with partner agent (last 50 messages)",
    mimeType: "application/json",
  },
  async (): Promise<ReadResourceResult> => {
    try {
      const archiveDir = path.join(path.dirname(MESSAGES_DIR), "archive");

      if (!fs.existsSync(archiveDir)) {
        return {
          contents: [
            {
              uri: "a2a://conversation/history",
              text: JSON.stringify(
                {
                  messages: [],
                  count: 0,
                  note: "No archived messages found",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Read all archived message files
      const files = fs
        .readdirSync(archiveDir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .reverse() // Most recent first
        .slice(0, 50); // Limit to last 50 messages

      const messages: A2AMessage[] = files.map((file) => {
        const content = fs.readFileSync(path.join(archiveDir, file), "utf-8");
        return JSON.parse(content);
      });

      return {
        contents: [
          {
            uri: "a2a://conversation/history",
            text: JSON.stringify(
              {
                messages,
                count: messages.length,
                note: messages.length === 50 ? "Showing last 50 messages" : `Showing all ${messages.length} archived messages`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error: any) {
      console.error(`❌ Error reading conversation history: ${error.message}`);
      return {
        contents: [
          {
            uri: "a2a://conversation/history",
            text: JSON.stringify(
              {
                error: error.message,
                messages: [],
                count: 0,
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
  console.error("✅ A2A MCP Server running on stdio");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
