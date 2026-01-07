#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client, LedgerId, Hbar, TransferTransaction, AccountBalanceQuery } from '@hashgraph/sdk';
import colors from 'colors';
const { green, red, yellow } = colors;

// Parse command-line arguments
type Options = {
  ledgerId: LedgerId;
};

function parseArgs(args: string[]): Options {
  const options: Options = {
    ledgerId: LedgerId.TESTNET,
  };

  args.forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');

      if (key === 'ledger-id') {
        if (value === 'testnet') {
          options.ledgerId = LedgerId.TESTNET;
        } else if (value === 'mainnet') {
          options.ledgerId = LedgerId.MAINNET;
        } else {
          throw new Error(
            `Invalid ledger id: ${value}. Accepted values are: testnet, mainnet`
          );
        }
      }
    }
  });

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  // Create Hedera client
  let client: Client;
  if (options.ledgerId.toString() === LedgerId.TESTNET.toString()) {
    client = Client.forTestnet();
  } else {
    client = Client.forMainnet();
  }

  // Set operator from environment variables
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  if (operatorId && operatorKey) {
    try {
      client.setOperator(operatorId, operatorKey);
      console.error(green(`✅ Operator set: ${operatorId}`));
    } catch (error) {
      console.error(red(`❌ Failed to set operator: ${error}`));
      throw error;
    }
  } else {
    console.error(
      yellow(
        '⚠️  No operator credentials found in environment variables (HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY)'
      )
    );
  }

  // Create MCP server
  const server = new Server(
    {
      name: 'hedera-treasury',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: 'TRANSFER_HBAR_TOOL',
          description: 'Transfer HBAR from operator account to another account',
          inputSchema: {
            type: 'object',
            properties: {
              to: {
                type: 'string',
                description: 'Destination account ID (e.g., 0.0.12345)',
              },
              amount: {
                type: 'number',
                description: 'Amount of HBAR to transfer',
              },
              memo: {
                type: 'string',
                description: 'Optional transaction memo',
              },
            },
            required: ['to', 'amount'],
          },
        },
        {
          name: 'GET_HBAR_BALANCE_QUERY_TOOL',
          description: 'Query HBAR balance of an account',
          inputSchema: {
            type: 'object',
            properties: {
              accountId: {
                type: 'string',
                description: 'Account ID to query (e.g., 0.0.12345). If not provided, queries operator account.',
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

    if (name === 'TRANSFER_HBAR_TOOL') {
      const { to, amount, memo } = args as { to: string; amount: number; memo?: string };

      try {
        console.error(`💸 Transferring ${amount} HBAR to ${to}...`);

        const transaction = new TransferTransaction()
          .addHbarTransfer(operatorId!, new Hbar(-amount))
          .addHbarTransfer(to, new Hbar(amount));

        if (memo) {
          transaction.setTransactionMemo(memo);
        }

        const txResponse = await transaction.execute(client);
        const receipt = await txResponse.getReceipt(client);

        console.error(green(`✅ Transfer successful: ${txResponse.transactionId}`));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  transactionId: txResponse.transactionId.toString(),
                  status: receipt.status.toString(),
                  from: operatorId,
                  to,
                  amount,
                  memo: memo || null,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        console.error(red(`❌ Transfer failed: ${error.message}`));

        return {
          content: [
            {
              type: 'text',
              text: `Transfer failed: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    if (name === 'GET_HBAR_BALANCE_QUERY_TOOL') {
      const { accountId } = (args as { accountId?: string }) || {};
      const targetAccount = accountId || operatorId;

      try {
        console.error(`🔍 Querying balance for ${targetAccount}...`);

        const balance = await new AccountBalanceQuery()
          .setAccountId(targetAccount!)
          .execute(client);

        console.error(green(`✅ Balance: ${balance.hbars.toString()}`));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  accountId: targetAccount,
                  balance: balance.hbars.toString(),
                  balanceInTinybars: balance.hbars.toTinybars().toString(),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        console.error(red(`❌ Balance query failed: ${error.message}`));

        return {
          content: [
            {
              type: 'text',
              text: `Balance query failed: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  // Connect server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(green('✅ Hedera MCP Server running on stdio'));
}

main().catch((error) => {
  console.error(red(`❌ Fatal error: ${error.message}`));
  process.exit(1);
});
