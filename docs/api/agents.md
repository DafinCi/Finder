# Agent Status API

## `GET /api/agent/status`

- **Purpose**: report which models and memory network the agent is actually using.
- **Auth**: session.
- **Output**: provider, primary model, agent model, fallback model, memory network,
  and whether MemWal is configured.
- **Security**: model names and network are not secrets. API keys are never
  returned.
- **Why it exists**: the UI and judges should be able to verify the real
  configuration instead of trusting a claim.

## Related

- [../ai/agent.md](../ai/agent.md)
- [../ai/tools.md](../ai/tools.md)
