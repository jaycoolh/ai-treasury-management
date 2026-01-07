import {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from "@a2a-js/sdk/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { config } from "./config.js";

/**
 * Intelligent Treasury Executor
 *
 * Uses Claude Agent SDK to process incoming A2A messages autonomously.
 * The agent has access to:
 * - Treasury management skills
 * - UK compliance rules
 * - Hedera MCP for blockchain operations
 * - A2A MCP for partner communication
 */
export class IntelligentTreasuryExecutor implements AgentExecutor {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus) {
    const messageText = requestContext.userMessage.parts
      .filter((p) => p.kind === "text")
      .map((p) => (p as any).text)
      .join(" ");

    // Extract metadata to identify message source
    const metadata = (requestContext.userMessage as any).metadata || {};
    const sender = metadata.sender || "unknown";

    console.log(`\n[${this.getTimestamp()}] 📨 Received message:`);
    console.log(`   Sender: ${sender}`);
    console.log(`   Message: "${messageText}"`);
    console.log(`   Context ID: ${requestContext.contextId}`);
    console.log(`   Task ID: ${requestContext.taskId}`);

    try {
      // Invoke Claude Agent SDK to process the message
      const agentSession = query({
        prompt: `You are the UK Treasury Agent operating autonomously.

You received an A2A message with the following details:

Message metadata:
- sender: "${sender}"

Message content:
"${messageText}"

IMPORTANT: Check the metadata.sender field to determine message source:
- If metadata.sender is "arp-system": This is an internal AR/AP system event. Analyze the event, check your AR/AP data using arp:// resources, and decide if you need to initiate a NEW conversation with the partner agent.
- If metadata.sender is "us-treasury-agent": This is a message from your partner agent. Process the request and respond appropriately within 2-3 turns following conversation management rules.

Process this message according to UK treasury protocols and your treasury-management skill guidance.`,
        options: {
          mcpServers: {
            hedera: {
              command: "node",
              args: [
                "../../packages/mcp-hedera/dist/index.js",
                "--ledger-id=" + config.hederaNetwork,
              ],
              env: {
                HEDERA_OPERATOR_ID: config.hederaAccountId,
                HEDERA_OPERATOR_KEY: config.hederaPrivateKey,
              },
            },
            a2a: {
              command: "node",
              args: ["../../packages/mcp-a2a/dist/index.js"],
              env: {
                AGENT_ID: "uk-treasury-agent",
                PARTNER_AGENT_URL: config.partnerAgentUrl,
                PARTNER_HEDERA_ACCOUNT_ID: config.partnerHederaAccountId || "",
                MESSAGES_DIR: config.messagesDir,
              },
            },
            arp: {
              command: "node",
              args: ["../../packages/mcp-arp/dist/index.js"],
              env: {
                ARP_DATA_DIR: process.env.UK_ARP_DATA_DIR || "./data",
              },
            },
          },
          settingSources: ["project"], // Load Skills from .claude/skills/
          systemPrompt: `
You are the UK Treasury Agent processing an incoming A2A message from the US Treasury Agent.

Key context:
- Your entity: United Kingdom business
- Your Hedera Account: ${config.hederaAccountId}
- Partner: United States business
- Network: ${config.hederaNetwork}

Respond professionally and execute any required operations autonomously.
`,
          //           systemPrompt: {
          //             type: "preset",
          //             preset: "claude_code",
          //             append: `
          // You are the UK Treasury Agent processing an incoming A2A message from the US Treasury Agent.
          //
          // Key context:
          // - Your entity: United Kingdom business
          // - Your Hedera Account: ${config.hederaAccountId}
          // - Partner: United States business
          // - Network: ${config.hederaNetwork}
          //
          // Respond professionally and execute any required operations autonomously.
          // `,
          // }
          permissionMode: "bypassPermissions", // Autonomous operation
          allowDangerouslySkipPermissions: true,
        },
      });

      let finalResult = "";

      // Process agent session
      for await (const message of agentSession) {
        if (message.type === "assistant") {
          // Log assistant thinking
          const text = message.message.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join("");

          if (text) {
            // console.log(`[${this.getTimestamp()}] 💭 UK Agent: ${text.substring(0, 100)}...`);
            console.log(`[${this.getTimestamp()}] 💭 UK Agent: ${text}`);
          }
        }

        if (message.type === "result") {
          if (message.subtype === "success") {
            finalResult = message.result;
            console.log(`[${this.getTimestamp()}] ✅ UK Agent completed successfully`);
            // console.log(`   Result: ${finalResult.substring(0, 150)}...`);
            console.log(`   Result: ${finalResult}`);
          } else {
            finalResult = `Error processing request: ${message.errors?.join(
              ", "
            )}`;
            console.error(`[${this.getTimestamp()}] ❌ UK Agent failed: ${finalResult}`);
          }
        }
      }

      // Send final response back through A2A
      eventBus.publish({
        kind: "message",
        messageId: crypto.randomUUID(),
        role: "agent",
        parts: [
          {
            kind: "text",
            text: finalResult || "Request processed successfully.",
          },
        ],
        contextId: requestContext.contextId,
      });
    } catch (error: any) {
      console.error(`[${this.getTimestamp()}] ❌ Error processing message:`, error);

      eventBus.publish({
        kind: "message",
        messageId: crypto.randomUUID(),
        role: "agent",
        parts: [
          {
            kind: "text",
            text: `Error processing request: ${error.message}`,
          },
        ],
        contextId: requestContext.contextId,
      });
    }

    eventBus.finished();
  }

  async cancelTask(): Promise<void> {
    console.log(`[${this.getTimestamp()}] ⚠️  Task cancellation requested`);
  }
}
