#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ClientFactory } from '@a2a-js/sdk';
import fs from 'fs';
import path from 'path';
import type {
  SendMessageParams,
  SendMessageResult,
  CheckMessagesParams,
  CheckMessagesResult,
  A2AMessage,
} from '@treasury/shared-types';

const PARTNER_AGENT_URL = process.env.PARTNER_AGENT_URL || 'http://localhost:5000';
const MESSAGES_DIR = process.env.MESSAGES_DIR || './messages/inbox';

console.error('🔗 A2A MCP Server starting...');
console.error(`   Partner URL: ${PARTNER_AGENT_URL}`);
console.error(`   Messages Dir: ${MESSAGES_DIR}`);

const server = new Server(
  {
    name: 'a2a-treasury',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const factory = new ClientFactory();

// List available tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'send_message_to_partner',
        description: 'Send a message to the partner treasury agent (UK or US)',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message to send to partner agent',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'check_partner_messages',
        description: 'Check for new messages from the partner agent',
        inputSchema: {
          type: 'object',
          properties: {
            mark_as_read: {
              type: 'boolean',
              description: 'Archive messages after reading',
              default: false,
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'send_message_to_partner') {
    const params = args as SendMessageParams;

    try {
      console.error(`📤 Sending message to ${PARTNER_AGENT_URL}...`);

      const client = await factory.createFromUrl(PARTNER_AGENT_URL);

      const response = await client.sendMessage({
        message: {
          messageId: crypto.randomUUID(),
          role: 'user',
          parts: [{ kind: 'text', text: params.message }],
          kind: 'message',
        },
      });

      const result: SendMessageResult = {
        success: true,
        messageId: response.id,
        response: JSON.stringify(response, null, 2),
      };

      console.error(`✅ Message sent successfully`);

      return {
        content: [
          {
            type: 'text',
            text: `Message sent successfully.\n\nResponse:\n${result.response}`,
          },
        ],
      };
    } catch (error: any) {
      console.error(`❌ Failed to send message: ${error.message}`);

      const result: SendMessageResult = {
        success: false,
        error: error.message,
      };

      return {
        content: [
          {
            type: 'text',
            text: `Failed to send message: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'check_partner_messages') {
    const params = (args as CheckMessagesParams) || {};

    try {
      console.error(`📥 Checking for messages in ${MESSAGES_DIR}...`);

      if (!fs.existsSync(MESSAGES_DIR)) {
        const result: CheckMessagesResult = {
          messages: [],
          count: 0,
        };

        return {
          content: [
            {
              type: 'text',
              text: 'No messages.',
            },
          ],
        };
      }

      const files = fs
        .readdirSync(MESSAGES_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort();

      if (files.length === 0) {
        const result: CheckMessagesResult = {
          messages: [],
          count: 0,
        };

        console.error(`   No new messages.`);

        return {
          content: [
            {
              type: 'text',
              text: 'No new messages.',
            },
          ],
        };
      }

      const messages: A2AMessage[] = files.map((file) => {
        const content = fs.readFileSync(path.join(MESSAGES_DIR, file), 'utf-8');
        return JSON.parse(content);
      });

      // Optionally archive messages
      if (params.mark_as_read) {
        const archiveDir = path.join(path.dirname(MESSAGES_DIR), 'archive');
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
      }

      const result: CheckMessagesResult = {
        messages,
        count: messages.length,
      };

      console.error(`✅ Found ${messages.length} message(s)`);

      return {
        content: [
          {
            type: 'text',
            text: `Found ${messages.length} message(s):\n\n${JSON.stringify(messages, null, 2)}`,
          },
        ],
      };
    } catch (error: any) {
      console.error(`❌ Failed to check messages: ${error.message}`);

      return {
        content: [
          {
            type: 'text',
            text: `Failed to check messages: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ A2A MCP Server running on stdio');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
