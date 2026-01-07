import express from "express";
import { DefaultRequestHandler, InMemoryTaskStore } from "@a2a-js/sdk/server";
import {
  jsonRpcHandler,
  agentCardHandler,
  UserBuilder,
} from "@a2a-js/sdk/server/express";
import { IntelligentTreasuryExecutor } from "./executor.js";
import { config, validateConfig } from "./config.js";
import fs from "fs";
import { AgentCard } from "@a2a-js/sdk";

// Validate configuration
try {
  validateConfig();
} catch (error: any) {
  console.error(`❌ Configuration error: ${error.message}`);
  process.exit(1);
}

// Ensure messages directory exists
if (!fs.existsSync(config.messagesDir)) {
  fs.mkdirSync(config.messagesDir, { recursive: true });
  console.log(`📁 Created messages directory: ${config.messagesDir}`);
}

// A2A Agent Card
const agentCard: AgentCard = {
  name: "UK Treasury Agent",
  version: "1.0.0",
  protocolVersion: "0.3.0",
  url: `http://localhost:${config.port}/a2a/jsonrpc`,
  description:
    "UK business treasury agent - autonomous treasury operations and compliance",
  additionalInterfaces: [
    {
      url: `http://localhost:${config.port}/a2a/jsonrpc`,
      transport: "JSONRPC",
    },
  ],
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  defaultInputModes: [],
  defaultOutputModes: [],
  skills: [],
};

// Create Express app
const app = express();

// Create request handler with intelligent executor
const handler = new DefaultRequestHandler(
  agentCard,
  new InMemoryTaskStore(),
  new IntelligentTreasuryExecutor()
);

// Register A2A endpoints
app.use(
  "/.well-known/agent-card.json",
  agentCardHandler({ agentCardProvider: handler })
);
app.use(
  "/a2a/jsonrpc",
  jsonRpcHandler({
    requestHandler: handler,
    userBuilder: UserBuilder.noAuthentication, // For demo - use auth in production
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    entity: config.entity,
    network: config.hederaNetwork,
    accountId: config.hederaAccountId,
  });
});

// Start server
app.listen(config.port, () => {
  console.log(
    "\n🇬🇧 ════════════════════════════════════════════════════════════"
  );
  console.log("   UK TREASURY AGENT - A2A SERVER");
  console.log(
    "   ════════════════════════════════════════════════════════════"
  );
  console.log(`   Status:       Running`);
  console.log(`   Port:         ${config.port}`);
  console.log(`   Network:      ${config.hederaNetwork}`);
  console.log(`   Account:      ${config.hederaAccountId}`);
  console.log(`   Partner:      ${config.partnerAgentUrl}`);
  console.log(
    "   ────────────────────────────────────────────────────────────"
  );
  console.log(
    `   Agent Card:   http://localhost:${config.port}/.well-known/agent-card.json`
  );
  console.log(`   JSON-RPC:     http://localhost:${config.port}/a2a/jsonrpc`);
  console.log(`   Health:       http://localhost:${config.port}/health`);
  console.log(
    "   ════════════════════════════════════════════════════════════\n"
  );
  console.log("✅ Ready to receive messages from partner agent\n");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⚠️  Shutting down UK Treasury Agent...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⚠️  Shutting down UK Treasury Agent...");
  process.exit(0);
});
