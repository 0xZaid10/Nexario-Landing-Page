/* docsContent2.jsx — Agents */

const TOKEN_BASE = "https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=";

const DOC_PAGES_2 = [
  {
    id: "agents-overview", group: "Agents", title: "Overview", eyebrow: "Agents",
    blocks: [
      { type: "lead", text: "All 10 Nexario agents are registered as ERC-8004 NFTs on the AgentRegistry on Base mainnet. Each token's URI is a base64-encoded JSON containing the agent's full configuration: Venice model ID, TEE status, x402 support, capabilities, fee schedule, wallet address, and A2A endpoint." },
      { type: "specs", items: [
        ["AgentRegistry", "0x3a7C05101aC0Bb99e06026855459d376d7906f15"],
      ] },
      { type: "p", text: "Agents are loaded from the contract on backend startup and cached in SQLite. Reputation scores are cached from the ReputationRegistry and refreshed after each task completes." },
      { type: "callout", tone: "tee", title: "Every agent is an A2A endpoint", text: "Every agent exposes an x402 paywall at POST /api/agents/:agentId/call. External callers — AI agents, scripts, applications — can pay per inference in USDC via 1Shot on Base and receive Venice AI results without going through the full task pipeline." },
      { type: "h2", text: "The roster", eyebrow: "10 agents" },
      { type: "table", head: ["#", "Agent", "Venice model", "Fee", "TEE"], rows: [
        ["1", "Coordinator", "Qwen3 235B", "$0.05", "—"],
        ["2", "Research", "Kimi K2.6 + web", "$0.10", "—"],
        ["3", "Audit", "Qwen3 235B Thinking", "$0.15", "—"],
        ["4", "Report", "Kimi K2.5 + TTS", "$0.05", "—"],
        ["5", "Monitor", "Qwen3 235B", "$0.05", "—"],
        ["6", "Executor", "Pure calldata", "$0.05", "—"],
        ["7", "Counsel", "Qwen3 6.35B TEE", "$0.20", "Yes"],
        ["8", "Reputation", "Kimi K2.6 + web", "$0.08", "—"],
        ["9", "Intelligence", "Qwen3 6.35B TEE", "$0.15", "Yes"],
        ["10", "Reflection", "Gemma 4 26B TEE", "$0.10", "Yes"],
      ] },
    ],
  },
  {
    id: "agent-coordinator", group: "Agents", title: "Coordinator", eyebrow: "Agent #1",
    blocks: [
      { type: "agent", n: 1 },
      { type: "specs", items: [
        ["Venice model", "qwen3-235b-a22b-instruct-2507"],
        ["Fee", "$0.05 per task"],
        ["Wallet", "0x98a738D21A0EFF97Ee2e68508CD921444553fe0e"],
        ["ERC-8004", "[Token #1 on Basescan](" + TOKEN_BASE + "1)"],
      ] },
      { type: "p", text: "The coordinator is the entry point and exit point for every task. It receives the raw user message, decomposes it into a structured sub-task plan, creates ERC-7710 sub-delegations for each agent, monitors execution, and synthesizes the final response after all sub-agents complete." },
      { type: "p", text: "Planning uses Qwen3 235B with `temperature: 0` and `reasoningEffort: low` for deterministic, fast plans. Output is structured JSON: a `subTasks` array where each entry specifies agent name, budget allocation, description, and optional `executionParams` for the executor." },
      { type: "p", text: "Privacy classification runs in parallel with planning: fast keyword pattern matching for clear cases (medical, legal, financial, personal, corporate, surveillance), then a Venice classify call for ambiguous content. If `score > 65`, the coordinator uses a Venice TEE model for planning itself and routes sensitive sub-tasks to Counsel, Intelligence, or Reflection automatically." },
      { type: "p", text: "After all sub-tasks complete, synthesis uses Qwen3 235B again. The synthesis prompt includes all sub-agent outputs, the confirmed executor transaction hash if present, and an instruction not to modify or abbreviate transaction hashes. Both planning and synthesis retry up to 5 times on Venice 429 rate-limit errors." },
      { type: "h2", text: "Planning rules", eyebrow: "System prompt" },
      { type: "list", items: [
        "Research runs first for any task requiring data",
        "Audit follows research for risk analysis and transaction tasks",
        "Executor runs only for SEND / TRANSFER — never for swaps (blocked by the ERC-7715 enforcer)",
        "Report runs last to generate the final synthesized output and audio",
        "Monitor runs for any condition-watching or price-alert request",
        "Counsel routes for legal content, Intelligence for competitive, Reflection for personal",
        "TEE routing happens automatically from privacy classification — users do not specify",
      ] },
    ],
  },
  {
    id: "agent-research", group: "Agents", title: "Research", eyebrow: "Agent #2",
    blocks: [
      { type: "agent", n: 2 },
      { type: "specs", items: [
        ["Venice model", "kimi-k2-6 (web search enabled)"],
        ["Fee", "$0.10 per task"],
        ["Wallet", "0x837D25DD587d7288c09b868aFC9521df343C1788"],
        ["ERC-8004", "[Token #2 on Basescan](" + TOKEN_BASE + "2)"],
      ] },
      { type: "p", text: "The primary data-fetching agent. It uses Venice's Kimi K2.6 with `enableWebSearch: true` — Venice's native web search injects live results directly into the model context. No external search API. No rate limits. No stale cached data." },
      { type: "h2", text: "What it can fetch", eyebrow: "Capabilities" },
      { type: "caps", n: 2 },
      { type: "p", text: "Beyond the core set, Research pulls smart-contract addresses and verification status, protocol documentation and changelogs, and news from the last hours — not training data. The coordinator's planning prompt gives each research sub-task a specific description of what to fetch, so the agent runs a targeted query and returns structured data that downstream agents use as context." },
      { type: "callout", tone: "note", title: "Almost always first", text: "Research is almost always the first sub-task dispatched. Its output feeds every other agent in the pipeline." },
    ],
  },
  {
    id: "agent-audit", group: "Agents", title: "Audit", eyebrow: "Agent #3",
    blocks: [
      { type: "agent", n: 3 },
      { type: "specs", items: [
        ["Venice model", "qwen3-235b-a22b-thinking-2507"],
        ["Fee", "$0.15 per task"],
        ["Wallet", "0x2716ad373db19FfBfcae479c3c9D078457293246"],
        ["ERC-8004", "[Token #3 on Basescan](" + TOKEN_BASE + "3)"],
      ] },
      { type: "p", text: "The audit agent uses Qwen3 235B in Thinking mode — an extended reasoning variant that works through a problem step-by-step before producing output. The internal reasoning chain is not returned, only the final analysis. This is particularly effective for risk scoring where compound risks emerge from combining multiple factors standard inference might miss." },
      { type: "p", text: "The coordinator passes research output as context, so audit analyzes live on-chain data rather than working from training knowledge alone." },
      { type: "h2", text: "What audit analyzes", eyebrow: "Risk surface" },
      { type: "list", items: [
        "Smart contract risk: ownership, upgrade keys, proxy patterns, reentrancy exposure, audit history",
        "Transaction risk: recipient reputation, chain matching, amount relative to portfolio",
        "DeFi exposure: liquidation thresholds, impermanent loss, protocol concentration, oracle manipulation",
        "Counterparty risk: wallet history, DeFi interaction patterns, behavioral signals",
        "Slippage and MEV vulnerability for DEX interactions",
        "Gas cost efficiency relative to transaction value",
      ] },
      { type: "callout", tone: "note", title: "Scored 0–100", text: "Risk output is scored 0–100 with factor breakdown and specific mitigation recommendations. Audit runs after research and before executor in transaction pipelines." },
    ],
  },
  {
    id: "agent-report", group: "Agents", title: "Report", eyebrow: "Agent #4",
    blocks: [
      { type: "agent", n: 4 },
      { type: "specs", items: [
        ["Venice model", "kimi-k2-5 + Venice TTS (af_heart)"],
        ["Fee", "$0.05 per task"],
        ["Wallet", "0xEA15D2f2B787D7Dc07378E314815fd4B169863a7"],
        ["ERC-8004", "[Token #4 on Basescan](" + TOKEN_BASE + "4)"],
      ] },
      { type: "p", text: "The report agent synthesizes research and audit outputs into executive summaries using Kimi K2.5, then generates an audio brief via Venice TTS. The audio is generated from the final coordinator synthesis — not the report agent's intermediate draft — ensuring what the user hears matches what they see." },
      { type: "p", text: "TTS uses the `af_heart` voice in MP3 format. The synthesis is capped at 800 characters for the audio brief. The audio data URL is included in the `task_complete` SSE event, stored in `chat_messages`, and rendered as an inline audio player in the frontend." },
      { type: "callout", tone: "note", title: "Writing style", text: "Clear, non-technical language. Leads with the most important finding, includes specific numbers, addresses, and transaction hashes where relevant, and ends with actionable next steps. Does not pad with generic disclaimers." },
    ],
  },
  {
    id: "agent-monitor", group: "Agents", title: "Monitor", eyebrow: "Agent #5",
    blocks: [
      { type: "agent", n: 5 },
      { type: "specs", items: [
        ["Venice model", "qwen3-235b-a22b-instruct-2507 (condition parsing)"],
        ["Fee", "$0.05 per task"],
        ["Wallet", "0x98a738D21A0EFF97Ee2e68508CD921444553fe0e"],
        ["ERC-8004", "[Token #5 on Basescan](" + TOKEN_BASE + "5)"],
      ] },
      { type: "p", text: "The monitor agent parses a natural-language condition using Venice, registers a Binance WebSocket price watch or Alchemy RPC wallet watch, and returns confirmation. When the condition triggers, it autonomously fires a full agent pipeline using the stored `permissionsContext` — no user interaction, no wallet popup, no browser connection required." },
      { type: "h2", text: "Price monitoring", eyebrow: "Binance WebSocket" },
      { type: "p", text: "Uses `wss://stream.binance.com/ws/{pair}@trade`. The stream pushes every trade tick in real time; the monitor compares each tick against the registered condition. When the price crosses the threshold, the callback fires immediately — sub-second latency. Any Binance-listed pair is supported." },
      { type: "p", text: "**Percentage conditions** (\"alert when ETH drops 5%\") call Binance REST for the current price at registration, compute the threshold (`currentPrice × 0.95`), then watch for that absolute price. The percentage is computed once at setup, not continuously recalculated." },
      { type: "h2", text: "Wallet monitoring", eyebrow: "Alchemy RPC" },
      { type: "p", text: "Polls Alchemy Base RPC every 15 minutes for address activity. Less latency-sensitive but persistent — wallet watches are stored in the `scheduled_tasks` SQLite table and survive backend restarts." },
      { type: "h2", text: "Autonomous trigger pipeline", eyebrow: "createTask()" },
      { type: "p", text: "When a condition fires, `createTask()` is called with a structured trigger message and the stored `permissionsContext`. For a price alert: research + report. With action: research + executor + report." },
      { type: "code", lang: "text", code: `[MONITOR TRIGGERED] ETH price confirmed at $1649.32 by Binance real-time feed
- condition below $1650 MET. DO NOT verify price via web search.
Execute: research market conditions and send report.` },
      { type: "callout", tone: "warn", title: "Watches are in-memory by design", text: "Price watches persist in memory across tasks (one WebSocket per token pair, conditions multiplexed) but are lost on backend restart — stale watches with outdated thresholds are worse than missing watches." },
    ],
  },
  {
    id: "agent-executor", group: "Agents", title: "Executor", eyebrow: "Agent #6",
    blocks: [
      { type: "agent", n: 6 },
      { type: "specs", items: [
        ["Venice model", "None — pure calldata builder"],
        ["Fee", "$0.05 per task"],
        ["Wallet", "0x98a738D21A0EFF97Ee2e68508CD921444553fe0e"],
        ["ERC-8004", "[Token #6 on Basescan](" + TOKEN_BASE + "6)"],
      ] },
      { type: "p", text: "The only Nexario agent with no Venice inference. It builds calldata deterministically from the coordinator's `executionParams` and submits on-chain actions as the third execution in a 1Shot relay bundle." },
      { type: "h2", text: "USDC transfer", eyebrow: "send X USDC to 0x…" },
      { type: "steps", items: [
        { t: "Validate recipient address (EIP-55 checksum)" },
        { t: "Convert amount to USDC atoms (amount × 1,000,000)" },
        { t: "Encode transfer(address,uint256) calldata (68 bytes)" },
        { t: "Check remaining session budget — block if amount > available" },
        { t: "Add as third execution in the 1Shot bundle", b: "Execution 1: relay fee ($0.01) · Execution 2: agent fee ($0.05) · Execution 3: USDC transfer to recipient" },
        { t: "All three land in one Base transaction" },
      ] },
      { type: "p", text: "**WETH transfer** (`send X ETH to 0x...`) follows the same flow with the WETH address `0x4200000000000000000000000000000000000006`." },
      { type: "callout", tone: "tee", title: "Two independent budget checks", text: "The executor checks availableBudgetUsdc before building calldata and returns a clear error without submitting if the amount exceeds what's left. The on-chain ERC20PeriodTransferEnforcer enforces this at the relay level as well." },
      { type: "callout", tone: "warn", title: "DEX swaps built but blocked", text: "The 0x Permit2 integration is complete in executor.ts and zeroex.ts, but the ERC20PeriodTransferEnforcer rejects swap calldata with invalid-execution-length. See the DEX Swaps section." },
    ],
  },
  {
    id: "agent-counsel", group: "Agents", title: "Counsel", eyebrow: "Agent #7",
    blocks: [
      { type: "agent", n: 7 },
      { type: "specs", items: [
        ["Venice model", "e2ee-qwen3-6-35b-a3b (Venice TEE)"],
        ["Fee", "$0.20 per task"],
        ["Wallet", "0x2716ad373db19FfBfcae479c3c9D078457293246"],
        ["TEE", "Hardware-attested · Zero data retention"],
        ["ERC-8004", "[Token #7 on Basescan](" + TOKEN_BASE + "7)"],
      ] },
      { type: "p", text: "Legal and compliance analysis in a Venice hardware-attested secure enclave. The `e2ee-` prefix indicates Venice's TEE model family. Inputs and outputs are processed inside the enclave — not stored, not logged, not accessible to Venice staff, and not used for training. Enforced by hardware attestation, not policy." },
      { type: "p", text: "The coordinator routes to Counsel automatically when privacy classification detects legal content: contract or NDA language, litigation mentions, attorney or clause references, liability or settlement terms, intellectual property, or regulatory compliance questions." },
      { type: "p", text: "Counsel handles legal analysis of DeFi protocol terms, smart-contract clause interpretation, regulatory compliance across jurisdictions (particularly India, EU, US), IP considerations for on-chain assets, cross-border transaction legality, DAO governance implications, and risk identification in legal agreements." },
    ],
  },
  {
    id: "agent-reputation", group: "Agents", title: "Reputation", eyebrow: "Agent #8",
    blocks: [
      { type: "agent", n: 8 },
      { type: "specs", items: [
        ["Venice model", "kimi-k2-6 (web search)"],
        ["Fee", "$0.08 per task"],
        ["Wallet", "0x837D25DD587d7288c09b868aFC9521df343C1788"],
        ["ERC-8004", "[Token #8 on Basescan](" + TOKEN_BASE + "8)"],
      ] },
      { type: "p", text: "Wallet identity scoring and on-chain history analysis. The reputation agent analyzes transaction patterns, DeFi interaction history, protocol usage, token holdings, and behavioral signals to assess counterparty trust and wallet reputation." },
      { type: "p", text: "Uses Venice web search to cross-reference addresses against Etherscan labels, known exchange addresses, ChainAbuse reports, Forta alert history, and Tornado Cash interaction records. Combines on-chain pattern analysis with live intelligence to produce a risk profile." },
    ],
  },
  {
    id: "agent-intelligence", group: "Agents", title: "Intelligence", eyebrow: "Agent #9",
    blocks: [
      { type: "agent", n: 9 },
      { type: "specs", items: [
        ["Venice model", "e2ee-qwen3-6-35b-a3b (Venice TEE)"],
        ["Fee", "$0.15 per task"],
        ["Wallet", "0x2716ad373db19FfBfcae479c3c9D078457293246"],
        ["TEE", "Hardware-attested · Zero data retention"],
        ["ERC-8004", "[Token #9 on Basescan](" + TOKEN_BASE + "9)"],
      ] },
      { type: "p", text: "Competitive and business intelligence in a Venice TEE enclave. Market positioning analysis, protocol comparison, competitor research, investment thesis development, and strategic landscape assessment — processed with the same hardware-level privacy as Counsel." },
      { type: "p", text: "Routes automatically when the coordinator detects corporate or competitive content: competitor mentions, strategy or roadmap references, M&A or acquisition language, pricing strategy, customer or market-share analysis, or trade-secret-adjacent content." },
    ],
  },
  {
    id: "agent-reflection", group: "Agents", title: "Reflection", eyebrow: "Agent #10",
    blocks: [
      { type: "agent", n: 10 },
      { type: "specs", items: [
        ["Venice model", "e2ee-gemma-4-26b-a4b-uncensored-p (TEE)"],
        ["Fee", "$0.10 per task"],
        ["Wallet", "0xEA15D2f2B787D7Dc07378E314815fd4B169863a7"],
        ["TEE", "Hardware-attested · Uncensored · Zero retention"],
        ["ERC-8004", "[Token #10 on Basescan](" + TOKEN_BASE + "10)"],
      ] },
      { type: "p", text: "Personal journaling and wellness reasoning using Venice's uncensored Gemma 4 26B in a TEE enclave. No content filters. No data retention. The uncensored model combined with TEE hardware privacy means Reflection can process content that other agents or providers would filter, flag, or log." },
      { type: "p", text: "Routes automatically when the coordinator detects personal, mental-health, relationship, or wellness content. Users can also explicitly invoke Reflection by asking for personal reflection or journaling." },
    ],
  },
];

window.DOC_PAGES_2 = DOC_PAGES_2;
