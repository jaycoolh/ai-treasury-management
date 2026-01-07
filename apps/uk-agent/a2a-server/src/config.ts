import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment from .env.uk file
dotenv.config({ path: join(__dirname, '../../.env.uk') });

export const config = {
  entity: 'UK' as const,
  port: parseInt(process.env.UK_A2A_PORT || '4000', 10),
  partnerAgentUrl: process.env.UK_PARTNER_AGENT_URL || 'http://localhost:5000',
  hederaAccountId: process.env.UK_HEDERA_ACCOUNT_ID || '',
  hederaPrivateKey: process.env.UK_HEDERA_PRIVATE_KEY || '',
  hederaNetwork: (process.env.HEDERA_NETWORK || 'testnet') as 'testnet' | 'mainnet',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  messagesDir: './messages/inbox',
};

// Validate required configuration
export function validateConfig() {
  const required = [
    'UK_HEDERA_ACCOUNT_ID',
    'UK_HEDERA_PRIVATE_KEY',
    'ANTHROPIC_API_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env.uk file.'
    );
  }
}
