import { AgentExecutor, ExecutionEventBus, RequestContext } from '@a2a-js/sdk';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { config } from './config.js';

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
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus) {
    const messageText = requestContext.userMessage.parts
      .filter((p) => p.kind === 'text')
      .map((p) => (p as any).text)
      .join(' ');

    console.log(`\n📨 Received message from partner agent:`);
    console.log(`   Message: "${messageText}"`);
    console.log(`   Context ID: ${requestContext.contextId}`);
    console.log(`   Task ID: ${requestContext.taskId}`);

    try {
      // Invoke Claude Agent SDK to process the message
      const agentSession = query({
        prompt: `You are the UK Treasury Agent operating autonomously.

You received this message from the US Treasury Agent:

"${messageText}"

Process this message according to UK treasury protocols:
1. Understand what the partner agent is requesting or communicating
2. Check compliance requirements using your uk-compliance skill
3. If a transfer is being requested or confirmed, use appropriate Hedera MCP tools
4. Respond professionally to the partner agent

Use your treasury-management skill for workflow guidance.

Generate a clear, professional response to send back to the US agent.`,
        options: {
          allowedTools: ['Read', 'Write', 'Bash'],
          mcpServers: {
            hedera: {
              command: 'node',
              args: [
                '../../packages/mcp-hedera/dist/index.js',
                '--ledger-id=' + config.hederaNetwork,
              ],
              env: {
                HEDERA_OPERATOR_ID: config.hederaAccountId,
                HEDERA_OPERATOR_KEY: config.hederaPrivateKey,
              },
            },
            a2a: {
              command: 'node',
              args: ['../../packages/mcp-a2a/dist/index.js'],
              env: {
                PARTNER_AGENT_URL: config.partnerAgentUrl,
                MESSAGES_DIR: config.messagesDir,
              },
            },
          },
          settingSources: ['project'], // Load Skills from .claude/skills/
          systemPrompt: {
            type: 'preset',
            preset: 'claude_code',
            append: `
You are the UK Treasury Agent processing an incoming A2A message from the US Treasury Agent.

Key context:
- Your entity: United Kingdom business
- Your Hedera Account: ${config.hederaAccountId}
- Partner: United States business
- Network: ${config.hederaNetwork}

Respond professionally and execute any required operations autonomously.
`,
          },
          permissionMode: 'bypassPermissions', // Autonomous operation
          allowDangerouslySkipPermissions: true,
        },
      });

      let finalResult = '';

      // Process agent session
      for await (const message of agentSession) {
        if (message.type === 'assistant') {
          // Log assistant thinking
          const text = message.message.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('');

          if (text) {
            console.log(`💭 UK Agent: ${text.substring(0, 100)}...`);
          }
        }

        if (message.type === 'result') {
          if (message.subtype === 'success') {
            finalResult = message.result;
            console.log(`✅ UK Agent completed successfully`);
            console.log(`   Result: ${finalResult.substring(0, 150)}...`);
          } else {
            finalResult = `Error processing request: ${message.errors?.join(', ')}`;
            console.error(`❌ UK Agent failed: ${finalResult}`);
          }
        }
      }

      // Send final response back through A2A
      eventBus.publish({
        kind: 'message',
        messageId: crypto.randomUUID(),
        role: 'agent',
        parts: [
          {
            kind: 'text',
            text: finalResult || 'Request processed successfully.',
          },
        ],
        contextId: requestContext.contextId,
      });
    } catch (error: any) {
      console.error(`❌ Error processing message:`, error);

      eventBus.publish({
        kind: 'message',
        messageId: crypto.randomUUID(),
        role: 'agent',
        parts: [
          {
            kind: 'text',
            text: `Error processing request: ${error.message}`,
          },
        ],
        contextId: requestContext.contextId,
      });
    }

    eventBus.finished();
  }

  async cancelTask(): Promise<void> {
    console.log('⚠️  Task cancellation requested');
  }
}
