import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment from .env.us file
dotenv.config({ path: join(__dirname, "../../.env.us") });

export const config = {
  entity: "US" as const,
  port: parseInt(process.env.US_A2A_PORT || "5001", 10),
  partnerAgentUrl: process.env.US_PARTNER_AGENT_URL || "http://localhost:4000",
  partnerHederaAccountId: process.env.US_PARTNER_HEDERA_ACCOUNT_ID || "",
  hederaAccountId: process.env.US_HEDERA_ACCOUNT_ID || "",
  hederaPrivateKey: process.env.US_HEDERA_PRIVATE_KEY || "",
  hederaNetwork: (process.env.HEDERA_NETWORK || "testnet") as
    | "testnet"
    | "mainnet",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  logLevel: process.env.LOG_LEVEL || "info",
  messagesDir: "./messages/inbox",
};

// Validate required configuration
export function validateConfig() {
  const required = [
    "US_HEDERA_ACCOUNT_ID",
    "US_HEDERA_PRIVATE_KEY",
    "ANTHROPIC_API_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Please check your .env.us file."
    );
  }
}
