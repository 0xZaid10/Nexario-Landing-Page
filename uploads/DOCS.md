# Nexario Documentation

---

## Getting Started

### Prerequisites

Before running Nexario you need:

- **Node.js 22** — required. Use `nvm use 22`. Earlier versions will fail on ESM imports.
- **MetaMask Flask** — the experimental MetaMask build that supports ERC-7715. Regular MetaMask does not have `wallet_grantPermissions`. Install from [metamask.io/flask](https://metamask.io/flask).
- **Base mainnet USDC** — all agent fees, relay fees, and transfers are in USDC on Base. The user wallet needs USDC, not ETH.
- **Venice AI API key** — for agent inference. Get one at [venice.ai](https://venice.ai).
- **Alchemy Base RPC** — or any Base mainnet RPC. Used for on-chain reads and the Executor agent.
- **0x API key** — for swap quotes (free tier). Get one at [dashboard.0x.org](https://dashboard.0x.org). Swap execution is currently blocked by ERC-7715 enforcer constraints — see DEX Swaps section.

### Installation

```bash
git clone https://github.com/0xZaid10/nexario
cd nexario

# Install backend
nvm use 22
npm install

# Install frontend
cd frontend && npm install && cd ..
```

### Environment Variables

Create `.env` in the project root:

```env
# Required
PRIVATE_KEY=0x...
# Deployer wallet private key. Signs on-chain lease creation,
# oracle reputation writes, and agent registration.
# Address: 0x98a738D21A0EFF97Ee2e68508CD921444553fe0e

ORACLE_PRIVATE_KEY=0x...
# Oracle wallet private key. Writes reputation tags to
# ReputationRegistry. Must match the oracle address set
# in the contract constructor.
# Address: 0x1C280993F1423dc3DC050aFE5bfe5FbBDb7b05c3

BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
# Base mainnet RPC. Used for all on-chain reads and the
# executor agent's balance/transfer operations.

VENICE_API_KEY=your_venice_api_key
# Venice AI API key for all agent inference.
# All 10 agents use this key. The key needs access to
# Qwen3 235B, Kimi K2, Gemma 4 TEE, and TTS models.

ZERO_EX_API_KEY=your_0x_api_key
# 0x Swap API key for DEX quotes on Base.
# Free tier sufficient. Swap execution currently blocked
# by ERC20PeriodTransferEnforcer — see DEX Swaps section.

# Optional
DATABASE_URL=./nexario.db
# SQLite database path. Defaults to project root.
# Contains sessions, tasks, agents, chat threads,
# messages, reputation cache, scheduled tasks.

PORT=3000
# Backend API port. Default 3000.

DEPLOYER_ADDRESS=0x98a738D21A0EFF97Ee2e68508CD921444553fe0e
# Deployer wallet address. Used in lease creation logs
# and agent registry ownership checks.

# Pre-deployed on Base mainnet — no changes needed
AGENT_REGISTRY_ADDRESS=0x3a7C05101aC0Bb99e06026855459d376d7906f15
REPUTATION_REGISTRY_ADDRESS=0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82
```

### Running

```bash
# Terminal 1: Backend
nvm use 22
npm run dev
# Server starts at http://localhost:3000
# Logs: pino structured JSON at INFO level

# Terminal 2: Frontend
cd frontend
npm run dev
# UI at http://localhost:5173
```

On startup the backend:
1. Connects to SQLite and runs Drizzle migrations
2. Loads all 10 agents from the AgentRegistry on Base
3. Warms the reputation cache from ReputationRegistry
4. Starts the ERC-8004 event indexer
5. Starts the node-cron scheduler (checks every 60 seconds)
6. Opens the Express API server on `PORT`

---

## Core Concepts

### Authority Leasing

Authority leasing is the model Nexario uses for AI agent delegation. Users do not give agents their private key. Instead they sign a single ERC-7715 permission that creates a bounded authority budget — an ABI-encoded delegation object that encodes four hard constraints: amount, duration, scope, and delegation depth.

The coordinator receives this authority and sub-delegates scoped portions to each agent it dispatches. Agents redeem their sub-delegations through 1Shot's ERC-7710 relay. Every redemption is verified on-chain by the MetaMask DelegationManager before any USDC moves.

Every execution consumes authority. Every execution updates reputation. Future authority decisions depend on reputation — users set minimum reputation thresholds at authorization time, and agents below threshold are blocked before any delegation is redeemed.

### ERC-7715 Permissions

ERC-7715 is the `wallet_grantPermissions` standard implemented by MetaMask Flask. It lets users create permission grants — structured objects that authorize external systems to perform scoped actions on their behalf.

Nexario uses the `erc20-token-periodic` permission type, which creates a periodic USDC spending allowance. The grant returns a `context` field containing the ABI-encoded delegation — 2,882 bytes that encode the full ERC-7710 chain rooted at the MetaMask DelegationManager.

```javascript
const result = await window.ethereum.request({
  method: 'wallet_grantPermissions',
  params: [{
    chainId: '0x2105',  // Base mainnet
    address: '0x26A529124f0bBf9aF9D8f9F84a43EfE47Cf1199a',  // 1Shot target
    permissions: [{
      type: 'erc20-token-periodic',
      isAdjustmentAllowed: true,
      data: {
        periodAmount: '1000000',   // $1 USDC (6 decimals)
        periodDuration: 3600,      // 1 hour in seconds
        startTime: Math.floor(Date.now() / 1000),
        justification: 'Nexario agent network',
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      }
    }],
    expiry: Math.floor(Date.now() / 1000) + 3600
  }]
})

// The context field IS the delegation — pass this to /api/authorize
const permissionsContext = result[0].context
const delegationManager = result[0].delegationManager
// delegationManager: 0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3
```

The `context` field (not `permissionsContext` — that field is a different thing in the Flask response) contains the ABI-encoded delegation used by 1Shot. This is a critical implementation detail: earlier versions of the Flask docs use `permissionsContext` but the actual field containing the delegation is `context`.

### ERC-7710 Redelegation

ERC-7710 defines how delegations are redeemed and how sub-delegations are created. The coordinator receives the root delegation and creates per-agent sub-delegations with tighter constraints. Each agent redeems its sub-delegation through 1Shot's `send7710Transaction`.

The full delegation chain:
```
User (ERC-7715 root grant)
  → Coordinator (root delegate)
    → Research agent (sub-delegation, $0.10 cap)
    → Audit agent (sub-delegation, $0.15 cap)
    → Executor agent (sub-delegation, $0.05 + transfer amount)
    → Report agent (sub-delegation, $0.05 cap)
```

Each sub-delegation is validated on-chain by the `ERC20PeriodTransferEnforcer` caveat before 1Shot executes the transaction. If validation fails the bundle reverts cleanly — no partial execution.

### EIP-7702 Smart Account Upgrade

EIP-7702 is what makes Nexario work without requiring users to deploy a new smart contract wallet. The MetaMask DelegationManager (`0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3`) is an EIP-7702 stateless delegator.

When a user signs ERC-7715, their regular EOA (standard MetaMask Flask address) gains smart account capabilities through the DelegationManager — no contract deployment, no migration, no new seed phrase. The user's existing address stays the same. EIP-7702 temporarily designates the DelegationManager as the execution logic for delegated actions.

This means any MetaMask Flask user gets gasless execution, scoped permissions, and on-chain delegation chains without touching their wallet setup. Any EOA becomes a smart account.

### Session Budgets

Each Nexario session has a USDC budget that decrements as agents execute. Budget tracking happens at two levels:

**On-chain:** The ERC-7715 `erc20-token-periodic` caveat enforces a hard spending cap per period. The `ERC20PeriodTransferEnforcer` validates each bundle against the remaining allowance before execution. This is cryptographic — the backend cannot override it.

**Off-chain:** The backend `sessions` table tracks `budgetUsdc` and `spentUsdc` for UI display and pre-flight checks. The executor agent checks remaining budget before submitting transfers and blocks if the amount exceeds what's left.

Budget is deducted using actual fees paid (relay fee + agent fee per execution), not the sub-task budget allocation. This means the displayed remaining budget reflects real on-chain spending.

---

## Agents

### Overview

All 10 Nexario agents are registered as ERC-8004 NFTs on the AgentRegistry (`0x3a7C05101aC0Bb99e06026855459d376d7906f15`) on Base mainnet. Each token's URI is a base64-encoded JSON containing the agent's Venice model ID, TEE status, x402 support, capabilities, fee schedule, and A2A endpoint.

Agents are loaded from the contract on startup and cached in SQLite. Reputation scores are cached from the ReputationRegistry and refreshed after each task.

All agents expose an x402 paywall at `POST /api/agents/:agentId/call`. Without a payment proof header the endpoint returns `402 Payment Required` with payment instructions. With a valid `X-Payment-Proof` header (a confirmed 1Shot task ID) the agent executes and returns results.

### Coordinator — Agent #1

**Venice model:** `qwen3-235b-a22b-instruct-2507`  
**Fee:** $0.05 per task  
**ERC-8004 token:** [#1 on Basescan](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=1)

The coordinator is the entry point for every task. It receives the user message, classifies content privacy, plans which agents to dispatch, creates ERC-7710 sub-delegations, and synthesizes the final result after all sub-agents complete.

Planning uses Venice's Qwen3 235B with `temperature: 0` and `reasoningEffort: 'low'` for deterministic, fast plan generation. Plans are returned as JSON with `subTasks` array — each entry specifying agent name, budget, description, and optional `executionParams` for the executor agent.

Privacy classification runs in parallel with planning. The classifier uses keyword patterns and a Venice fast-classify call to detect medical, legal, financial, personal, corporate, or surveillance content. If `score > 65`, the coordinator uses Venice TEE models for planning and routes sensitive sub-tasks to counsel, intelligence, or reflection agents.

After all sub-tasks complete, the coordinator synthesizes results using Venice Qwen3 235B. The synthesis prompt includes all sub-agent outputs and the confirmed executor transaction hash if present.

The coordinator retries planning up to 5 times on Venice 429 rate limit errors, with 20s and 40s delays. Synthesis retries similarly.

### Research — Agent #2

**Venice model:** `kimi-k2-6` with web search enabled  
**Fee:** $0.10 per task  
**ERC-8004 token:** [#2 on Basescan](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=2)  
**Live reputation:** $310+ earned, 30+ tasks

The research agent fetches live data using Venice's Kimi K2.6 model with `enableWebSearch: true`. Venice's native web search returns live results inside the inference response — no external search API, no rate limits, no stale cached data.

Capable of fetching live token prices (ETH, BTC, SOL, Base ecosystem tokens), on-chain wallet history and balances, DeFi protocol TVL and APY metrics, gas price conditions on Base and Ethereum, recent news and market sentiment, and smart contract addresses and verification status.

The research agent is almost always the first sub-task in any pipeline. Its output is passed as context to audit, executor, and report agents.

### Audit — Agent #3

**Venice model:** `qwen3-235b-a22b-thinking-2507`  
**Fee:** $0.15 per task  
**ERC-8004 token:** [#3 on Basescan](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=3)

The audit agent uses Qwen3 235B in Thinking mode — an extended reasoning variant that reasons step-by-step before producing output. This produces deeper risk analysis than standard inference and is particularly effective for smart contract risk scoring and multi-factor financial exposure assessment.

Audit runs after research and before executor in transaction pipelines. It evaluates counterparty risk, slippage exposure, contract safety, MEV vulnerability, and chain-specific risks. Risk is scored 0-100 with specific mitigation recommendations.

### Report — Agent #4

**Venice model:** `kimi-k2-5` + Venice TTS  
**Fee:** $0.05 per task  
**ERC-8004 token:** [#4 on Basescan](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=4)

The report agent synthesizes research and audit outputs into executive-level summaries, then generates an audio brief using Venice TTS (`af_heart` voice, MP3 format). Audio is generated from the final coordinator synthesis — not the report agent's own draft — ensuring the audio matches the actual result.

### Monitor — Agent #5

**Venice model:** `qwen3-235b-a22b-instruct-2507` (condition parsing only)  
**Fee:** $0.05 per task  
**ERC-8004 token:** [#5 on Basescan](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=5)

The monitor agent parses natural language conditions using Venice, then registers real-time Binance WebSocket price watches. When a condition is met, the monitor fires a full autonomous agent pipeline using the stored `permissionsContext` — no user interaction required.

Binance WebSocket (`wss://stream.binance.com/ws/{pair}@trade`) pushes every trade tick in real time. The monitor fires immediately when price crosses the threshold — sub-second latency vs. polling approaches.

Supported condition types:
- **price** — any Binance-listed pair (ETH, BTC, SOL, AERO, BRETT, VIRTUAL, TOSHI, DEGEN, and more)
- **percentage** — "drops 5%" calculates threshold from current price via Binance REST before watching
- **wallet** — polls Alchemy Base RPC every 15 minutes for address activity

Wallet watches are persisted to `scheduled_tasks` SQLite table. Price watches live in memory (lost on restart) — by design, since stale watches with wrong thresholds are worse than missing watches.

### Executor — Agent #6

**Venice model:** None (pure calldata builder)  
**Fee:** $0.05 per task  
**ERC-8004 token:** [#6 on Basescan](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=6)

The executor agent builds calldata and submits on-chain actions as part of 1Shot relay bundles. No Venice inference — fully deterministic.

Supported actions:
- **USDC transfer** — `send X USDC to 0x...` — builds ERC-20 `transfer(address,uint256)` calldata, validates recipient address, enforces budget cap, adds as 3rd execution in 1Shot bundle alongside relay fee and agent fee
- **ETH transfer** — `send X ETH to 0x...` — builds WETH transfer calldata (WETH address on Base: `0x4200000000000000000000000000000000000006`)

DEX swaps (0x Permit2) are built but currently blocked by `ERC20PeriodTransferEnforcer:invalid-execution-length` — the enforcer only accepts standard 68-byte `transfer()` calldata. See DEX Swaps section.

Budget enforcement: the executor checks remaining session budget before submitting. If the transfer amount exceeds remaining budget, it returns an error without submitting any transaction.

### Counsel — Agent #7

**Venice model:** `e2ee-qwen3-6-35b-a3b` (Venice TEE)  
**Fee:** $0.20 per task  
**TEE:** Hardware-attested · Zero data retention  
**ERC-8004 token:** [#7 on Basescan](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=7)

Legal and compliance analysis in a Venice hardware-attested secure enclave. Zero data retention — not stored, not logged, not trained on. Hardware constraint, not policy.

The coordinator routes to counsel automatically when it detects legal content (contracts, NDAs, litigation, IP, compliance questions). Users can also explicitly request counsel for any query.

### Reputation — Agent #8

**Venice model:** `kimi-k2-6` with web search  
**Fee:** $0.08 per task  
**ERC-8004 token:** [#8 on Basescan](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=8)

Wallet identity scoring and on-chain history analysis. Analyzes transaction patterns, interaction history, DeFi positions, and behavioral signals to assess counterparty trust. Uses Venice web search for cross-referencing addresses against known labels and reports.

### Intelligence — Agent #9

**Venice model:** `e2ee-qwen3-6-35b-a3b` (Venice TEE)  
**Fee:** $0.15 per task  
**TEE:** Hardware-attested · Zero data retention  
**ERC-8004 token:** [#9 on Basescan](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=9)

Competitive and business intelligence in a Venice TEE enclave. Market positioning, protocol comparison, competitor analysis, investment thesis research — all with hardware-level privacy guarantees.

### Reflection — Agent #10

**Venice model:** `e2ee-gemma-4-26b-a4b-uncensored-p` (Venice TEE, uncensored)  
**Fee:** $0.10 per task  
**TEE:** Hardware-attested · Uncensored · Zero data retention  
**ERC-8004 token:** [#10 on Basescan](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=10)

Personal journaling and wellness reasoning using Venice's uncensored Gemma 4 26B model in a TEE enclave. No content filters. No data retention. The coordinator routes personal and wellness content here automatically.

---

## 1Shot Integration

### How It Works

1Shot is the ERC-7710 relay layer that converts delegation proofs into confirmed Base mainnet transactions. The user's `permissionsContext` (from ERC-7715) is passed to 1Shot as the authorization for each bundle. 1Shot validates the delegation chain on-chain, pays Base gas from its own balance, and deducts only USDC from the user's delegated budget.

Every 1Shot bundle in Nexario is a `send7710Transaction` call with 2-3 executions:

```
Execution 1: transfer(1Shot_feeCollector, $0.01)   // relay fee
Execution 2: transfer(agentWallet, agentFeeAtoms)  // agent fee
Execution 3: transfer(recipient, amount)            // user action (optional)
```

All three land in one Base transaction. One Basescan entry. If any execution fails, all revert.

### API Methods Used

**`relayer_getCapabilities`**  
Called once on startup per chain. Returns supported chains, accepted tokens, target contract addresses, and fee collector address. Result is cached indefinitely — capabilities don't change between restarts.

```javascript
const caps = await rpc7710('relayer_getCapabilities', { chainId: '8453' })
// caps.targetAddress: '0x26a529124f0bbf9af9d8f9f84a43efe47cf1199a'
// caps.feeCollector: '0xE936e8FAf4A5655469182A49a505055B71C17604'
// caps.acceptedTokens: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913']
```

**`relayer_getFeeData`**  
Called before each agent execution to get the current relay fee. Always $0.01 USDC (10,000 atoms) on Base. Used to build the relay fee execution included in every bundle.

```javascript
const fee = await rpc7710('relayer_getFeeData', { 
  chainId: '8453',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
})
// fee.minFee: '10000' (atoms, 6 decimals = $0.01)
// fee.feeCollector: '0xE936e8FAf4A5655469182A49a505055B71C17604'
```

**`relayer_estimateFee`** (aliased as `relayer_estimate7710Transaction`)  
Pre-flight bundle simulation. Validates the delegation, checks enforcer constraints, and returns whether the bundle would succeed. If `ERC20PeriodTransferEnforcer:invalid-execution-length` is returned here, the bundle is not submitted.

```javascript
const estimate = await rpc7710('relayer_estimate7710Transaction', {
  chainId: '8453',
  transactions: [{
    permissionContext: [decodedDelegation],
    executions: [
      { target: USDC, value: '0x0', data: relayFeeCalldata },
      { target: USDC, value: '0x0', data: agentFeeCalldata }
    ]
  }]
})
// estimate.success: true
// estimate.requiredPaymentAmount: '10000'
// estimate.context: enrichedContext (used in send7710Transaction)
```

**`send7710Transaction`**  
Submits the ERC-7710 bundle. Returns a task ID immediately. The transaction confirms on Base within seconds.

```javascript
const result = await rpc7710('send7710Transaction', {
  chainId: '8453',
  transactions: [{
    permissionContext: [decodedDelegation],
    executions: [
      { target: USDC, value: '0x0', data: relayFeeCalldata },
      { target: USDC, value: '0x0', data: agentFeeCalldata },
      { target: USDC, value: '0x0', data: userTransferCalldata }  // optional
    ]
  }],
  context: estimate.context  // from estimate step
})
// result.taskId: '0x4e1924d0f9f741fae55177f3186b07f1f34c3ca88b66669521327ac862af729e'
```

**`relayer_getStatus`**  
Resolves the real Base transaction hash from the 1Shot task ID. Called after submission — polls until `receipt.transactionHash` is present. This is the hash shown to users in the transaction drawer and referenced in the executor note to the synthesis.

```javascript
const status = await rpc7710('relayer_getStatus', { 
  id: '0x4e1924d0...', 
  logs: false 
})
// status.receipt.transactionHash: '0x6a3a4d1c97359eff...'
```

### Bundle Structure

Each 1Shot bundle follows this pattern:

```typescript
{
  chainId: '8453',
  transactions: [{
    permissionContext: [
      {
        delegate: '0x26a529...',      // 1Shot target
        delegator: userAddress,
        authority: '0xff...ff',        // root authority
        caveats: [{
          enforcer: '0x474e3a...',     // ERC20PeriodTransferEnforcer
          terms: encodedTerms          // token + amount + period
        }],
        salt: '0x0...0',
        signature: userFlaskSignature
      }
    ],
    executions: [
      { target: USDC, value: '0x0', data: relayFeeTransferCalldata },
      { target: agentWallet, value: '0x0', data: agentFeeTransferCalldata },
      // optional 3rd execution for user action
    ]
  }]
}
```

The `permissionContext` array is decoded from the `context` field of the ERC-7715 grant using `decodeAbiParameters` with the delegation struct ABI.

---

## Venice AI

### Models

Nexario uses 8 Venice model families across 10 agents:

| Model ID | Agent | Notes |
|----------|-------|-------|
| `qwen3-235b-a22b-instruct-2507` | Coordinator, Counsel (fallback) | Largest model in stack |
| `kimi-k2-6` | Research, Reputation | Web search enabled |
| `qwen3-235b-a22b-thinking-2507` | Audit | Extended reasoning |
| `kimi-k2-5` | Report | TTS handoff |
| `e2ee-qwen3-6-35b-a3b` | Counsel, Intelligence | Venice TEE enclave |
| `e2ee-gemma-4-26b-a4b-uncensored-p` | Reflection | TEE + uncensored |
| `qwen3-5-9b` | Monitor | Fast condition parsing |
| Venice TTS (`af_heart`) | Report | MP3 audio generation |

### TEE Enclaves

Venice TEE models (`e2ee-*` prefix) run in hardware-attested secure enclaves. Zero data retention — inputs and outputs are not stored, not logged, and not used for training. Hardware constraint, not policy.

The coordinator routes to TEE models automatically based on privacy classification:
- `score > 65` → planning uses TEE model
- `legal` category → counsel agent
- `corporate` category → intelligence agent  
- `personal` or `medical` category → reflection agent
- `surveillance` category excluded from TEE routing (crypto monitoring is not surveillance)

### Web Search

Kimi K2.6 has Venice's native web search enabled via `enableWebSearch: true` in the chat request. Web search results are injected into the model context automatically — no separate API call, no external search key needed.

### TTS

Venice TTS is called after coordinator synthesis completes. The final synthesis text (capped at 800 characters) is passed to `textToSpeech()` with `voice: 'af_heart'` and `format: 'mp3'`. The audio data URL is included in the `task_complete` SSE event and stored in `chat_messages`.

### x402 Integration

Venice uses x402 for its own billing. Nexario mirrors this — all 10 agents expose x402 paywalls. The Venice x402 top-up uses `createPaymentHeader` from `x402/client` with the VENICE_WALLET_PRIVATE_KEY to fund the Venice inference balance. This top-up is a standard on-chain USDC transfer — requires ETH for gas from the Venice wallet.

---

## x402 Protocol

### Agent Paywalls

All 10 Nexario agents expose HTTP 402 paywalls at `POST /api/agents/:agentId/call`. Without payment:

```
HTTP/1.1 402 Payment Required
X-Payment-Required: true
X-Payment-Amount: 100000
X-Payment-Token: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
X-Payment-Recipient: {agentWalletAddress}
X-Payment-Chain: 8453
X-Payment-Method: x402+1shot
Content-Type: application/json

{
  "error": "Payment Required",
  "paymentRequired": {
    "amount": "100000",
    "amountUsdc": 0.10,
    "token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "recipient": "0x837D25DD587d7288c09b868aFC9521df343C1788",
    "chainId": 8453,
    "method": "x402",
    "endpoint": "/api/agents/2/call",
    "instructions": "Send payment via 1Shot relay on Base mainnet, then retry with X-Payment-Proof header"
  }
}
```

### Payment Flow

1. Caller hits `POST /api/agents/:agentId/call` without proof → receives 402
2. Caller pays via 1Shot relay (ERC-7710 bundle transferring `amount` USDC to `recipient`)
3. Caller retries with `X-Payment-Proof: {1ShotTaskId}` header
4. Agent verifies proof exists and executes Venice inference
5. Agent returns result

The `X-Payment-Method: x402+1shot` header is Nexario's extension of the x402 protocol — signals that payment should use 1Shot ERC-7710 relay rather than a direct on-chain transfer.

### CLI Example

```bash
# Step 1: Hit paywall
curl -X POST https://api.nexario.xyz/api/agents/2/call \
  -H "Content-Type: application/json" \
  -d '{"query": "Current ETH price and market outlook"}' -i

# Response: 402 Payment Required
# X-Payment-Amount: 100000 ($0.10 USDC)
# X-Payment-Method: x402+1shot

# Step 2: Pay via 1Shot relay
# Submit ERC-7710 bundle transferring 0.10 USDC to 0x837D25DD...
# Get 1Shot task ID as payment proof

# Step 3: Retry with proof
curl -X POST https://api.nexario.xyz/api/agents/2/call \
  -H "Content-Type: application/json" \
  -H "X-Payment-Proof: 0x4e1924d0f9f741fae55177f3186b07f1f34c3ca88b66669521327ac862af729e" \
  -d '{"query": "Current ETH price and market outlook"}'

# Response: Agent result with Venice inference output
```

---

## API Reference

All endpoints require `X-User-Address` and `X-API-Key` headers unless noted. The API key is shown in the frontend Settings view after connecting a wallet.

Base URL: `https://api.nexario.xyz` (production) or `http://localhost:3000` (local)

---

### Authorization

#### `POST /api/authorize`

Create an ERC-7715 session. Call this after getting `permissionsContext` from MetaMask Flask.

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "userAddress": "0xc29De53c93A4b127D71457f4f096A63B9cB1061e",
  "permissionsContext": "0x0000000000000000...",
  "delegationManager": "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3",
  "budgetUsdc": 1,
  "expiresAt": 1781380720,
  "chatId": "93fcdd99-7f06-4edd-8fc6-732f62dc8b19",
  "chatName": "New Chat",
  "chainId": 8453,
  "actions": ["research", "audit", "report"],
  "agentRequirements": {
    "coordinator": { "minReputation": 70, "minRevenue": 0, "maxBudget": 1 },
    "research":    { "minReputation": 80, "minRevenue": 0, "maxBudget": 3 },
    "audit":       { "minReputation": 85, "minRevenue": 0, "maxBudget": 4 },
    "report":      { "minReputation": 75, "minRevenue": 0, "maxBudget": 2 },
    "counsel":     { "minReputation": 85, "minRevenue": 0, "maxBudget": 3 },
    "intelligence":{ "minReputation": 80, "minRevenue": 0, "maxBudget": 3 },
    "reflection":  { "minReputation": 70, "minRevenue": 0, "maxBudget": 2 },
    "reputation":  { "minReputation": 75, "minRevenue": 0, "maxBudget": 2 },
    "monitor":     { "minReputation": 70, "minRevenue": 0, "maxBudget": 1 },
    "executor":    { "minReputation": 80, "minRevenue": 0, "maxBudget": 2 }
  },
  "veniceQualityOracle": true
}
```

**Response `200`:**
```json
{
  "sessionId": "7302d3a2-eeaf-4437-c24f-488d0ab5f41b",
  "chatId": "93fcdd99-7f06-4edd-8fc6-732f62dc8b19",
  "budgetUsdc": 1,
  "remainingUsdc": 1,
  "expiresAt": 1781380720,
  "allowedActions": ["research", "audit", "report"],
  "agentRequirements": { ... },
  "veniceQualityOracle": true
}
```

On authorization:
- Session stored in `sessions` SQLite table with full `permissionsContext`
- Chat thread created (or updated) in `chat_threads` table with `session_id` linked
- On-chain lease created via `AuthorityLeaseRegistry.createLease()`

---

#### `POST /api/authorize/revoke`

Revoke an active session. Marks the session as revoked in the DB. Future 1Shot relay attempts using the stored `permissionsContext` will still need to be revoked on-chain separately via the DelegationManager.

**Headers:** `X-User-Address`, `X-API-Key`

**Body:**
```json
{ "sessionId": "7302d3a2-eeaf-4437-c24f-488d0ab5f41b" }
```

**Response `200`:**
```json
{ "revoked": true, "sessionId": "7302d3a2-..." }
```

---

#### `GET /api/authorize/chats`

List all chat threads for the authenticated user, with session info including the full `permissionsContext` for session restoration.

**Headers:** `X-User-Address`, `X-API-Key`

**Response `200`:**
```json
{
  "threads": [{
    "chatId": "93fcdd99-7f06-4edd-8fc6-732f62dc8b19",
    "name": "New Chat",
    "sessionId": "7302d3a2-eeaf-4437-c24f-488d0ab5f41b",
    "status": "active",
    "messageCount": 4,
    "createdAt": 1781377120,
    "session": {
      "budgetUsdc": 1,
      "spentUsdc": 0.33,
      "remainingUsdc": 0.67,
      "expiresAt": 1781380720,
      "isExpired": false,
      "permissionsContext": "0x000000...",
      "delegationManager": "0xdb9B...",
      "sessionId": "7302d3a2-...",
      "allowedActions": ["research", "audit", "report"],
      "agentRequirements": { ... },
      "veniceQualityOracle": true
    }
  }]
}
```

Used by the frontend on page load to restore sessions from the backend — `permissionsContext` is returned here so users don't need to re-authorize after browser reload.

---

#### `GET /api/authorize/chat/messages`

Get full message history for a chat thread.

**Headers:** `X-User-Address`, `X-API-Key`  
**Query:** `?sessionId={chatId}`

**Response `200`:**
```json
{
  "messages": [{
    "id": "msg-uuid",
    "type": "user",
    "content": "Analyze ETH price",
    "taskId": "task-uuid",
    "createdAt": 1781377120,
    "audioUrl": null
  }, {
    "id": "msg-uuid-2",
    "type": "agent",
    "content": "## ETH Analysis...",
    "taskId": "task-uuid",
    "createdAt": 1781377185,
    "audioUrl": "data:audio/mp3;base64,..."
  }]
}
```

Message types: `user`, `agent`, `autonomous` (from scheduled/monitor tasks), `system`.

---

### Tasks

#### `POST /api/tasks`

Submit a task to the agent network. Requires an active session for the `chatId`.

**Headers:** `X-User-Address`, `X-API-Key`, `Content-Type: application/json`

**Body:**
```json
{
  "userMessage": "Analyze ETH price and suggest entry points",
  "chatId": "93fcdd99-7f06-4edd-8fc6-732f62dc8b19"
}
```

**Response `200`:**
```json
{
  "taskId": "768353c4-47ff-4e75-05d3-d37d34979b80",
  "status": "queued"
}
```

After submission, connect to the SSE stream for live updates:

```javascript
const es = new EventSource(`/api/events/${taskId}`, {
  headers: { 'X-User-Address': address, 'X-API-Key': apiKey }
})

es.onmessage = (e) => {
  const event = JSON.parse(e.data)
  switch (event.type) {
    case 'status_change':
      // event.status: 'planning' | 'executing' | 'synthesizing'
      break
    case 'plan_ready':
      // event.plan: coordinator's sub-task plan
      break
    case 'subtask_started':
      // event.agentName, event.delta (streaming chunk)
      break
    case 'delegation_confirmed':
      // event.agentName, event.oneShotTaskId
      break
    case 'task_complete':
      // event.result.content, event.result.audioUrl
      // event.result.txDetails (array of {agentName, oneShotTaskId, feeUsdc})
      // event.result.totalSpentUsdc
      break
    case 'error':
      // event.message
      break
  }
}
```

---

#### `GET /api/events/:taskId`

SSE stream for a task. Buffers events in memory (`sse_events` table) and replays them for late-connecting clients. After replaying buffered events, sends a `task_complete` event if the task is already finished and closes the connection.

Keeps the connection alive with SSE comment heartbeats every 30 seconds.

**Headers:** `X-User-Address`, `X-API-Key`

All events are unnamed (use `EventSource.onmessage`, not `addEventListener`). Each event is a JSON string with a `type` field.

**SSE Event Types:**

| Type | Payload |
|------|---------|
| `status_change` | `{ status: 'planning' \| 'executing' \| 'synthesizing' }` |
| `plan_ready` | `{ plan: ExecutionPlan }` |
| `subtask_started` | `{ agentName, delta }` |
| `delegation_confirmed` | `{ agentName, oneShotTaskId }` |
| `task_complete` | `{ result: { content, audioUrl, txDetails, totalSpentUsdc } }` |
| `autonomous_task_started` | `{ scheduledBy, triggeredBy, prompt }` |
| `error` | `{ message }` |

---

#### `GET /api/tasks`

List recent tasks for the authenticated user.

**Headers:** `X-User-Address`, `X-API-Key`  
**Query:** `?limit=20&offset=0`

**Response `200`:**
```json
{
  "tasks": [{
    "taskId": "768353c4-47ff-4e75-05d3-d37d34979b80",
    "userMessage": "Analyze ETH price",
    "status": "completed",
    "totalSpentUsdc": "330000",
    "createdAt": 1781377120
  }]
}
```

---

### Agents

#### `GET /api/agents`

List all registered agents with live on-chain reputation from the ReputationRegistry cache.

**Response `200`:**
```json
{
  "agents": [{
    "agentId": 2,
    "name": "Research Agent — Nexario",
    "wallet": "0x837D25DD587d7288c09b868aFC9521df343C1788",
    "veniceModel": "kimi-k2-6",
    "isTEE": false,
    "x402Support": true,
    "capabilities": ["research", "web-search", "on-chain-data"],
    "feePerCall": 0.10,
    "registration": {
      "name": "Research Agent — Nexario",
      "veniceModel": "kimi-k2-6",
      "isTEE": false,
      "capabilities": ["research"],
      "feePerCall": 0.10,
      "wallet": "0x837D25DD..."
    },
    "reputation": {
      "revenues": 312.90,
      "successRate": 490,
      "responseTime": 71137,
      "delegationDepth": 2,
      "caveatCompliance": 1,
      "taskCount": 31
    }
  }]
}
```

Reputation values are raw on-chain integers. `revenues` has 2 decimal places (312.90 = $312.90). `successRate` accumulates (490 = 4.90 per task × tasks). `responseTime` is milliseconds.

---

#### `GET /api/agents/:agentId`

Get a single agent with full reputation detail.

**Response `200`:** Same as single agent object from `GET /api/agents`.

---

#### `POST /api/agents/:agentId/call`

x402-gated agent endpoint. Returns `402 Payment Required` without proof. Executes agent with valid `X-Payment-Proof` header.

**Headers:** `Content-Type: application/json`  
**Optional:** `X-Payment-Proof: {1ShotTaskId}`

**Body:**
```json
{
  "query": "What is the current ETH price and market outlook?",
  "context": "Optional additional context"
}
```

**Response without proof `402`:**
```
HTTP/1.1 402 Payment Required
X-Payment-Required: true
X-Payment-Amount: 100000
X-Payment-Token: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
X-Payment-Recipient: 0x837D25DD587d7288c09b868aFC9521df343C1788
X-Payment-Chain: 8453
X-Payment-Method: x402+1shot
```

**Response with valid proof `200`:**
```json
{
  "result": "ETH is currently trading at $1,662...",
  "agentId": 2,
  "model": "kimi-k2-6",
  "paymentVerified": true
}
```

---

#### `GET /api/agents/:agentId/reputation`

Get full on-chain reputation profile with all tag entries.

**Response `200`:**
```json
{
  "agentId": 2,
  "tags": {
    "revenues": { "count": 31, "total": 31290, "decimals": 2, "displayValue": 312.90 },
    "successRate": { "count": 31, "total": 490, "decimals": 0 },
    "responseTime": { "count": 31, "total": 2204247, "decimals": 0, "avg": 71105 },
    "delegationDepth": { "count": 31, "total": 62, "decimals": 0, "avg": 2 },
    "caveatCompliance": { "count": 31, "total": 31, "decimals": 0 }
  }
}
```

---

### Scheduled Tasks

#### `POST /api/schedule`

Schedule a recurring task. Requires an active session.

**Headers:** `X-User-Address`, `X-API-Key`, `Content-Type: application/json`

**Body:**
```json
{
  "name": "Daily ETH price alert",
  "prompt": "Check ETH price and summarize market conditions",
  "schedule": "every:1:hours",
  "chatId": "93fcdd99-7f06-4edd-8fc6-732f62dc8b19"
}
```

Schedule formats:
- `every:N:minutes` — every N minutes
- `every:N:hours` — every N hours
- `every:N:days` — every N days
- `daily:HH:MM` — every day at HH:MM UTC
- `weekly:DOW:HH:MM` — weekly (1=Mon, 7=Sun)

The `permissionsContext` is read from the active session at the time of scheduling and stored with the task. Scheduled tasks run using this stored context — no wallet connection required.

**Response `200`:**
```json
{
  "taskId": "schedule-uuid",
  "name": "Daily ETH price alert",
  "schedule": "every:1:hours",
  "nextRunAt": 1781380720,
  "enabled": true
}
```

---

#### `GET /api/schedule`

List all scheduled tasks for the user.

**Headers:** `X-User-Address`, `X-API-Key`

**Response `200`:**
```json
{
  "tasks": [{
    "id": "schedule-uuid",
    "name": "Daily ETH price alert",
    "prompt": "Check ETH price...",
    "schedule": "every:1:hours",
    "enabled": 1,
    "runCount": 4,
    "lastRunAt": 1781370000,
    "nextRunAt": 1781373600
  }]
}
```

---

#### `DELETE /api/schedule/:taskId`

Cancel a scheduled task.

**Headers:** `X-User-Address`, `X-API-Key`

**Response `200`:**
```json
{ "deleted": true, "taskId": "schedule-uuid" }
```

---

#### `PATCH /api/schedule/:taskId`

Enable or disable a scheduled task without deleting it.

**Body:** `{ "enabled": false }`

**Response `200`:**
```json
{ "updated": true, "enabled": false }
```

---

### Health & SDK

#### `GET /health`

Health check. Returns server status and uptime.

**Response `200`:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "agents": 10,
  "timestamp": 1781377120
}
```

---

#### `GET /api/sdk`

SDK information — contracts, agent wallets, supported chains.

**Response `200`:**
```json
{
  "contracts": {
    "agentRegistry": "0x3a7C05101aC0Bb99e06026855459d376d7906f15",
    "reputationRegistry": "0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82",
    "authorityLeaseRegistry": "0x5D20459A2C49D5Ba7E5aB0389baaAbFe6F58f2a4",
    "delegationManager": "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3"
  },
  "chainId": 8453,
  "usdc": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
}
```

---

## Contracts

All contracts are deployed on Base mainnet and verified on Basescan.

### AgentRegistry — ERC-8004

**Address:** `0x3a7C05101aC0Bb99e06026855459d376d7906f15`  
**Basescan:** [View contract](https://basescan.org/address/0x3a7C05101aC0Bb99e06026855459d376d7906f15)

ERC-721 NFT registry for AI agents. Each token represents one agent with on-chain metadata.

```solidity
// Register a new agent
function register(string memory agentURI) external returns (uint256 agentId)

// Get agent metadata URI
function tokenURI(uint256 tokenId) external view returns (string memory)

// Get owner of agent NFT
function ownerOf(uint256 tokenId) external view returns (address)
```

The `agentURI` is a `data:application/json;base64,...` encoded JSON containing:
```json
{
  "name": "Research Agent — Nexario",
  "veniceModel": "kimi-k2-6",
  "isTEE": false,
  "x402Support": true,
  "capabilities": ["research", "web-search"],
  "feePerCall": 0.10,
  "wallet": "0x837D25DD...",
  "endpoint": "https://api.nexario.xyz/api/agents/2/call"
}
```

**Live agent tokens:**

| Token | Agent | Wallet |
|-------|-------|--------|
| [#1](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=1) | Coordinator | 0x98a738D2... |
| [#2](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=2) | Research | 0x837D25DD... |
| [#3](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=3) | Audit | 0x2716ad37... |
| [#4](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=4) | Report | 0xEA15D2f2... |
| [#5](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=5) | Monitor | 0x98a738D2... |
| [#6](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=6) | Executor | 0x98a738D2... |
| [#7](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=7) | Counsel | 0x2716ad37... |
| [#8](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=8) | Reputation | 0x837D25DD... |
| [#9](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=9) | Intelligence | 0x2716ad37... |
| [#10](https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=10) | Reflection | 0xEA15D2f2... |

---

### ReputationRegistry

**Address:** `0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82`  
**Basescan:** [View contract](https://basescan.org/address/0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82)  
**Oracle:** `0x1C280993F1423dc3DC050aFE5bfe5FbBDb7b05c3`

Stores tagged feedback entries per agent. Only the oracle address can write feedback without being the agent's owner (enforced by `require(!_isOwnerOrOperator(agentId, msg.sender))`).

```solidity
// Write a feedback tag (oracle only)
function giveFeedback(
  uint256 agentId,
  bytes32 feedbackHash,     // 1Shot task ID — payment proof
  string memory tag1,       // "revenues" | "successRate" | "responseTime" | ...
  int128 value,
  uint8 decimals
) external

// Read aggregated tag summary
function getSummary(
  uint256 agentId,
  address[] memory oracles,
  string memory tag1,
  string memory context
) external view returns (
  uint64 count,
  int128 summaryValue,
  uint8 decimals
)
```

Tags written per task:
- `revenues` — USDC earned in cents (e.g. 10 = $0.10, decimals: 2)
- `successRate` — 100 per successful task (decimals: 0)
- `responseTime` — milliseconds (decimals: 0)
- `delegationDepth` — ERC-7710 hops used (decimals: 0)
- `caveatCompliance` — 1 = complied with all caveats (decimals: 0)

**Verify research agent revenues:**
```bash
cast call 0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82 \
  "getSummary(uint256,address[],string,string)(uint64,int128,uint8)" \
  2 "[0x1C280993F1423dc3DC050aFE5bfe5FbBDb7b05c3]" "revenues" "task" \
  --rpc-url https://mainnet.base.org
# Returns: count=31, value=31290, decimals=2 → $312.90
```

---

### AuthorityLeaseRegistry

**Address:** `0x5D20459A2C49D5Ba7E5aB0389baaAbFe6F58f2a4`  
**Basescan:** [View contract](https://basescan.org/address/0x5D20459A2C49D5Ba7E5aB0389baaAbFe6F58f2a4)

Tracks on-chain authority leases with budget, depth, and delegation hash.

```solidity
// Create a new lease (called at task start)
function createLease(
  address delegate,
  uint256 budgetUsdc,
  uint8 delegationDepth,
  bytes32 delegationHash
) external returns (bytes32 leaseId)

// Consume from lease budget (called per execution)
function consumeLease(
  bytes32 leaseId,
  uint256 amount
) external

// Create sub-lease for agent
function redelegate(
  bytes32 parentLeaseId,
  address subDelegate,
  uint256 subBudget
) external returns (bytes32 subLeaseId)
```

---

### MetaMask DelegationManager

**Address:** `0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3`  
**Basescan:** [View contract](https://basescan.org/address/0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3)

EIP-7702 stateless delegator deployed by MetaMask. Validates the full ERC-7710 delegation chain on-chain before allowing any execution. Called by 1Shot's relay as `RedeemDelegations`.

---

## DEX Swaps

Nexario has a complete 0x Permit2 swap integration built and tested. The infrastructure:

- `src/lib/dex/zeroex.ts` — 0x Permit2 quote and price API, verified liquid Base tokens
- `src/agents/executor.ts` — swap instruction parsing, 0x quote fetching, permit2 approval bundling
- Binance WebSocket monitor triggers swap pipelines on price conditions
- Permit2 approval + swap calldata bundled as multi-execution 1Shot transaction

**Why it's blocked:**

The ERC-7715 `erc20-token-periodic` permission uses `ERC20PeriodTransferEnforcer`. This enforcer validates that each execution calldata is exactly a standard ERC-20 `transfer(address,uint256)` — 68 bytes. The 0x swap router calldata is several kilobytes. The enforcer rejects it:

```
ERC20PeriodTransferEnforcer:invalid-execution-length
```

**What we tried:**
1. Direct 0x Permit2 calldata → 1Shot bundle — rejected
2. permit2 `approve(address,uint256)` prepended — also rejected (approval calldata ≠ transfer calldata)
3. Various `value` formatting — not the issue
4. `relayer_estimateFee` correctly surfaces the failure before submission

**The fix:** Switch from `erc20-token-periodic` to `contract-call` permission type in the ERC-7715 grant, scoped to the 0x router address (`0x7747f8d2a76bd6345cc29622a946a929647f2359`). This permission type allows arbitrary calldata to a specific contract. Requires MetaMask Flask support and 1Shot support for the `contract-call` caveat enforcer.

**Verified liquid tokens on Base (via 0x):**
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- WETH: `0x4200000000000000000000000000000000000006`
- cbETH: `0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22`
- AERO: `0x940181a94A35A4569E4529A3CDfB74e38FD98631`
- BRETT: `0x532f27101965dd16442E59d40670FaF5eBB142E4`
- VIRTUAL: `0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b`
- TOSHI: `0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4`
- DEGEN: `0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed`

---

## Roadmap

### Near-term

**DEX Swaps via `contract-call` permission** — Infrastructure complete. Blocked by ERC-7715 enforcer. Fix: switch permission type to `contract-call` scoped to 0x router.

**MetaMask Agent Wallets** — Selected for early access (one of ~200 builders globally). Not yet integrated — the primitive is brand new. Nexario's ERC-8004 registry, reputation oracle, x402 paywalls, and ERC-7710 delegation are designed to connect naturally once the Agent Wallet API stabilises.

**Binance WS swap triggers** — Monitor infrastructure fires swap pipelines on price conditions. Works end-to-end once `contract-call` permission unblocks swaps.

**Cross-chain execution** — Extend 1Shot bundles to Arbitrum, Optimism.

**Agent-to-Agent delegation** — Deeper ERC-7710 chains, agents spawning sub-agents.

### Later

- User-deployed agent logic — custom prompts + Venice model selection
- Reputation-gated routing — coordinator auto-selects by live on-chain score
- USDC yield on idle budgets — Aave/Compound while session is unspent
- Mobile app — MetaMask SDK + React Native
