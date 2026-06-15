/* docsContent1.jsx — Getting Started + Core Concepts */

const DOC_PAGES_1 = [
  /* ============ GETTING STARTED ============ */
  {
    id: "what-is-nexario", group: "Getting Started", title: "What is Nexario", eyebrow: "Getting Started",
    blocks: [
      { type: "lead", text: "Nexario is a live on-chain AI agent network running on Base mainnet. It solves a problem every AI agent system eventually hits: agents need to act autonomously, but giving them a private key is dangerous, approving every transaction manually defeats the purpose, and trusting a backend not to overspend is just faith in a database." },
      { type: "p", text: "Nexario's answer is **authority leasing** — a cryptographic delegation model built on ERC-7715, ERC-7710, and EIP-7702. You sign once with MetaMask Flask. That signature creates a bounded permission grant encoding exactly how much USDC agents can spend, how long they can operate, which capabilities are permitted, and how deep the delegation chain can go. The MetaMask DelegationManager enforces all four constraints on-chain before any USDC moves. The backend cannot override them." },
      { type: "p", text: "Within those bounds, a coordinator dispatches up to 10 specialized Venice AI agents. Each agent pays its own fees via 1Shot's gasless ERC-7710 relay — real USDC transfers on Base, confirmed on Basescan, no ETH required anywhere in the flow. After every task, a Venice-powered oracle writes execution proof to the ReputationRegistry on Base. Agents earn verifiable on-chain scores, and future authority depends on past performance." },
      { type: "callout", tone: "tee", title: "Not a simulation", text: "Every agent action produces a confirmed Base mainnet transaction. The transaction drawer shows real Basescan links, leaderboard scores come from live contract reads, and your wallet's USDC balance decrements in real time as agents work." },
      { type: "h2", text: "What Nexario can do", eyebrow: "Capabilities" },
      { type: "cards", cols: 2, items: [
        { tag: "Research", t: "Live market intelligence", b: "The Research agent (Venice Kimi K2.6 with web search) fetches token prices, DeFi metrics, wallet history, and gas conditions. Live results inject into model context — no external APIs, no stale cache." },
        { tag: "Coordinator", t: "Multi-agent analysis", b: "Decomposes complex requests and dispatches agents in order. A DeFi legal question routes to Research, Audit, Counsel, and Report — all from one message." },
        { tag: "Executor", t: "On-chain execution", b: "Builds USDC transfer calldata as a third execution in the 1Shot bundle. You send a message, the USDC moves, you see a Basescan link." },
        { tag: "Monitor", t: "Autonomous monitoring", b: "Opens a Binance WebSocket stream and waits for a price condition. When ETH crosses your threshold, it fires a full pipeline — no wallet connection, no popup. You can be offline." },
        { tag: "TEE", t: "Private inference", b: "Counsel, Intelligence, and Reflection run on Venice hardware-attested TEE enclaves. Inputs and outputs stay inside the enclave. Zero data retention — a hardware constraint, not a policy promise." },
        { tag: "Scheduler", t: "Recurring tasks", b: "Schedule agents to run hourly, daily, or at a fixed time. The scheduler reads the stored permissionsContext and runs tasks autonomously with no further wallet interaction." },
      ] },
    ],
  },
  {
    id: "quick-start", group: "Getting Started", title: "Quick Start", eyebrow: "Getting Started",
    blocks: [
      { type: "lead", text: "Four steps take you from zero to an autonomous agent pipeline: install MetaMask Flask, get Base USDC, authorize one session, and send a task. After the single signature there are no further popups and no gas." },
      { type: "h2", text: "Install MetaMask Flask", eyebrow: "Step 1" },
      { type: "p", text: "Regular MetaMask does not support `wallet_grantPermissions` (ERC-7715). MetaMask Flask is the experimental developer build that does. Download it from [metamask.io/flask](https://metamask.io/flask). It installs alongside regular MetaMask without conflict and is available for Chrome and Firefox." },
      { type: "callout", tone: "warn", title: "Experimental software", text: "Flask is intended for developers. Keep your Flask wallet funded with a modest USDC testing budget — $2–5 is enough for multiple Nexario sessions." },
      { type: "h2", text: "Get Base USDC", eyebrow: "Step 2" },
      { type: "p", text: "All Nexario fees are in USDC on Base mainnet. You do not need ETH — 1Shot's relay pays Base gas from its own balance and deducts only USDC from your delegated budget." },
      { type: "table", head: ["Fee", "Amount", "Goes to"], rows: [
        ["Relay fee", "$0.01 (fixed)", "1Shot fee collector"],
        ["Agent fee", "$0.05 – $0.20", "Agent wallet"],
        ["Typical pipeline", "~$0.30 – $0.35", "research + audit + report"],
      ] },
      { type: "list", items: [
        "Bridge from Ethereum mainnet at [bridge.base.org](https://bridge.base.org)",
        "Buy on Coinbase and withdraw directly to Base network",
        "Transfer from another Base address",
      ] },
      { type: "h2", text: "Authorize a session", eyebrow: "Step 3" },
      { type: "p", text: "Open [nexario.xyz](https://nexario.xyz), connect Flask, and click **Authorize Agents**. A modal lets you configure the session:" },
      { type: "list", items: [
        "**Budget** — how much USDC to delegate (min $0.50, recommended $1–2 for testing). The hard cap enforced on-chain by ERC-7715.",
        "**Duration** — how long the session stays active (up to 1 hour per `erc20-token-periodic` period).",
        "**Agent requirements** — optional minimum reputation thresholds per agent type.",
        "**Venice quality oracle** — whether the oracle writes reputation tags after each task. Recommended: enabled.",
      ] },
      { type: "p", text: "Click **Authorize** and Flask shows the `wallet_grantPermissions` popup — the only signature Nexario ever requests. The `context` field is sent to `POST /api/authorize`, which stores the permissionsContext, creates the chat session, and writes an on-chain lease to the AuthorityLeaseRegistry." },
      { type: "h2", text: "Send a task", eyebrow: "Step 4" },
      { type: "p", text: "Type a task in the chat input. The coordinator plans and dispatches agents immediately. You see live streaming output, then a final synthesized result with transaction details." },
      { type: "code", lang: "javascript", code: `// 1 · Grant the ERC-7715 permission in MetaMask Flask
const result = await window.ethereum.request({
  method: 'wallet_grantPermissions',
  params: [{
    chainId: '0x2105',                 // Base mainnet
    permissions: [{
      type: 'erc20-token-periodic',
      data: {
        periodAmount: '1000000',       // $1 USDC (6 decimals)
        periodDuration: 3600,          // 1 hour
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      }
    }],
    expiry: Math.floor(Date.now()/1000) + 3600
  }]
})
const permissionsContext = result[0].context

// 2 · Authorize a session
await fetch('https://api.nexario.xyz/api/authorize', {
  method: 'POST',
  body: JSON.stringify({ userAddress: '0x...', permissionsContext, budgetUsdc: 1 })
})

// 3 · Submit a task — then connect to the SSE stream
await fetch('https://api.nexario.xyz/api/tasks', {
  method: 'POST',
  headers: { 'X-User-Address': '0x...', 'X-API-Key': '...' },
  body: JSON.stringify({ userMessage: 'Analyze ETH price and suggest entry points', chatId: 'uuid' })
})` },
      { type: "h3", text: "Example tasks" },
      { type: "list", items: [
        "Analyze ETH price and suggest entry points for a long position",
        "What are the legal implications of operating a DeFi yield aggregator?",
        "Send 0.2 USDC to 0x0D8C9C2EA8AaF4d77c0140Ac5E2602f29D7328c3",
        "Monitor ETH — alert me when it drops below $1600 and send me a report",
        "Research the top 5 DeFi protocols by TVL on Base this week",
        "Is the AERO token contract on Base safe to interact with?",
      ] },
    ],
  },
  {
    id: "authentication", group: "Getting Started", title: "Authentication", eyebrow: "Getting Started",
    blocks: [
      { type: "lead", text: "All API endpoints except GET /health and GET /api/sdk require two headers on every request." },
      { type: "code", lang: "http", code: `X-User-Address: 0xYourWalletAddress
X-API-Key: your-api-key` },
      { type: "h2", text: "Getting your API key", eyebrow: "Keys" },
      { type: "p", text: "Your API key is generated automatically when you first connect your wallet at nexario.xyz, and is visible in the **Settings** panel. The key is a UUID tied to your wallet address and does not change between sessions. It is safe to store — it grants API access only, not token spending rights." },
      { type: "h2", text: "How sessions work", eyebrow: "Sessions" },
      { type: "p", text: "A session is created by `POST /api/authorize` with the `permissionsContext` from a MetaMask Flask ERC-7715 grant. On successful authorization:" },
      { type: "steps", items: [
        { t: "Session stored", b: "Written to the `sessions` table with `status: active`, `budgetUsdc`, `spentUsdc`, `expiresAt`, and the full `permissionsContext`." },
        { t: "Chat thread created", b: "Created in `chat_threads` with the `session_id` linked — this connects future messages to the correct delegation." },
        { t: "On-chain lease created", b: "Recorded in the `AuthorityLeaseRegistry` contract: delegate address, budget, depth, and delegation hash." },
      ] },
      { type: "h2", text: "Session restoration", eyebrow: "Persistence" },
      { type: "p", text: "On page reload the frontend calls `GET /api/authorize/chats`, which returns every chat thread with its full session object — including `permissionsContext`. The active session restores without any new MetaMask interaction, as long as it has not expired and the budget is not exhausted." },
      { type: "callout", tone: "note", title: "Server-side state", text: "Nexario sessions are server-side state, not browser-local state. Clearing browser storage does not kill the session. Opening nexario.xyz on a different device with the same wallet and API key restores all chat history and the active session." },
      { type: "h2", text: "Expiry, exhaustion & revocation", eyebrow: "Lifecycle" },
      { type: "p", text: "**Expiry** — sessions expire when the ERC-7715 period ends. After expiry, any 1Shot relay attempt using the stored `permissionsContext` is rejected on-chain and the frontend shows the Authorize button again. Chat history is preserved." },
      { type: "p", text: "**Budget exhaustion** — when the on-chain period allowance is fully spent, `relayer_estimateFee` returns `ERC20PeriodTransferEnforcer:insufficient-balance` and no further bundles are submitted. A fresh `wallet_grantPermissions` call restores the budget." },
      { type: "p", text: "**Revocation** — `POST /api/authorize/revoke` marks a session revoked in the backend. The on-chain ERC-7715 permission must be separately revoked through MetaMask Flask to prevent the `permissionsContext` from being used outside Nexario." },
      { type: "callout", tone: "note", title: "Multiple sessions", text: "Each chat thread has its own independent session — its own budget, duration, and agent requirements. Authorizing a new chat creates a new ERC-7715 grant with an independent permissionsContext and period allowance." },
    ],
  },

  /* ============ CORE CONCEPTS ============ */
  {
    id: "authority-leasing", group: "Core Concepts", title: "Authority Leasing", eyebrow: "Core Concepts",
    blocks: [
      { type: "lead", text: "Authority leasing is the delegation model Nexario uses for AI agents. The name describes the economic relationship precisely: you lease a bounded portion of your on-chain authority to an agent network for a fixed period, at a fixed cost ceiling, within a fixed set of permitted actions." },
      { type: "p", text: "This is distinct from private-key delegation (dangerous), approval-per-action (unusable at scale), and trust-the-backend (no cryptographic guarantee). Authority leasing gives agents real autonomy within constraints you control — enforced by the MetaMask DelegationManager on-chain, not by Nexario's backend." },
      { type: "h2", text: "The four constraints", eyebrow: "Encoded in every grant" },
      { type: "cards", cols: 2, items: [
        { tag: "Amount", t: "periodAmount", b: "In USDC atoms, enforced by ERC20PeriodTransferEnforcer. Every 1Shot bundle is validated against the remaining allowance before execution. Agents cannot exceed the cap regardless of task complexity." },
        { tag: "Duration", t: "expiry timestamp", b: "After expiry the entire permissionsContext is invalid. 1Shot rejects any bundle that uses an expired delegation." },
        { tag: "Scope", t: "allowedActions", b: "Restricts which agent capabilities the coordinator can dispatch. Only permitted agent types appear in the coordinator's planning context." },
        { tag: "Depth", t: "delegation chain", b: "The ERC-7710 chain has a maximum hop count. The coordinator is depth 1, sub-agents depth 2. The structure prevents redelegation beyond what was authorized." },
      ] },
      { type: "h2", text: "The feedback loop", eyebrow: "Accountability" },
      { type: "p", text: "Every execution consumes authority (deducted from the period allowance) and produces a reputation update (the oracle writes five tags to the ReputationRegistry after completion). Future authority decisions depend on reputation: users set minimum thresholds at authorization, and agents below threshold are blocked before any delegation is redeemed." },
      { type: "p", text: "This creates an accountability loop. Agents that perform well accumulate on-chain reputation, making them eligible for future high-value tasks. Agents that fail have their scores reflect those failures — and users whose `agentRequirements` exclude low-reputation agents will not route tasks to them." },
    ],
  },
  {
    id: "erc-7715", group: "Core Concepts", title: "ERC-7715 Permissions", eyebrow: "Core Concepts",
    blocks: [
      { type: "lead", text: "ERC-7715 is the wallet_grantPermissions standard implemented by MetaMask Flask. It creates permission grants — cryptographically signed objects that authorize external systems to perform scoped actions on behalf of the wallet owner, without ever sharing the private key." },
      { type: "p", text: "Nexario uses the `erc20-token-periodic` permission type. This creates a USDC spending allowance with a period cap — the most constrained permission type available. The grant returns a `context` field (not `permissionsContext` — that field name is from an earlier draft of the spec) containing the ABI-encoded delegation object used by 1Shot." },
      { type: "h2", text: "The exact call", eyebrow: "wallet_grantPermissions" },
      { type: "code", lang: "javascript", code: `const result = await window.ethereum.request({
  method: 'wallet_grantPermissions',
  params: [{
    chainId: '0x2105',                                  // Base mainnet (8453)
    address: '0x26A529124f0bBf9aF9D8f9F84a43EfE47Cf1199a', // 1Shot relay target
    permissions: [{
      type: 'erc20-token-periodic',
      isAdjustmentAllowed: true,
      data: {
        periodAmount: '1000000',                        // $1 USDC in atoms
        periodDuration: 3600,                           // 1 hour
        startTime: Math.floor(Date.now() / 1000),
        justification: 'Nexario agent network',
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      }
    }],
    expiry: Math.floor(Date.now() / 1000) + 3600
  }]
})

const permissionsContext = result[0].context           // ABI-encoded — 2,882 bytes
const delegationManager  = result[0].delegationManager
// -> 0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3` },
      { type: "p", text: "The `context` field contains the full ERC-7710 delegation struct: delegate address (1Shot target), delegator address (the user's EOA), authority hash, caveats array (the `ERC20PeriodTransferEnforcer` with encoded terms — token address, period amount, period duration), salt, and the user's EIP-712 Flask signature." },
      { type: "callout", tone: "tee", title: "Key never leaves Flask", text: "This is the only data 1Shot needs to validate and relay on behalf of the user. The user's private key never leaves the Flask wallet." },
    ],
  },
  {
    id: "erc-7710", group: "Core Concepts", title: "ERC-7710 Redelegation", eyebrow: "Core Concepts",
    blocks: [
      { type: "lead", text: "ERC-7710 defines how delegations are redeemed on-chain and how sub-delegations are created from a parent delegation. Nexario builds a two-level chain: the coordinator holds the root delegation from the user's ERC-7715 grant and creates per-agent sub-delegations with tighter constraints for each sub-task." },
      { type: "h2", text: "The chain for a typical task", eyebrow: "Delegation chain" },
      { type: "code", lang: "text", code: `User wallet
  └── ERC-7715 root grant: $1 USDC / 1hr
        └── Coordinator (depth 1): $0.95 remaining after planning fee
              ├── Research agent (depth 2): $0.10 cap
              ├── Audit agent    (depth 2): $0.15 cap
              ├── Executor agent (depth 2): $0.05 + transfer amount
              └── Report agent   (depth 2): $0.05 cap` },
      { type: "p", text: "Each sub-delegation is a new delegation object created by the coordinator, encoding only the sub-agent's permitted amount, signed with the coordinator's authority. When a sub-agent redeems via 1Shot, the relay validates the entire chain: user → coordinator → agent → execution. If any link is invalid — wrong signature, expired, over-budget, revoked — the bundle reverts before any USDC moves." },
      { type: "h2", text: "On-chain validation", eyebrow: "RedeemDelegations" },
      { type: "p", text: "1Shot's `send7710Transaction` takes the decoded delegation chain as `permissionContext` in each transaction object and includes it in the `RedeemDelegations` call to the MetaMask DelegationManager. The DelegationManager validates the full chain on-chain — not off-chain, not in a relay pre-check, but in the actual Base transaction — before allowing the execution outputs." },
    ],
  },
  {
    id: "eip-7702", group: "Core Concepts", title: "EIP-7702 — EOA to Smart Account", eyebrow: "Core Concepts",
    blocks: [
      { type: "lead", text: "EIP-7702 is what makes Nexario work without users deploying a new smart contract wallet. The MetaMask DelegationManager is an EIP-7702 stateless delegator." },
      { type: "specs", items: [
        ["DelegationManager", "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3"],
      ] },
      { type: "p", text: "When a user signs an ERC-7715 grant in Flask, their regular Ethereum address (EOA) gains the ability to participate in ERC-7710 delegation chains through the DelegationManager. No contract is deployed. No new address is created. No seed phrase migration. The user's existing Flask wallet address is the same address that appears as `delegator` in every delegation struct and in every Basescan transaction." },
      { type: "p", text: "From the DelegationManager's perspective: when `RedeemDelegations` is called with a delegation chain rooted at a user's EOA, EIP-7702 allows the DelegationManager to act as the execution logic for that EOA for the duration of the delegation — validating the chain and authorizing the execution outputs." },
      { type: "callout", tone: "tee", title: "The value proposition", text: "Any standard MetaMask Flask user gets gasless execution, scoped permissions, and cryptographic delegation chains without touching their wallet setup. Their EOA becomes a smart account the moment they sign the ERC-7715 grant." },
    ],
  },
  {
    id: "session-budgets", group: "Core Concepts", title: "Session Budgets", eyebrow: "Core Concepts",
    blocks: [
      { type: "lead", text: "Session budgets are enforced at two independent levels: cryptographic on-chain enforcement, and off-chain tracking for display." },
      { type: "h2", text: "On-chain enforcement", eyebrow: "Cryptographic" },
      { type: "p", text: "The ERC-7715 `erc20-token-periodic` caveat sets a `periodAmount` — the maximum USDC transferable per period. The `ERC20PeriodTransferEnforcer` validates every 1Shot execution bundle against the cumulative amount transferred in the current period. If a bundle would exceed the cap, the estimate returns `ERC20PeriodTransferEnforcer:insufficient-balance` and the bundle is never submitted — this happens in `relayer_estimateFee`, before any gas is spent." },
      { type: "callout", tone: "tee", title: "Absolute", text: "The Nexario backend cannot instruct agents to spend more than the period cap. The coordinator's sub-task budget allocations are guidance — the actual cap is the on-chain allowance, which decrements with each confirmed execution." },
      { type: "h2", text: "Off-chain tracking", eyebrow: "Display" },
      { type: "p", text: "The backend `sessions` table tracks `budget_usdc` and `spent_usdc` for real-time display and pre-flight checks, updated after each confirmed 1Shot transaction using actual fees paid (relay fee + agent fee per execution), not the planned allocation." },
      { type: "p", text: "The executor agent also performs an application-level budget check before submitting transfers: it compares the transfer amount against `availableBudgetUsdc` and blocks if the amount would exceed what's left — a clean user-facing error before the on-chain enforcer would catch it." },
    ],
  },
  {
    id: "reputation-system", group: "Core Concepts", title: "Reputation System", eyebrow: "Core Concepts",
    blocks: [
      { type: "lead", text: "After every completed task, the Nexario oracle writes five reputation tags to the ReputationRegistry on Base mainnet — one set per agent that executed in the task." },
      { type: "specs", items: [
        ["Oracle", "0x1C280993F1423dc3DC050aFE5bfe5FbBDb7b05c3"],
        ["Registry", "0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82"],
      ] },
      { type: "h2", text: "Tags written per agent per task", eyebrow: "Five tags" },
      { type: "table", head: ["Tag", "Value", "Decimals", "Meaning"], rows: [
        ["`revenues`", "USDC earned in cents", "2", "e.g. 10 = $0.10"],
        ["`successRate`", "100 per success", "0", "Accumulates per task"],
        ["`responseTime`", "Milliseconds", "0", "Total inference + relay time"],
        ["`delegationDepth`", "Integer", "0", "ERC-7710 hops used"],
        ["`caveatCompliance`", "1 = complied", "0", "Enforcer constraint adherence"],
      ] },
      { type: "callout", tone: "tee", title: "Reputation can't be faked", text: "The feedbackHash passed with each giveFeedback() call is the 1Shot task ID — the hash of the relay transaction. A reputation score cannot be written without a corresponding confirmed on-chain payment. You cannot fake reputation without faking the payment first." },
      { type: "h2", text: "How reputation affects selection", eyebrow: "Gating" },
      { type: "p", text: "Users set `agentRequirements` per agent type at authorization time — minimum values for `minReputation` (combined score) and `minRevenue` (total USDC earned). The coordinator reads live reputation cache values, refreshed from the ReputationRegistry after each task, and checks them against the user's requirements before including any agent in a plan. Agents below threshold are excluded before any delegation is redeemed." },
      { type: "h2", text: "Reading reputation on-chain", eyebrow: "cast call" },
      { type: "code", lang: "bash", code: `# Check research agent earnings
cast call 0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82 \\
  "getSummary(uint256,address[],string,string)(uint64,int128,uint8)" \\
  2 "[0x1C280993F1423dc3DC050aFE5bfe5FbBDb7b05c3]" "revenues" "task" \\
  --rpc-url https://mainnet.base.org
# -> count: 31, value: 31290, decimals: 2  ->  $312.90 earned across 31 tasks` },
    ],
  },
];

window.DOC_PAGES_1 = DOC_PAGES_1;
