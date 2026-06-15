/* docsContent3.jsx — 1Shot, Venice, x402, API Reference, Contracts, DEX, Roadmap */

const DOC_PAGES_3 = [
  /* ============ 1SHOT ============ */
  {
    id: "oneshot-how", group: "1Shot Integration", title: "How It Works", eyebrow: "1Shot Integration",
    blocks: [
      { type: "lead", text: "1Shot is the ERC-7710 gasless relay that converts delegation proofs into confirmed Base mainnet transactions. Every Nexario agent execution flows through 1Shot." },
      { type: "p", text: "The user's `permissionsContext` is the authorization. 1Shot validates the delegation chain through the MetaMask DelegationManager on-chain, pays the Base gas fee from its own ETH balance, and deducts only USDC from the user's delegated allowance." },
      { type: "callout", tone: "tee", title: "All-or-nothing bundles", text: "Every 1Shot submission is a multi-execution bundle: at minimum the relay fee ($0.01) and the agent fee ($0.05–$0.20). Executor tasks add a third execution. All land in one Base transaction — if any execution fails, all revert. Partial fills are impossible." },
      { type: "h2", text: "Cost structure", eyebrow: "Per execution" },
      { type: "list", items: [
        "Relay fee: $0.01 USDC (fixed, always)",
        "Agent fee: varies by agent ($0.05 to $0.20)",
        "No ETH, no gas estimation, no price exposure",
      ] },
      { type: "p", text: "A research + audit + executor + report pipeline (4 agents × relay fee + 4 agent fees + 1 USDC transfer) costs approximately **$0.39 total** — all in USDC, confirmed in ~6 seconds on Base." },
    ],
  },
  {
    id: "oneshot-methods", group: "1Shot Integration", title: "API Methods", eyebrow: "1Shot Integration",
    blocks: [
      { type: "lead", text: "Four JSON-RPC methods carry every Nexario relay: discover capabilities, quote the fee, simulate the bundle, then submit it and resolve the real transaction hash." },
      { type: "h2", text: "relayer_getCapabilities", eyebrow: "Discovery" },
      { type: "p", text: "Called once per chain on startup. Returns supported chains, accepted tokens, relay target address, and fee collector. Cached permanently per chain." },
      { type: "code", lang: "javascript", code: `const caps = await rpc7710('relayer_getCapabilities', { chainId: '8453' })
// {
//   targetAddress:  '0x26a529124f0bbf9af9d8f9f84a43efe47cf1199a',
//   feeCollector:   '0xE936e8FAf4A5655469182A49a505055B71C17604',
//   acceptedTokens: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
//   minFee:         '10000',
//   supportedChains: ['8453']
// }` },
      { type: "h2", text: "relayer_estimateFee", eyebrow: "Pre-flight simulation" },
      { type: "p", text: "Validates the delegation chain, checks enforcer constraints, and verifies the period allowance. Returns `success: true` and an `enrichedContext` for submission. If the bundle would fail — invalid delegation, enforcer rejection, expired session — the estimate errors and no submission is made. No gas is spent." },
      { type: "code", lang: "javascript", code: `const estimate = await rpc7710('relayer_estimate7710Transaction', {
  chainId: '8453',
  transactions: [{
    permissionContext: [decodedDelegation],
    executions: [
      { target: USDC, value: '0x0', data: relayFeeTransferCalldata },
      { target: USDC, value: '0x0', data: agentFeeTransferCalldata }
    ]
  }]
})
// { success: true, requiredPaymentAmount: '10000', context: '0x...' }` },
      { type: "h2", text: "send7710Transaction", eyebrow: "Submit" },
      { type: "p", text: "Submits the ERC-7710 bundle and returns a 1Shot task ID immediately — the transaction is pending. Confirmation on Base takes ~1–3 seconds. Pass the enriched `context` from the estimate step." },
      { type: "code", lang: "javascript", code: `const result = await rpc7710('send7710Transaction', {
  chainId: '8453',
  transactions: [{ permissionContext: [decodedDelegation], executions: [/* … */] }],
  context: estimate.context
})
// { taskId: '0x4e1924d0f9f741fae55177f3186b07f1f34c3ca88b66669521327ac862af729e' }` },
      { type: "h2", text: "relayer_getStatus", eyebrow: "Resolve hash" },
      { type: "p", text: "Resolves the real Base transaction hash from the 1Shot task ID. Nexario polls this after submission (up to 10 attempts, 3s apart). The resolved hash is stored in `sub_tasks`, passed to the synthesis prompt, and surfaced in the `txDetails` array of the `task_complete` event." },
      { type: "code", lang: "javascript", code: `const status = await rpc7710('relayer_getStatus', {
  id: '0x4e1924d0f9f741...', logs: false
})
// { status: 1, receipt: { transactionHash: '0x6a3a4d1c97359eff...' } }` },
    ],
  },
  {
    id: "oneshot-bundle", group: "1Shot Integration", title: "Bundle Structure", eyebrow: "1Shot Integration",
    blocks: [
      { type: "lead", text: "A full 1Shot bundle with a USDC transfer (executor task): one permissionContext carrying the decoded ERC-7710 delegation, and three executions — relay fee, agent fee, and the user's action." },
      { type: "code", lang: "typescript", code: `{
  chainId: '8453',
  transactions: [{
    permissionContext: [{
      delegate:   '0x26a529124f0bbf9af9d8f9f84a43efe47cf1199a',  // 1Shot target
      delegator:  '0xc29De53c93A4b127D71457f4f096A63B9cB1061e',  // user's Flask wallet
      authority:  '0xffffffffffffffffffffffffffffffffffffffff...',
      caveats: [{
        enforcer: '0x474e3ae7e169e940607cc624da8a15eb120139ab', // ERC20PeriodTransferEnforcer
        terms:    '0x...'   // token address + period amount + period duration
      }],
      salt:      '0x000...000',
      signature: '0x...'    // user's Flask EIP-712 signature
    }],
    executions: [
      { target: USDC, value: '0x0',
        data: transfer('0xE936…7604', 10000n) },   // relay fee: $0.01
      { target: USDC, value: '0x0',
        data: transfer('0x98a7…fe0e', 50000n) },    // agent fee: $0.05
      { target: USDC, value: '0x0',
        data: transfer('0x0D8C…28c3', 100000n) }    // user action: $0.10 to recipient
    ]
  }],
  context: estimatedContext   // from relayer_estimateFee
}` },
      { type: "callout", tone: "note", title: "One transaction, one Basescan entry", text: "All three executions are redeemed atomically in a single RedeemDelegations call to the DelegationManager. The relay fee, agent fee, and user transfer share one confirmed Base transaction." },
    ],
  },
  {
    id: "oneshot-live", group: "1Shot Integration", title: "Live Transactions", eyebrow: "1Shot Integration",
    blocks: [
      { type: "lead", text: "Real Nexario task executions on Base mainnet — each a RedeemDelegations call on the MetaMask DelegationManager." },
      { type: "table", head: ["Transaction", "Description"], rows: [
        ["[0x5b2df6ae…b79466](https://basescan.org/tx/0x5b2df6aebfb2d8302c140dc5f3e9322d9b58501a47b7c8fe681c49ca5fb79466)", "Multi-agent pipeline — research + audit + report"],
        ["[0xf64918e4…942e49](https://basescan.org/tx/0xf64918e42c4f1078311338b2e5b1015daaad2250ce1b1c904a680d64e5942e49)", "Executor — USDC transfer bundled with agent fee"],
        ["[0xe9dff0f0…df8ac7](https://basescan.org/tx/0xe9dff0f0b27289d45587bb480f2e64178a67aa4f360feaea7835a85606df8ac7)", "TEE pipeline — counsel + intelligence enclaves"],
      ] },
      { type: "callout", tone: "tee", title: "Verifiable", text: "Every agent execution in Nexario is visible on Basescan as a RedeemDelegations call to the DelegationManager. Nothing in the flow is simulated." },
    ],
  },

  /* ============ VENICE ============ */
  {
    id: "venice-models", group: "Venice AI", title: "Models", eyebrow: "Venice AI",
    blocks: [
      { type: "lead", text: "Eight Venice model families across ten agents. Each is chosen for the task requirements of that specific agent — not a single model for everything." },
      { type: "table", head: ["Model ID", "Agent", "Reason"], rows: [
        ["`qwen3-235b-a22b-instruct-2507`", "Coordinator", "Largest model, best multi-step planning"],
        ["`kimi-k2-6`", "Research, Reputation", "Native web search integration"],
        ["`qwen3-235b-a22b-thinking-2507`", "Audit", "Extended reasoning for compound risk"],
        ["`kimi-k2-5`", "Report", "Synthesis quality, TTS handoff"],
        ["`e2ee-qwen3-6-35b-a3b`", "Counsel, Intelligence", "Venice TEE — zero data retention"],
        ["`e2ee-gemma-4-26b-a4b-uncensored-p`", "Reflection", "TEE + uncensored"],
        ["`qwen3-5-9b`", "Monitor", "Fast, lightweight condition parsing"],
        ["Venice TTS `af_heart`", "Report", "MP3 audio brief generation"],
      ] },
    ],
  },
  {
    id: "venice-tee", group: "Venice AI", title: "TEE Enclaves", eyebrow: "Venice AI",
    blocks: [
      { type: "lead", text: "Venice TEE models carry the e2ee- prefix. They run in hardware-attested secure enclaves — Intel SGX or equivalent. Zero data retention: inputs and outputs are not stored, not logged, not accessible to Venice staff, and not used for training. A hardware constraint, not a policy promise." },
      { type: "p", text: "Attestation is verifiable. Users who require proof that their query ran in a TEE can request the attestation certificate from Venice." },
      { type: "h2", text: "Automatic TEE routing", eyebrow: "Privacy classifier" },
      { type: "p", text: "The coordinator's privacy classifier uses keyword patterns and a fast Venice classification call to assign a score and categories." },
      { type: "table", head: ["Score / Category", "Routing"], rows: [
        ["score > 65", "Coordinator itself uses a TEE model for planning"],
        ["`legal` detected", "Sub-task routes to Counsel (e2ee-qwen3-6-35b-a3b)"],
        ["`corporate` / competitive", "Sub-task routes to Intelligence (e2ee-qwen3-6-35b-a3b)"],
        ["`personal` / `medical`", "Sub-task routes to Reflection (e2ee-gemma-4-26b…)"],
        ["`surveillance` keyword", "Excluded — crypto price monitoring is not surveillance"],
      ] },
      { type: "callout", tone: "note", title: "No configuration needed", text: "Sending \"What are the legal implications of X?\" routes to Counsel automatically. Sending \"Research AERO price\" does not." },
    ],
  },
  {
    id: "venice-search", group: "Venice AI", title: "Web Search", eyebrow: "Venice AI",
    blocks: [
      { type: "lead", text: "Venice native web search is enabled per-request by passing enableWebSearch: true in the chat inference body. Only the Research and Reputation agents use this — the others work from model knowledge or provided context." },
      { type: "p", text: "When enabled, Venice fetches live web results and injects them into the model's context before generating a response. From Nexario's perspective this is a single API call — no separate search step, no search API key, no rate limit." },
      { type: "callout", tone: "tee", title: "One inference call", text: "The Research agent's description tells it exactly what to search for (e.g. \"Fetch current ETH price and recent 24h market conditions\") and Kimi K2.6 searches and responds in one inference call." },
    ],
  },
  {
    id: "venice-tts", group: "Venice AI", title: "TTS", eyebrow: "Venice AI",
    blocks: [
      { type: "lead", text: "Venice TTS generates an MP3 audio brief after each task." },
      { type: "steps", items: [
        { t: "Coordinator synthesis completes — final result text is ready" },
        { t: "Text is capped at 800 characters (a ~45–60 second brief)" },
        { t: "textToSpeech({ text, voice: 'af_heart', format: 'mp3' }) called via Venice TTS API" },
        { t: "Returned audio buffer converted to a data:audio/mp3;base64,… data URL" },
        { t: "Audio URL included in the task_complete SSE event as result.audioUrl" },
        { t: "Stored in chat_messages for persistence" },
        { t: "Rendered as an inline audio player in the chat UI" },
      ] },
      { type: "callout", tone: "note", title: "Matches the screen", text: "Audio is generated from the coordinator's final synthesis text — not an intermediate draft or the report agent's sub-output. What the user hears matches what they see." },
    ],
  },

  /* ============ X402 ============ */
  {
    id: "x402-paywalls", group: "x402 Protocol", title: "Agent Paywalls", eyebrow: "x402 Protocol",
    blocks: [
      { type: "lead", text: "All 10 Nexario agents expose HTTP 402 paywalls at POST /api/agents/:agentId/call. Any external caller can pay per inference in USDC on Base and receive Venice AI output without going through the full task pipeline." },
      { type: "p", text: "Without a payment proof header, every agent endpoint returns `402 Payment Required`:" },
      { type: "code", lang: "http", code: `HTTP/1.1 402 Payment Required
X-Payment-Required: true
X-Payment-Amount: 100000
X-Payment-Token: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
X-Payment-Recipient: 0x837D25DD587d7288c09b868aFC9521df343C1788
X-Payment-Chain: 8453
X-Payment-Method: x402+1shot

{
  "error": "Payment Required",
  "paymentRequired": {
    "amount": "100000",
    "amountUsdc": 0.10,
    "recipient": "0x837D25DD587d7288c09b868aFC9521df343C1788",
    "chainId": 8453,
    "method": "x402",
    "endpoint": "/api/agents/2/call"
  }
}` },
      { type: "callout", tone: "tee", title: "Nexario's x402 extension", text: "X-Payment-Method: x402+1shot signals that payment should flow through 1Shot's ERC-7710 relay rather than a direct on-chain transfer — enabling gasless payment from any wallet with a valid ERC-7715 delegation." },
    ],
  },
  {
    id: "x402-flow", group: "x402 Protocol", title: "Payment Flow", eyebrow: "x402 Protocol",
    blocks: [
      { type: "lead", text: "Seven steps from a 402 to a verified Venice result." },
      { type: "steps", items: [
        { t: "Call POST /api/agents/:agentId/call without proof → 402 Payment Required" },
        { t: "Read X-Payment-Amount, X-Payment-Recipient, X-Payment-Chain from the response headers" },
        { t: "Submit a 1Shot send7710Transaction bundle transferring the required USDC to the recipient — use your own permissionsContext as authorization" },
        { t: "Poll relayer_getStatus until receipt.transactionHash is present" },
        { t: "Retry the agent call with X-Payment-Proof: {transactionHash}" },
        { t: "Nexario verifies the proof — confirms a USDC transfer of at least the required amount to the correct recipient on Base mainnet" },
        { t: "Agent executes Venice inference and returns the result" },
      ] },
      { type: "callout", tone: "note", title: "Automatic between agents", text: "Steps 3–5 happen automatically within the Nexario coordinator loop when one agent pays another. For external callers, any 1Shot implementation can handle steps 3–4." },
    ],
  },
  {
    id: "x402-cli", group: "x402 Protocol", title: "CLI Examples", eyebrow: "x402 Protocol",
    blocks: [
      { type: "lead", text: "Call any agent directly with curl once you hold a valid payment proof." },
      { type: "code", lang: "bash", code: `# Research agent — ETH market query
curl -X POST https://api.nexario.xyz/api/agents/2/call \\
  -H "Content-Type: application/json" \\
  -H "X-Payment-Proof: 0x5b2df6aebfb2d8302c140dc5f3e9322d9b58501a47b7c8fe681c49ca5fb79466" \\
  -d '{"query": "Current ETH price and 24h market overview with key support levels"}'

# Audit agent — DeFi risk analysis
curl -X POST https://api.nexario.xyz/api/agents/3/call \\
  -H "X-Payment-Proof: 0x..." \\
  -d '{"query": "Risk analysis for USDC/ETH liquidity on Uniswap v3 Base"}'

# Counsel agent — private legal analysis (runs in Venice TEE)
curl -X POST https://api.nexario.xyz/api/agents/7/call \\
  -H "X-Payment-Proof: 0x..." \\
  -d '{"query": "Legal implications of operating a DeFi yield aggregator for Indian users"}'

# Monitor — price condition setup (returns confirmation, not result)
curl -X POST https://api.nexario.xyz/api/agents/5/call \\
  -H "X-Payment-Proof: 0x..." \\
  -d '{"query": "Alert me when ETH drops below $1500 and send a market conditions report"}'` },
    ],
  },

  /* ============ API REFERENCE ============ */
  {
    id: "api-authorize", group: "API Reference", title: "Sessions & Authorization", eyebrow: "API Reference",
    blocks: [
      { type: "lead", text: "Base URL: api.nexario.xyz. All endpoints except GET /health and GET /api/sdk require X-User-Address and X-API-Key headers." },
      { type: "h2", text: "POST /api/authorize", eyebrow: "Create a session" },
      { type: "p", text: "Create an ERC-7715 session. Call immediately after receiving the `permissionsContext` from MetaMask Flask." },
      { type: "code", lang: "json", code: `// Body
{
  "userAddress":        "0xc29De53c93A4b127D71457f4f096A63B9cB1061e",
  "permissionsContext": "0x0000000000000000...",
  "delegationManager":  "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3",
  "budgetUsdc":         1,
  "expiresAt":          1781380720,
  "chatId":             "93fcdd99-7f06-4edd-8fc6-732f62dc8b19",
  "chainId":            8453,
  "actions":            ["research", "audit", "report", "executor"],
  "agentRequirements":  { "research": { "minReputation": 80, "minRevenue": 0, "maxBudget": 3 } },
  "veniceQualityOracle": true
}` },
      { type: "code", lang: "json", code: `// Response 200
{
  "sessionId":      "7302d3a2-eeaf-4437-c24f-488d0ab5f41b",
  "chatId":         "93fcdd99-7f06-4edd-8fc6-732f62dc8b19",
  "budgetUsdc":     1,
  "remainingUsdc":  1,
  "expiresAt":      1781380720,
  "allowedActions": ["research", "audit", "report", "executor"]
}` },
      { type: "p", text: "On success: session written to `sessions`, chat thread created/updated in `chat_threads` with `session_id` linked, and an on-chain lease created via `AuthorityLeaseRegistry.createLease()`." },
      { type: "h2", text: "POST /api/authorize/revoke", eyebrow: "Revoke" },
      { type: "p", text: "Marks a session revoked in the backend — future task submissions are rejected. Does not revoke the on-chain ERC-7715 permission (do that separately in Flask). Body: `{ \"sessionId\": \"uuid\" }` → `{ \"revoked\": true }`." },
      { type: "h2", text: "GET /api/authorize/chats", eyebrow: "Restore" },
      { type: "p", text: "Returns all chat threads for the user with full session information including the stored `permissionsContext`. Used by the frontend on load to restore sessions without re-authorization." },
      { type: "h2", text: "GET /api/authorize/chat/messages", eyebrow: "History" },
      { type: "p", text: "Full message history for a chat thread. Query: `?sessionId={chatId}`. Message `type` values: `user`, `agent` (coordinator synthesis), `autonomous` (scheduled/monitor trigger), `system` (session events)." },
    ],
  },
  {
    id: "api-tasks", group: "API Reference", title: "Tasks & Events", eyebrow: "API Reference",
    blocks: [
      { type: "h2", text: "POST /api/tasks", eyebrow: "Submit" },
      { type: "p", text: "Submit a task to the agent network. Requires an active session for the `chatId`. Runs asynchronously — connect to the SSE stream for progress." },
      { type: "code", lang: "json", code: `// Body
{ "userMessage": "Analyze ETH price and suggest entry points", "chatId": "93fcdd99-…" }
// Response 200
{ "taskId": "768353c4-47ff-4e75-05d3-d37d34979b80", "status": "queued" }` },
      { type: "h2", text: "GET /api/events/:taskId", eyebrow: "SSE stream" },
      { type: "p", text: "Server-Sent Events stream for a task. Use `EventSource.onmessage` — events are unnamed, each payload a JSON string with a `type` field. The server buffers all events in `sse_events` and replays them for clients that connect late. A 30-second heartbeat keeps the connection alive." },
      { type: "table", head: ["Event type", "Payload"], rows: [
        ["`status_change`", "planning · executing · synthesizing · completed · failed"],
        ["`plan_ready`", "The coordinator's subTasks array with budgets and descriptions"],
        ["`subtask_started`", "Streaming token chunk (`delta`) from Venice inference"],
        ["`delegation_confirmed`", "agentName + oneShotTaskId for the confirmed bundle"],
        ["`task_complete`", "result.content, audioUrl, totalSpentUsdc, txDetails[]"],
        ["`autonomous_task_started`", "scheduledBy, triggeredBy, prompt — for monitor/scheduled runs"],
        ["`error`", "message string"],
      ] },
      { type: "code", lang: "json", code: `// task_complete
{
  "type": "task_complete",
  "result": {
    "content": "## ETH Analysis\\n\\nCurrent price: $1,662...",
    "audioUrl": "data:audio/mp3;base64,...",
    "totalSpentUsdc": "0.3300",
    "txDetails": [
      { "agentName": "research", "oneShotTaskId": "0x896f2d4f...", "feeUsdc": 0.10, "hasTransfer": false },
      { "agentName": "executor", "oneShotTaskId": "0x22f5b1ce...", "feeUsdc": 0.05, "hasTransfer": true }
    ]
  }
}` },
      { type: "callout", tone: "note", title: "Real hashes", text: "txDetails.oneShotTaskId contains the actual Base mainnet transaction hash (resolved from relayer_getStatus) — not the 1Shot internal task ID. hasTransfer: true means the bundle included a user-action execution." },
      { type: "h2", text: "GET /api/tasks", eyebrow: "List" },
      { type: "p", text: "Recent tasks for the authenticated user. Query: `?limit=20&offset=0`. `totalSpentUsdc` is in USDC atoms — divide by 1,000,000 for the display value." },
    ],
  },
  {
    id: "api-agents", group: "API Reference", title: "Agents API", eyebrow: "API Reference",
    blocks: [
      { type: "h2", text: "GET /api/agents", eyebrow: "List with reputation" },
      { type: "p", text: "All registered agents with live on-chain reputation from the ReputationRegistry cache." },
      { type: "code", lang: "json", code: `{
  "agents": [{
    "agentId": 2,
    "name": "Research Agent — Nexario",
    "wallet": "0x837D25DD587d7288c09b868aFC9521df343C1788",
    "veniceModel": "kimi-k2-6",
    "isTEE": false,
    "x402Support": true,
    "feePerCall": 0.10,
    "capabilities": ["research", "web-search", "on-chain-data"],
    "reputation": {
      "revenues": 312.90, "successRate": 490, "responseTime": 2204247,
      "delegationDepth": 62, "caveatCompliance": 31, "taskCount": 31
    }
  }]
}` },
      { type: "p", text: "Reputation values are raw on-chain sums. `revenues` displays as dollars; `successRate` is the raw sum (490 across 31 tasks); `taskCount` is inferred from the `revenues` entry count." },
      { type: "h2", text: "GET /api/agents/:agentId", eyebrow: "Detail" },
      { type: "p", text: "Single agent with full detail — same schema as one item from the list." },
      { type: "h2", text: "POST /api/agents/:agentId/call", eyebrow: "x402-gated" },
      { type: "p", text: "Returns `402` without proof; executes with a valid `X-Payment-Proof`. Body: `{ \"query\": \"…\", \"context\": \"optional\" }`. Success returns `{ result, agentId, model, paymentVerified: true }`." },
      { type: "h2", text: "GET /api/agents/:agentId/reputation", eyebrow: "On-chain profile" },
      { type: "code", lang: "json", code: `{
  "agentId": 2,
  "tags": {
    "revenues":         { "count": 31, "total": 31290,   "decimals": 2, "displayValue": 312.90 },
    "successRate":      { "count": 31, "total": 490,     "decimals": 0 },
    "responseTime":     { "count": 31, "total": 2204247, "decimals": 0, "avg": 71105 },
    "delegationDepth":  { "count": 31, "total": 62,      "decimals": 0, "avg": 2 },
    "caveatCompliance": { "count": 31, "total": 31,      "decimals": 0 }
  }
}` },
    ],
  },
  {
    id: "api-schedule", group: "API Reference", title: "Scheduling", eyebrow: "API Reference",
    blocks: [
      { type: "lead", text: "Schedule recurring autonomous tasks. The active session's permissionsContext is stored with the task at creation and used to run it without wallet interaction." },
      { type: "h2", text: "POST /api/schedule", eyebrow: "Create" },
      { type: "code", lang: "json", code: `// Body
{
  "name":     "Daily ETH market brief",
  "prompt":   "Fetch current ETH price and summarize 24h market conditions",
  "schedule": "every:1:hours",
  "chatId":   "93fcdd99-7f06-4edd-8fc6-732f62dc8b19"
}
// Response 200
{ "taskId": "uuid", "schedule": "every:1:hours", "nextRunAt": 1781380720, "enabled": true }` },
      { type: "h3", text: "Schedule format strings" },
      { type: "table", head: ["Format", "Example", "Meaning"], rows: [
        ["`every:N:minutes`", "every:30:minutes", "Every 30 minutes"],
        ["`every:N:hours`", "every:1:hours", "Every hour"],
        ["`every:N:days`", "every:1:days", "Daily"],
        ["`daily:HH:MM`", "daily:09:00", "Every day at 9:00 UTC"],
        ["`weekly:DOW:HH:MM`", "weekly:1:09:00", "Every Monday at 9:00 UTC"],
      ] },
      { type: "p", text: "DOW: 1=Monday … 7=Sunday. Minimum interval: `every:5:minutes`." },
      { type: "h2", text: "Manage", eyebrow: "GET · DELETE · PATCH" },
      { type: "list", items: [
        "`GET /api/schedule` — all scheduled tasks for the user (with runCount, lastRunAt, nextRunAt)",
        "`DELETE /api/schedule/:taskId` — cancel and permanently delete → `{ \"deleted\": true }`",
        "`PATCH /api/schedule/:taskId` — pause/resume without deleting. Body `{ \"enabled\": false }`",
      ] },
    ],
  },
  {
    id: "api-system", group: "API Reference", title: "System", eyebrow: "API Reference",
    blocks: [
      { type: "h2", text: "GET /health", eyebrow: "No auth" },
      { type: "code", lang: "json", code: `{ "status": "ok", "uptime": 3600, "agents": 10, "timestamp": 1781377120 }` },
      { type: "h2", text: "GET /api/sdk", eyebrow: "No auth" },
      { type: "p", text: "Contract addresses, chain, and USDC address. Use this to bootstrap any integration." },
      { type: "code", lang: "json", code: `{
  "contracts": {
    "agentRegistry":          "0x3a7C05101aC0Bb99e06026855459d376d7906f15",
    "reputationRegistry":     "0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82",
    "authorityLeaseRegistry": "0x5D20459A2C49D5Ba7E5aB0389baaAbFe6F58f2a4",
    "delegationManager":      "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3"
  },
  "chainId": 8453,
  "usdc":    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
}` },
    ],
  },

  /* ============ CONTRACTS ============ */
  {
    id: "contract-agentregistry", group: "Contracts", title: "AgentRegistry", eyebrow: "Contracts · ERC-8004",
    blocks: [
      { type: "lead", text: "ERC-721 NFT registry for AI agents. Each token represents one agent with on-chain metadata containing its full configuration." },
      { type: "specs", items: [
        ["Address", "[0x3a7C05101aC0Bb99e06026855459d376d7906f15](https://basescan.org/address/0x3a7C05101aC0Bb99e06026855459d376d7906f15)"],
      ] },
      { type: "code", lang: "solidity", code: `// Register a new agent — returns token ID
function register(string memory agentURI) external returns (uint256 agentId)

// Get agent configuration URI (data:application/json;base64,...)
function tokenURI(uint256 tokenId) external view returns (string memory)

// Get owner of agent NFT
function ownerOf(uint256 tokenId) external view returns (address)` },
      { type: "p", text: "The `agentURI` is base64-encoded JSON containing name, veniceModel, isTEE, x402Support, capabilities, feePerCall, wallet, and endpoint." },
      { type: "h2", text: "Live agent tokens", eyebrow: "10 NFTs" },
      { type: "table", head: ["Token", "Agent", "Wallet"], rows: [
        ["#1", "Coordinator", "0x98a738D2…EFF97Ee2"],
        ["#2", "Research", "0x837D25DD…f343C1788"],
        ["#3", "Audit", "0x2716ad37…57293246"],
        ["#4", "Report", "0xEA15D2f2…69863a7"],
        ["#5", "Monitor", "0x98a738D2…EFF97Ee2"],
        ["#6", "Executor", "0x98a738D2…EFF97Ee2"],
        ["#7", "Counsel", "0x2716ad37…57293246"],
        ["#8", "Reputation", "0x837D25DD…f343C1788"],
        ["#9", "Intelligence", "0x2716ad37…57293246"],
        ["#10", "Reflection", "0xEA15D2f2…69863a7"],
      ] },
    ],
  },
  {
    id: "contract-reputation", group: "Contracts", title: "ReputationRegistry", eyebrow: "Contracts",
    blocks: [
      { type: "lead", text: "Tagged feedback store per agent. Only the oracle address can write feedback without being the agent's owner — enforced on-chain by require(!_isOwnerOrOperator(agentId, msg.sender))." },
      { type: "specs", items: [
        ["Address", "[0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82](https://basescan.org/address/0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82)"],
        ["Oracle", "0x1C280993F1423dc3DC050aFE5bfe5FbBDb7b05c3"],
      ] },
      { type: "code", lang: "solidity", code: `// Write a feedback tag (oracle only for third-party agents)
function giveFeedback(
  uint256 agentId,
  bytes32 feedbackHash,   // 1Shot transaction hash — payment proof
  string memory tag1,     // 'revenues' | 'successRate' | 'responseTime' | ...
  int128 value,
  uint8 decimals
) external

// Read aggregated tag summary across multiple oracle sources
function getSummary(
  uint256 agentId,
  address[] memory oracles,
  string memory tag1,
  string memory context
) external view returns (uint64 count, int128 summaryValue, uint8 decimals)` },
      { type: "code", lang: "bash", code: `# Research agent total revenue
cast call 0xDf2Fbb3fa60ebB1214b782697707cEec14Ae4F82 \\
  "getSummary(uint256,address[],string,string)(uint64,int128,uint8)" \\
  2 "[0x1C280993F1423dc3DC050aFE5bfe5FbBDb7b05c3]" "revenues" "task" \\
  --rpc-url https://mainnet.base.org
# count=31, value=31290, decimals=2  ->  $312.90 across 31 tasks` },
    ],
  },
  {
    id: "contract-lease", group: "Contracts", title: "AuthorityLeaseRegistry", eyebrow: "Contracts",
    blocks: [
      { type: "lead", text: "Records on-chain authority leases created at the start of each task, tracking delegate, budget, depth, and delegation hash." },
      { type: "specs", items: [
        ["Address", "[0x5D20459A2C49D5Ba7E5aB0389baaAbFe6F58f2a4](https://basescan.org/address/0x5D20459A2C49D5Ba7E5aB0389baaAbFe6F58f2a4)"],
      ] },
      { type: "code", lang: "solidity", code: `function createLease(
  address delegate,
  uint256 budgetUsdc,
  uint8 delegationDepth,
  bytes32 delegationHash
) external returns (bytes32 leaseId)

function consumeLease(bytes32 leaseId, uint256 amount) external

function redelegate(
  bytes32 parentLeaseId,
  address subDelegate,
  uint256 subBudget
) external returns (bytes32 subLeaseId)` },
      { type: "h2", text: "MetaMask DelegationManager", eyebrow: "EIP-7702" },
      { type: "specs", items: [
        ["Address", "[0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3](https://basescan.org/address/0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3)"],
      ] },
      { type: "p", text: "EIP-7702 stateless delegator deployed by MetaMask. Validates the full ERC-7710 delegation chain on-chain as part of every `RedeemDelegations` call. Called by 1Shot on every Nexario relay transaction — every agent execution is visible on Basescan as a `RedeemDelegations` call to this contract." },
    ],
  },

  /* ============ DEX ============ */
  {
    id: "dex-swaps", group: "DEX Swaps", title: "DEX Swaps", eyebrow: "DEX Swaps",
    blocks: [
      { type: "lead", text: "Nexario has a complete 0x Permit2 swap integration ready to execute — the infrastructure is finished, tested, and waiting on one permission type change." },
      { type: "h2", text: "What's built", eyebrow: "Ready" },
      { type: "list", items: [
        "`src/lib/dex/zeroex.ts` — 0x Permit2 quote and price API. Verified liquid Base tokens; quote returns exact buy amounts, price, and router calldata.",
        "`src/agents/executor.ts` — natural-language swap parsing, 0x quote fetching, permit2 approval bundling, buildSwapExecution().",
        "Monitor agent integration — Binance WebSocket conditions trigger swap pipelines autonomously.",
      ] },
      { type: "code", lang: "text", code: `Input:  0.5 USDC (500,000 atoms)
Output: 0.000300 ETH (300,323,518,290,947 atoms)
Router: 0x7747f8d2a76bd6345cc29622a946a929647f2359` },
      { type: "h2", text: "What's blocked", eyebrow: "The wall" },
      { type: "callout", tone: "warn", title: "ERC20PeriodTransferEnforcer:invalid-execution-length", text: "The erc20-token-periodic permission validates that every execution's calldata is a standard ERC-20 transfer(address,uint256) — exactly 68 bytes. The 0x swap router calldata is several kilobytes of multicall data. The enforcer rejects it before any gas is spent, caught at relayer_estimateFee." },
      { type: "list", items: [
        "Direct 0x Permit2 swap calldata → rejected (`invalid-execution-length`)",
        "Permit2 `approve(address,uint256)` prepended → also rejected (not a `transfer()`)",
        "`value: \"0\"` vs `value: \"0x0\"` formatting → not the issue",
        "`relayer_estimateFee` correctly surfaces the error before submission — no gas wasted",
      ] },
      { type: "h2", text: "The fix", eyebrow: "contract-call" },
      { type: "p", text: "ERC-7715 supports a `contract-call` permission type that allows arbitrary calldata to a specific contract address. Replacing `erc20-token-periodic` with a `contract-call` permission scoped to the 0x router (`0x7747f8d2a76bd6345cc29622a946a929647f2359`) would pass the swap calldata through the enforcer." },
      { type: "callout", tone: "tee", title: "No backend changes needed", text: "The 0x integration, calldata builder, permit2 approval, and monitor trigger pipeline are all ready. Only the wallet_grantPermissions permission type and 1Shot caveat support need to change." },
      { type: "h2", text: "Verified liquid tokens on Base", eyebrow: "via 0x" },
      { type: "table", head: ["Token", "Address"], rows: [
        ["USDC", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
        ["WETH", "0x4200000000000000000000000000000000000006"],
        ["cbETH", "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22"],
        ["AERO", "0x940181a94A35A4569E4529A3CDfB74e38FD98631"],
        ["BRETT", "0x532f27101965dd16442E59d40670FaF5eBB142E4"],
        ["VIRTUAL", "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b"],
        ["TOSHI", "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4"],
        ["DEGEN", "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"],
      ] },
    ],
  },

  /* ============ ROADMAP ============ */
  {
    id: "roadmap-near", group: "Roadmap", title: "Near-term", eyebrow: "Roadmap",
    blocks: [
      { type: "lead", text: "What's next for Nexario — the shortlist actively being built." },
      { type: "cards", cols: 1, items: [
        { tag: "DEX", t: "DEX swaps via contract-call permission", b: "All swap infrastructure is complete. Switching to a contract-call permission scoped to the 0x router unblocks USDC→ETH, USDC→AERO, and all verified Base pairs. Monitor-triggered autonomous swaps work end-to-end once resolved." },
        { tag: "MetaMask", t: "MetaMask Agent Wallets", b: "Selected for early access (one of ~200 builders globally). The ERC-8004 registry, reputation oracle, x402 paywalls, and ERC-7710 infrastructure are designed to connect naturally once the Agent Wallet API stabilises." },
        { tag: "Monitor", t: "Price watch persistence", b: "Binance WebSocket watches currently live in memory and are lost on backend restart. Persisting them to SQLite alongside wallet watches would let monitor sessions survive restarts." },
        { tag: "Multi-chain", t: "Cross-chain execution", b: "Extend 1Shot bundles to Arbitrum, Optimism, and Polygon. The agent and reputation infrastructure is chain-agnostic — only the relay configuration and USDC addresses change." },
        { tag: "A2A", t: "Agent-to-agent delegation", b: "Enable agents to spawn sub-agents with their own sub-budgets — research spawning a targeted data agent, the coordinator spawning a parallel research cluster. Deeper ERC-7710 chains than the current depth-2 limit." },
      ] },
    ],
  },
  {
    id: "roadmap-later", group: "Roadmap", title: "Later", eyebrow: "Roadmap",
    blocks: [
      { type: "lead", text: "Longer-horizon directions that build on the same delegation, reputation, and paywall primitives." },
      { type: "cards", cols: 1, items: [
        { tag: "Open", t: "User-deployed agents", b: "Upload a custom system prompt and select a Venice model. Nexario registers the agent as an ERC-8004 NFT, assigns it a wallet, exposes an x402 paywall, and routes tasks to it — external agents earning USDC through the same infrastructure." },
        { tag: "Routing", t: "Reputation-gated routing", b: "The coordinator selects agents dynamically by live on-chain reputation rather than fixed assignment. Highest-performing agent for each capability wins the sub-task; users set score floors at authorization." },
        { tag: "Yield", t: "USDC yield on idle budgets", b: "Deposit unspent session budget into Aave or Compound on Base. Earn yield during the session window. Withdraw automatically when tasks consume budget." },
        { tag: "Mobile", t: "Mobile", b: "MetaMask SDK, React Native, and push notifications for monitor triggers and autonomous task completions." },
      ] },
    ],
  },
];

window.DOC_PAGES_3 = DOC_PAGES_3;
