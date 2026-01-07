# Deployment Guide

## Overview

This guide covers deploying the Treasury Agent System from local development to production environments.

## Deployment Environments

### Local Development

**Current setup** - Both agents on localhost

- UK Agent: `http://localhost:4000`
- US Agent: `http://localhost:5001`
- Network: Hedera testnet
- Auth: None

### Staging

**Single-server deployment** for testing

- Both agents on same server, different ports
- Network: Hedera testnet
- Auth: API key
- HTTPS with self-signed cert

### Production

**Multi-server deployment**

- UK Agent: `https://uk-treasury.company.com`
- US Agent: `https://us-treasury.company.com`
- Network: Hedera mainnet
- Auth: OAuth 2.0 or mutual TLS
- Load balancing, monitoring, backups

## Pre-Deployment Checklist

- [ ] Build all packages successfully
- [ ] Type checking passes
- [ ] Environment variables configured
- [ ] Hedera accounts funded (mainnet)
- [ ] API keys secured
- [ ] Skills reviewed and approved
- [ ] Compliance thresholds verified
- [ ] Backup and recovery plan in place

## Build for Production

```bash
# Clean previous builds
pnpm run clean

# Install production dependencies
pnpm install --frozen-lockfile --prod

# Build all packages
pnpm run build

# Verify builds
ls -la packages/mcp-hedera/dist/
ls -la packages/mcp-a2a/dist/
ls -la apps/uk-agent/a2a-server/dist/
ls -la apps/us-agent/a2a-server/dist/
```

## Environment Configuration

### Production Environment Variables

**apps/uk-agent/.env.production**

```bash
# UK Agent Production Config
UK_HEDERA_ACCOUNT_ID=0.0.xxxxxx
UK_HEDERA_PRIVATE_KEY=302e...  # From secure key management
UK_A2A_PORT=4000
UK_PARTNER_AGENT_URL=https://us-treasury.company.com

# Shared Config
HEDERA_NETWORK=mainnet
ANTHROPIC_API_KEY=sk-ant-...  # From secure storage
LOG_LEVEL=info
NODE_ENV=production
```

**apps/us-agent/.env.production**

```bash
# US Agent Production Config
US_HEDERA_ACCOUNT_ID=0.0.yyyyyy
US_HEDERA_PRIVATE_KEY=302e...  # From secure key management
US_A2A_PORT=5001
US_PARTNER_AGENT_URL=https://uk-treasury.company.com

# Shared Config
HEDERA_NETWORK=mainnet
ANTHROPIC_API_KEY=sk-ant-...  # From secure storage
LOG_LEVEL=info
NODE_ENV=production
```

### Secrets Management

**Recommended: AWS Secrets Manager / HashiCorp Vault**

```bash
# Store secrets
aws secretsmanager create-secret \
  --name treasury-uk-hedera-key \
  --secret-string "302e..."

# Retrieve at runtime
aws secretsmanager get-secret-value \
  --secret-id treasury-uk-hedera-key \
  --query SecretString \
  --output text
```

## Docker Deployment

### Dockerfile

**apps/uk-agent/Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/mcp-hedera/package.json ./packages/mcp-hedera/
COPY packages/mcp-a2a/package.json ./packages/mcp-a2a/
COPY apps/uk-agent/package.json ./apps/uk-agent/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source code
COPY packages/ ./packages/
COPY apps/uk-agent/ ./apps/uk-agent/

# Build packages
RUN pnpm --filter @treasury/shared-types build
RUN pnpm --filter @treasury/mcp-hedera build
RUN pnpm --filter @treasury/mcp-a2a build
RUN pnpm --filter uk-agent build

# Create message directories
RUN mkdir -p apps/uk-agent/messages/inbox apps/uk-agent/messages/archive

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD curl -f http://localhost:4000/health || exit 1

# Start server
WORKDIR /app/apps/uk-agent
CMD ["node", "a2a-server/dist/index.js"]
```

### Docker Compose

**docker-compose.yml**

```yaml
version: "3.8"

services:
  uk-agent:
    build:
      context: .
      dockerfile: apps/uk-agent/Dockerfile
    ports:
      - "4000:4000"
    environment:
      - UK_HEDERA_ACCOUNT_ID=${UK_HEDERA_ACCOUNT_ID}
      - UK_HEDERA_PRIVATE_KEY=${UK_HEDERA_PRIVATE_KEY}
      - UK_PARTNER_AGENT_URL=http://us-agent:5001
      - HEDERA_NETWORK=mainnet
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NODE_ENV=production
    volumes:
      - uk-messages:/app/apps/uk-agent/messages
    networks:
      - treasury-network
    restart: unless-stopped

  us-agent:
    build:
      context: .
      dockerfile: apps/us-agent/Dockerfile
    ports:
      - "5001:5001"
    environment:
      - US_HEDERA_ACCOUNT_ID=${US_HEDERA_ACCOUNT_ID}
      - US_HEDERA_PRIVATE_KEY=${US_HEDERA_PRIVATE_KEY}
      - US_PARTNER_AGENT_URL=http://uk-agent:4000
      - HEDERA_NETWORK=mainnet
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NODE_ENV=production
    volumes:
      - us-messages:/app/apps/us-agent/messages
    networks:
      - treasury-network
    restart: unless-stopped

volumes:
  uk-messages:
  us-messages:

networks:
  treasury-network:
    driver: bridge
```

### Deploy with Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f uk-agent
docker-compose logs -f us-agent

# Stop services
docker-compose down
```

## Cloud Deployment (AWS)

### Architecture

```
┌─────────────────────────────────────────────┐
│  Route 53                                   │
│  uk-treasury.company.com → UK ALB           │
│  us-treasury.company.com → US ALB           │
└─────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌──────────────┐          ┌──────────────┐
│  UK ALB      │          │  US ALB      │
│  (HTTPS)     │          │  (HTTPS)     │
└──────────────┘          └──────────────┘
         │                        │
         ▼                        ▼
┌──────────────┐          ┌──────────────┐
│  ECS/Fargate │          │  ECS/Fargate │
│  UK Agent    │          │  US Agent    │
│  Task        │ ←─ A2A ─→│  Task        │
└──────────────┘          └──────────────┘
         │                        │
         └────────┬───────────────┘
                  ▼
         ┌────────────────┐
         │ Hedera Mainnet │
         └────────────────┘
```

### ECS Task Definition

**uk-agent-task.json**

```json
{
  "family": "uk-treasury-agent",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "uk-agent",
      "image": "xxxxxxxx.dkr.ecr.us-east-1.amazonaws.com/uk-treasury-agent:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "secrets": [
        {
          "name": "UK_HEDERA_PRIVATE_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:xxx:secret:uk-hedera-key"
        },
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:xxx:secret:anthropic-key"
        }
      ],
      "environment": [
        { "name": "UK_HEDERA_ACCOUNT_ID", "value": "0.0.xxxxxx" },
        {
          "name": "UK_PARTNER_AGENT_URL",
          "value": "https://us-treasury.company.com"
        },
        { "name": "HEDERA_NETWORK", "value": "mainnet" },
        { "name": "NODE_ENV", "value": "production" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/uk-treasury-agent",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:4000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### Deployment Script

```bash
#!/bin/bash

# Build and push Docker image
docker build -t uk-treasury-agent -f apps/uk-agent/Dockerfile .
docker tag uk-treasury-agent:latest \
  xxxxxxxx.dkr.ecr.us-east-1.amazonaws.com/uk-treasury-agent:latest
docker push xxxxxxxx.dkr.ecr.us-east-1.amazonaws.com/uk-treasury-agent:latest

# Update ECS service
aws ecs update-service \
  --cluster treasury-cluster \
  --service uk-treasury-agent \
  --force-new-deployment

# Wait for deployment
aws ecs wait services-stable \
  --cluster treasury-cluster \
  --services uk-treasury-agent

echo "UK Treasury Agent deployed successfully"
```

## Security Hardening

### HTTPS/TLS

**Using Let's Encrypt + Nginx**

```nginx
server {
    listen 443 ssl http2;
    server_name uk-treasury.company.com;

    ssl_certificate /etc/letsencrypt/live/uk-treasury.company.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/uk-treasury.company.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### A2A Authentication

**Update AgentCard with OAuth 2.0**

```typescript
const agentCard = {
  name: "UK Treasury Agent",
  // ... other fields
  securitySchemes: {
    oauth2: {
      type: "oauth2",
      flows: {
        clientCredentials: {
          tokenUrl: "https://auth.company.com/oauth/token",
          scopes: {
            "treasury:read": "Read treasury data",
            "treasury:write": "Execute transfers",
          },
        },
      },
    },
  },
  security: [{ oauth2: ["treasury:read", "treasury:write"] }],
};
```

### Network Security

```bash
# Firewall rules (ufw)
ufw allow 22/tcp    # SSH
ufw allow 443/tcp   # HTTPS
ufw deny 4000/tcp   # Block direct A2A access
ufw enable

# Use VPN or private network for A2A communication
# Or restrict by IP:
ufw allow from <partner-ip> to any port 4000
```

## Monitoring and Logging

### CloudWatch Logs

```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/uk-treasury-agent
aws logs create-log-group --log-group-name /ecs/us-treasury-agent

# Stream logs
aws logs tail /ecs/uk-treasury-agent --follow
```

### Metrics

**Monitor these metrics:**

- A2A message volume
- Message processing latency
- Hedera transaction success rate
- Agent error rate
- API costs (Anthropic)

**CloudWatch Alarms:**

```bash
# High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name treasury-high-error-rate \
  --metric-name Errors \
  --namespace Treasury \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# Agent unavailable
aws cloudwatch put-metric-alarm \
  --alarm-name treasury-agent-down \
  --metric-name HealthCheckStatus \
  --namespace Treasury \
  --statistic Minimum \
  --period 60 \
  --threshold 1 \
  --comparison-operator LessThanThreshold
```

## Backup and Recovery

### Message Backup

```bash
# Automated daily backup
0 2 * * * tar -czf /backups/messages-$(date +\%Y\%m\%d).tar.gz \
  /app/apps/uk-agent/messages/archive \
  /app/apps/us-agent/messages/archive

# Retention: 30 days
find /backups -name "messages-*.tar.gz" -mtime +30 -delete
```

### Database Backup (if using persistent TaskStore)

```bash
# PostgreSQL backup
pg_dump treasury_tasks > treasury_tasks_$(date +\%Y\%m\%d).sql

# Restore
psql treasury_tasks < treasury_tasks_20260107.sql
```

## Disaster Recovery

### Failover Plan

1. **Primary site failure**

   - DNS failover to backup site (Route 53 health checks)
   - Restore latest message backups
   - Resume operations within 15 minutes

2. **Agent corruption**

   - Redeploy from Docker image
   - Restore message archive
   - Verify Hedera connectivity

3. **Hedera network issues**
   - Queue transfers in local storage
   - Monitor Hedera status page
   - Replay queued transfers when recovered

## Cost Optimization

### Anthropic API Costs

```bash
# Use Haiku for simple tasks
# Set in .claude/settings.json:
{
  "model": "claude-haiku-4-20250107"  # For message processing
}

# Reserve Opus/Sonnet for complex compliance checks
```

### Hedera Costs

- Batch small transfers
- Use scheduled transfers for non-urgent operations
- Monitor account balances and top up efficiently

### Infrastructure

- Use Fargate Spot for non-critical tasks
- Scale down during off-hours
- Use S3 for message archives (cheaper than EBS)

## Rolling Updates

```bash
# Zero-downtime deployment
# 1. Deploy new version to staging
# 2. Run smoke tests
# 3. Blue-green deployment:

# Start new version
docker-compose -f docker-compose.new.yml up -d

# Verify health
curl https://uk-treasury-new.company.com/health

# Switch DNS
# Update Route 53 CNAME

# Monitor for 1 hour
# If stable, decommission old version
```

## Troubleshooting Production Issues

### High Latency

```bash
# Check CloudWatch metrics
# Investigate:
# - Anthropic API response times
# - Hedera network latency
# - A2A message queue depth

# Scale horizontally if needed
aws ecs update-service --desired-count 2
```

### Message Loss

```bash
# Check message archives
ls -la /app/apps/uk-agent/messages/archive/

# Restore from backup if needed
tar -xzf /backups/messages-20260107.tar.gz -C /app/apps/uk-agent/messages/

# Replay missed messages
# (Implement replay logic in agent)
```

## Production Readiness Checklist

- [ ] HTTPS/TLS enabled
- [ ] Authentication configured (OAuth 2.0)
- [ ] Secrets in secure storage (not env files)
- [ ] Monitoring and alerting active
- [ ] Backup automation running
- [ ] Disaster recovery plan tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Compliance review approved
- [ ] Runbook documented
- [ ] On-call rotation established
