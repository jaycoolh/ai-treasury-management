import {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from "@a2a-js/sdk/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { config } from "./config.js";
import { recordEvent } from "./events.js";

/**
 * Intelligent Treasury Executor
 *
 * Uses Claude Agent SDK to process incoming A2A messages autonomously.
 * The agent has access to:
 * - Treasury management skills
 * - US compliance rules
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
    const contextId = requestContext.contextId;
    const taskId = requestContext.taskId;

    const receivedLine = `[${this.getTimestamp()}] Received message from ${sender}: "${messageText}"`;
    console.log(`\n[${this.getTimestamp()}] 📨 Received message:`);
    console.log(`   Sender: ${sender}`);
    console.log(`   Message: "${messageText}"`);
    console.log(`   Context ID: ${contextId}`);
    console.log(`   Task ID: ${taskId}`);

    recordEvent({
      kind: "message_received",
      contextId,
      taskId,
      sender,
      text: messageText,
    });
    recordEvent({
      kind: "log",
      contextId,
      taskId,
      sender,
      text: receivedLine,
    });

    try {
      // Invoke Claude Agent SDK to process the message
      const agentSession = query({
        prompt: `You are the US Treasury Agent operating autonomously.

You received an A2A message with the following details:

Message metadata:
- sender: "${sender}"

Message content:
"${messageText}"

IMPORTANT: Check the metadata.sender field to determine message source:
- If metadata.sender is "arp-system": This is an internal AR/AP system event. Analyze the event, check your AR/AP data using arp:// resources, and decide if you need to initiate a NEW conversation with the partner agent.
- If metadata.sender is "uk-treasury-agent": This is a message from your partner agent. Process the request and respond appropriately within 2-3 turns following conversation management rules.

Process this message according to US treasury protocols and your treasury-management skill guidance.`,
        options: {
          allowedTools: [],
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
                AGENT_ID: "us-treasury-agent",
                PARTNER_AGENT_URL: config.partnerAgentUrl,
                PARTNER_HEDERA_ACCOUNT_ID: config.partnerHederaAccountId || "",
                MESSAGES_DIR: config.messagesDir,
              },
            },
            arp: {
              command: "node",
              args: ["../../packages/mcp-arp/dist/index.js"],
              env: {
                ARP_DATA_DIR: process.env.US_ARP_DATA_DIR || "./data",
              },
            },
          },
          model: "claude-sonnet-4-5-20250929",
          settingSources: ["project"], // Load Skills from .claude/skills/
          systemPrompt: `
You are the US Treasury Agent processing an incoming A2A message from the US Treasury Agent.

Key context:
- Your entity: United States business
- Your Hedera Account: ${config.hederaAccountId}
- Partner: United Kingdom business
- Network: ${config.hederaNetwork}

Respond professionally and execute any required operations autonomously.
`,
          //           systemPrompt: {
          //             type: "preset",
          //             preset: "claude_code",
          //             append: `
          // You are the US Treasury Agent processing an incoming A2A message from the US Treasury Agent.

          // Key context:
          // - Your entity: United States business
          // - Your Hedera Account: ${config.hederaAccountId}
          // - Partner: United States business
          // - Network: ${config.hederaNetwork}

          // Respond professionally and execute any required operations autonomously.
          // `,
          //           },
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
            console.log(`[${this.getTimestamp()}] 💭 US Agent: ${text}...`);
          }

          if (text) {
            recordEvent({
              kind: "log",
              contextId,
              taskId,
              sender,
              text: `[${this.getTimestamp()}] Agent update: ${text}`,
            });
            recordEvent({
              kind: "assistant_update",
              contextId,
              taskId,
              sender,
              text,
            });
          }

          // Log MCP tool interactions
          const toolUses = message.message.content.filter(
            (c: any) => c.type === "tool_use",
          );
          for (const toolUse of toolUses) {
            console.log(
              `[${this.getTimestamp()}] 🔧 US Agent Tool Use: ${toolUse.name}`,
            );
            console.log(`   Tool ID: ${toolUse.id}`);
            console.log(`   Input: ${JSON.stringify(toolUse.input, null, 2)}`);

            recordEvent({
              kind: "tool_use",
              contextId,
              taskId,
              sender,
              text: toolUse.name,
              data: {
                tool: toolUse.name,
                input: toolUse.input,
              },
            });
            if (
              typeof toolUse.name === "string" &&
              toolUse.name.includes("send_message_to_partner")
            ) {
              recordEvent({
                kind: "partner_message",
                contextId,
                taskId,
                sender,
                text:
                  typeof toolUse.input?.message === "string"
                    ? toolUse.input.message
                    : "Message sent to partner.",
              });
            }
            recordEvent({
              kind: "log",
              contextId,
              taskId,
              sender,
              text: `[${this.getTimestamp()}] Tool use: ${toolUse.name} input ${JSON.stringify(
                toolUse.input,
              )}`,
            });
          }
        }

        if (message.type === "result") {
          if (message.subtype === "success") {
            finalResult = message.result;
            console.log(
              `[${this.getTimestamp()}] ✅ US Agent completed successfully`,
            );
            console.log(`   Result: ${finalResult}...`);

            recordEvent({
              kind: "result",
              contextId,
              taskId,
              sender,
              text: finalResult,
              data: { status: "success" },
            });
            recordEvent({
              kind: "log",
              contextId,
              taskId,
              sender,
              text: `[${this.getTimestamp()}] Agent completed successfully.`,
            });
          } else {
            finalResult = `Error processing request: ${message.errors?.join(
              ", ",
            )}`;
            console.error(
              `[${this.getTimestamp()}] ❌ US Agent failed: ${finalResult}`,
            );

            recordEvent({
              kind: "error",
              contextId,
              taskId,
              sender,
              text: finalResult,
              data: { status: "error" },
            });
            recordEvent({
              kind: "log",
              contextId,
              taskId,
              sender,
              text: `[${this.getTimestamp()}] Agent failed: ${finalResult}`,
            });
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
        contextId,
      });

      recordEvent({
        kind: "response_sent",
        contextId,
        taskId,
        sender,
        text: finalResult || "Request processed successfully.",
      });
      recordEvent({
        kind: "log",
        contextId,
        taskId,
        sender,
        text: `[${this.getTimestamp()}] Response sent to partner.`,
      });
    } catch (error: any) {
      console.error(
        `[${this.getTimestamp()}] ❌ Error processing message:`,
        error,
      );

      recordEvent({
        kind: "error",
        contextId,
        taskId,
        sender,
        text: `Error processing request: ${error.message}`,
        data: { status: "exception" },
      });
      recordEvent({
        kind: "log",
        contextId,
        taskId,
        sender,
        text: `[${this.getTimestamp()}] Exception: ${error.message}`,
      });

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
        contextId,
      });
    }

    eventBus.finished();
  }

  async cancelTask(): Promise<void> {
    console.log(`[${this.getTimestamp()}] ⚠️  Task cancellation requested`);
  }
}
