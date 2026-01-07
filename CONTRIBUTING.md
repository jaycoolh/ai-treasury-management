# Contributing to Treasury Agent System

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/treasury-agent-system.git
   cd treasury-agent-system
   ```
3. **Run setup:**
   ```bash
   pnpm run setup
   ```
4. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. **Make changes**
2. **Build and test:**
   ```bash
   pnpm run build
   pnpm run typecheck
   ```
3. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```
4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create a Pull Request**

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add FX rate validation to treasury skill
fix: correct Hedera account ID validation
docs: update deployment guide with AWS instructions
```

## Code Style

- Use TypeScript strict mode
- Follow existing code formatting
- Add JSDoc comments for public APIs
- Keep Skills concise and well-documented

## Pull Request Process

1. **Ensure all checks pass:**
   - Build succeeds
   - Type checking passes
   - No merge conflicts

2. **Update documentation:**
   - Update README if adding features
   - Add/update Skills documentation
   - Update architecture docs if needed

3. **Describe your changes:**
   - Clear PR title
   - Detailed description of changes
   - Link related issues

4. **Wait for review:**
   - Address review feedback
   - Keep PR updated with main branch

## Testing Guidelines

### Manual Testing

Always test your changes:

1. **Build packages:**
   ```bash
   pnpm run build
   ```

2. **Start both agents:**
   ```bash
   # Terminal 1
   pnpm start:uk

   # Terminal 2
   pnpm start:us
   ```

3. **Test functionality:**
   - Test agent communication
   - Verify Hedera operations
   - Check compliance rules

### What to Test

- [ ] Agent starts successfully
- [ ] MCP servers connect
- [ ] Skills load correctly
- [ ] A2A messages send/receive
- [ ] Hedera operations work
- [ ] Compliance validation works
- [ ] No TypeScript errors

## Areas for Contribution

### High Priority

- [ ] Unit tests for MCP servers
- [ ] Integration tests for agent communication
- [ ] Additional treasury Skills (e.g., reporting, forecasting)
- [ ] Enhanced error handling
- [ ] Rate limiting for A2A messages

### Medium Priority

- [ ] UI dashboard for treasury monitoring
- [ ] Additional MCP servers (e.g., database, email)
- [ ] Multi-entity support (>2 entities)
- [ ] Smart contract integration
- [ ] Improved logging and monitoring

### Documentation

- [ ] Video tutorials
- [ ] More example workflows
- [ ] Troubleshooting guides
- [ ] Architecture diagrams

## Skill Contributions

When contributing new Skills:

1. **Follow Skill structure:**
   ```markdown
   ---
   name: skill-name
   description: What it does and when to use it
   ---

   # Skill Name

   ## Overview
   Brief description

   ## Instructions
   Step-by-step guidance
   ```

2. **Keep Skills focused:**
   - One clear purpose per Skill
   - Under 500 lines in SKILL.md
   - Use progressive disclosure for details

3. **Test thoroughly:**
   - Test with different models (Haiku, Sonnet, Opus)
   - Verify agent follows instructions
   - Check edge cases

## MCP Server Contributions

When adding MCP servers:

1. **Follow MCP protocol:**
   - Implement `tools/list` handler
   - Implement `tools/call` handler
   - Use stdio transport

2. **Type safety:**
   - Define input schemas with Zod
   - Add shared types to `packages/shared-types`
   - Export proper TypeScript types

3. **Error handling:**
   - Return meaningful error messages
   - Use `isError: true` for failures
   - Log errors to stderr

## Questions?

- **General questions:** Open a GitHub Discussion
- **Bug reports:** Open a GitHub Issue
- **Security issues:** Email security@company.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
