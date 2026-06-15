/* techstack.jsx */

const MM_POSSIBLE = [
  ["Per-task budget caps", "The ERC20PeriodTransferEnforcer validates every execution against the delegated amount. Agents cannot overspend — not by policy, by cryptographic constraint."],
  ["Sub-agent scoping", "The coordinator creates child delegations with tighter bounds per agent. Research gets $0.10, Audit gets $0.15. Each can only redeem what it was given."],
  ["Autonomous operation", "The permissionsContext is stored server-side. Scheduled tasks, price alerts, and recurring pipelines all execute using the stored delegation — no wallet connection after the first signature."],
  ["Instant revocation", "Session expiry and manual revoke both propagate immediately on-chain. No lag, no orphaned permissions."],
  ["Reputation-gated access", "Users set minimum agent reputation thresholds at authorization time. Agents below threshold are blocked before any delegation is redeemed."],
];
const MM_SPEC = [
  ["Permission type", "erc20-token-periodic"],
  ["Enforcer", "ERC20PeriodTransferEnforcer"],
  ["DelegationManager", "0xdb9B1e94…047dB3 (EIP-7702)"],
  ["Context size", "2,882 bytes ABI-encoded"],
  ["Chain", "Base mainnet (chainId: 8453)"],
  ["Redelegation", "ERC-7710 — coordinator → per-agent"],
  ["Validation", "On-chain, per execution, pre-state-change"],
];

const ONE_POSSIBLE = [
  ["Zero ETH for users", "Users authorize in USDC and pay in USDC. Gas is abstracted entirely — no bridge, no swap, no ETH on-ramp required."],
  ["Zero ETH for agents", "Agent wallets receive USDC fee payments via relay bundles. They never need ETH to exist on Base."],
  ["Multi-output atomicity", "Relay fee, agent fee, and user action land in one transaction. If any execution fails, the bundle reverts. Partial fills are impossible."],
  ["Real tx hashes", "relayer_getStatus resolves the actual Base transaction hash after confirmation. Users see Basescan links — not internal IDs."],
  ["Delegation chain proof", "1Shot validates the full ERC-7710 chain before executing. The on-chain redemption is the payment proof used as feedbackHash in the reputation oracle."],
  ["Pre-flight estimation", "relayer_estimateFee runs the full bundle simulation before submission. If the delegation is invalid or the budget is exhausted, the estimate fails cleanly before any gas is spent."],
];
const ONE_METHODS = [
  ["relayer_getCapabilities", "Called on startup. Returns supported chains, accepted tokens, target addresses, and fee collector. Cached per chain."],
  ["relayer_getFeeData", "Returns the current relay fee quote for a chain and token. Always $0.01 USDC on Base. Called before every execution."],
  ["relayer_estimateFee", "Simulates the full execution bundle before submission. Returns delegation validity and required payment. Fails fast if the enforcer rejects the calldata."],
  ["send7710Transaction", "Submits the ERC-7710 bundle with full delegation proof. Returns a 1Shot task ID immediately. Confirms on Base within seconds."],
  ["relayer_getStatus", "Resolves the actual Base mainnet transaction hash from the task ID. Called after confirmation to surface the real Basescan link."],
];
const ONE_PROOF = [
  { hash: "0x5b2df6aebfb2d8302c140dc5f3e9322d9b58501a47b7c8fe681c49ca5fb79466", label: "Multi-agent pipeline — research + audit + report" },
  { hash: "0xf64918e42c4f1078311338b2e5b1015daaad2250ce1b1c904a680d64e5942e49", label: "Executor agent — USDC transfer bundled with agent fee" },
  { hash: "0xe9dff0f0b27289d45587bb480f2e64178a67aa4f360feaea7835a85606df8ac7", label: "TEE agents — counsel + intelligence private pipeline" },
];

const VEN_POSSIBLE = [
  ["Model diversity per agent", "Each agent uses the model best suited to its task — not one model for everything. Coordinator plans with 235B, Monitor parses with speed, Audit reasons with Thinking mode."],
  ["Native web search", "Kimi K2.6 with web search returns live data inside the inference response. No separate search API, no rate limits, no stale cached results."],
  ["Hardware-attested privacy", "Venice TEE models run in Intel SGX or equivalent hardware enclaves. Attestation is verifiable. Data is not stored, logged, or used for training — by hardware constraint."],
  ["Uncensored personal models", "Gemma 4 26B TEE Uncensored handles personal content without filters. Combined with TEE privacy, it enables personal reasoning that neither leaks nor restricts."],
  ["Audio output", "Venice TTS generates MP3 summaries from task results. Every completed task includes a playable audio brief reflecting the actual result, not an earlier draft."],
  ["x402 payment protocol", "Venice uses x402 for its own inference billing. Nexario mirrors this — all 10 agents expose x402 HTTP 402 paywalls. External callers pay per inference in USDC via 1Shot."],
];
const VEN_MODELS = [
  ["qwen3-235b-a22b-instruct-2507", "Coordinator · task planning and final synthesis"],
  ["kimi-k2-6", "Research · live web search and on-chain data"],
  ["qwen3-235b-a22b-thinking-2507", "Audit · extended step-by-step reasoning mode"],
  ["kimi-k2-5", "Report · synthesis and TTS handoff"],
  ["e2ee-qwen3-6-35b-a3b", "Counsel · Intelligence · Venice TEE private enclave"],
  ["e2ee-gemma-4-26b-a4b-uncensored-p", "Reflection · TEE + uncensored"],
  ["qwen3-5-9b", "Monitor · fast lightweight condition parsing"],
  ["Venice TTS (af_heart)", "Report · audio summary generation"],
];

function PossibleGrid({ rows }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden" }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ background: "#070707", padding: "26px 26px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)", flexShrink: 0 }}></span>
            <span style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: "-0.01em" }}>{k}</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--muted-70)", lineHeight: 1.6, margin: 0 }}>{v}</p>
        </div>
      ))}
    </div>
  );
}

function DefRows({ rows, monoKey }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "#070707" }}>
      {rows.map(([k, v], i) => (
        <div key={k} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 240px) 1fr", gap: 24, padding: "18px 24px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", alignItems: "baseline" }}>
          <span className={monoKey ? "mono" : ""} style={{ fontSize: monoKey ? 13.5 : 14.5, color: "var(--accent)", fontWeight: monoKey ? 400 : 500, wordBreak: "break-word" }}>{k}</span>
          <span style={{ fontSize: 14, color: "var(--muted-70)", lineHeight: 1.55 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function SpecTable({ rows }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "#070707" }}>
      {rows.map(([k, v], i) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "15px 22px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", alignItems: "baseline" }}>
          <span style={{ fontSize: 13.5, color: "var(--muted-50)" }}>{k}</span>
          <span className="mono" style={{ fontSize: 13.5, color: "var(--muted-90)", textAlign: "right" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function ProtoHead({ idx, name, eyebrow, headline }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, borderTop: "1px solid var(--line-strong)", paddingTop: 40 }}>
        <span className="mono" style={{ fontSize: 15, color: "var(--accent)" }}>{idx}</span>
        <h2 style={{ fontSize: "clamp(30px,3.6vw,46px)", fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>{name}</h2>
      </div>
      <div className="mono" style={{ fontSize: 12.5, color: "var(--muted-50)", letterSpacing: ".1em", marginTop: 16 }}>{eyebrow}</div>
      <h3 className="lower-target" style={{ fontSize: "clamp(26px,2.7vw,40px)", fontWeight: 500, letterSpacing: "-0.025em", margin: "24px 0 0", maxWidth: 860, lineHeight: 1.08 }}>{headline}</h3>
    </div>
  );
}

function SubLabel({ children }) {
  return <div className="mono lower-target" style={{ fontSize: 11.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted-40)", margin: "56px 0 18px" }}>{children}</div>;
}

function TechStackPage({ go, onLaunch }) {
  return (
    <div className="page" style={{ paddingTop: 130 }}>
      <div className="wrap" style={{ paddingTop: 30 }}>
        <span className="eyebrow lower-target">The Infrastructure</span>
        <h1 className="hero-title lower-target" style={{ fontSize: "clamp(40px,5.4vw,84px)", fontWeight: 500, margin: "20px 0 0" }}>Three protocols.<br />One flow.</h1>
        <p style={{ fontSize: 18, color: "var(--muted-70)", maxWidth: 760, lineHeight: 1.6, marginTop: 24 }}>
          Nexario is built on three purpose-built protocols that together make autonomous on-chain AI agents possible for the first time. Each one solves a problem the others can't.
        </p>
      </div>

      {/* ---------------- MetaMask ---------------- */}
      <div className="wrap" style={{ paddingTop: 80 }}>
        <ProtoHead idx="01" name="MetaMask Smart Accounts Kit" eyebrow="ERC-7715 · ERC-7710 · EIP-7702"
          headline="The only signature that matters is the first one." />
        <div style={{ maxWidth: 820, marginTop: 30 }}>
          <p style={{ fontSize: 16, color: "var(--muted-90)", lineHeight: 1.7, margin: "0 0 20px" }}>
            MetaMask Flask implements the ERC-7715 <span className="mono" style={{ color: "var(--accent)" }}>wallet_grantPermissions</span> standard — a new primitive that lets users delegate scoped spending authority to external systems without ever sharing their private key.
          </p>
          <p style={{ fontSize: 16, color: "var(--muted-70)", lineHeight: 1.7, margin: "0 0 20px" }}>
            When you authorize Nexario, MetaMask Flask generates a <span className="mono" style={{ color: "var(--muted-90)" }}>permissionsContext</span>: a 2,882-byte ABI-encoded delegation object containing the full ERC-7710 chain, rooted at MetaMask's EIP-7702 DelegationManager. Every subsequent agent action redeems a sub-delegation from this root, verified cryptographically on-chain before any transaction executes.
          </p>
          <p style={{ fontSize: 16, color: "var(--muted-70)", lineHeight: 1.7, margin: 0 }}>
            If the user revokes, all future relay attempts fail instantly. No backend change. No database update. The chain itself enforces it.
          </p>
        </div>
        <SubLabel>What it makes possible</SubLabel>
        <PossibleGrid rows={MM_POSSIBLE} />
        <SubLabel>Technical depth</SubLabel>
        <SpecTable rows={MM_SPEC} />
      </div>

      {/* ---------------- 1Shot ---------------- */}
      <div className="wrap" style={{ paddingTop: 100 }}>
        <ProtoHead idx="02" name="1Shot API" eyebrow="ERC-7710 Gasless Relay · Base Mainnet"
          headline="USDC in. On-chain action out. No ETH anywhere." />
        <div style={{ maxWidth: 820, marginTop: 30 }}>
          <p style={{ fontSize: 16, color: "var(--muted-90)", lineHeight: 1.7, margin: "0 0 20px" }}>
            1Shot is the relay layer that turns ERC-7710 delegations into confirmed Base mainnet transactions — without the user holding ETH, without the agents holding ETH, without anything holding ETH.
          </p>
          <p style={{ fontSize: 16, color: "var(--muted-70)", lineHeight: 1.7, margin: "0 0 20px" }}>
            The user's ERC-7715 delegation authorizes USDC spending. 1Shot's relayer accepts that authorization, pays the Base gas fees itself, and deducts only USDC from the delegated budget. Every execution is a <span className="mono" style={{ color: "var(--muted-90)" }}>RedeemDelegations</span> call on the MetaMask DelegationManager — verifiable on Basescan.
          </p>
          <p style={{ fontSize: 16, color: "var(--muted-70)", lineHeight: 1.7, margin: 0 }}>
            Each bundle is a multi-execution transaction: the relay fee to 1Shot's feeCollector, the agent fee to the agent's wallet, and any user transfer — one Basescan entry, one gas cost, three economic outcomes. The relay fee is fixed at $0.01 USDC, so a $0.10 research task costs $0.11 total. Predictable, with no ETH price exposure.
          </p>
        </div>
        <SubLabel>What it makes possible</SubLabel>
        <PossibleGrid rows={ONE_POSSIBLE} />
        <SubLabel>Five API methods used</SubLabel>
        <DefRows rows={ONE_METHODS} monoKey />
        <SubLabel>Live proof on Base mainnet</SubLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ONE_PROOF.map((p) => (
            <div key={p.hash} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "18px 22px", background: "#070707", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 12.5, color: "var(--muted-90)", wordBreak: "break-all", lineHeight: 1.5 }}>{p.hash}</div>
                <div style={{ fontSize: 13.5, color: "var(--muted-50)", marginTop: 7 }}>{p.label}</div>
              </div>
              <a className="btn btn-ghost" href={`https://basescan.org/tx/${p.hash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, padding: "8px 16px", flexShrink: 0 }}>Basescan ↗</a>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Venice ---------------- */}
      <div className="wrap" style={{ paddingTop: 100 }}>
        <ProtoHead idx="03" name="Venice AI" eyebrow="Inference · TEE Enclaves · Web Search · TTS · x402"
          headline="Ten agents. Eight model families. One inference layer." />
        <div style={{ maxWidth: 820, marginTop: 30 }}>
          <p style={{ fontSize: 16, color: "var(--muted-90)", lineHeight: 1.7, margin: "0 0 20px" }}>
            Venice AI is the inference backbone of Nexario. Every agent except the Executor runs on Venice — chosen because it combines what no other provider does in one API: high-quality open-weight models, native web search, hardware-attested TEE enclaves, TTS audio, and an x402 payment protocol.
          </p>
          <p style={{ fontSize: 16, color: "var(--muted-70)", lineHeight: 1.7, margin: "0 0 20px" }}>
            Each agent runs a different model selected for its task. The Coordinator uses Qwen3 235B for complex multi-step planning. Research uses Kimi K2.6 with native web search for live token prices and DeFi metrics. Audit uses Qwen3 235B Thinking mode for deeper step-by-step risk analysis. Report uses Kimi K2.5 for synthesis plus Venice TTS for audio summaries on every task.
          </p>
          <p style={{ fontSize: 16, color: "var(--muted-70)", lineHeight: 1.7, margin: 0 }}>
            For sensitive tasks, Venice's hardware-attested TEE models run in isolated enclaves with zero data retention. The coordinator detects content sensitivity automatically and routes to TEE models in the planning phase — legal to Counsel, personal to Reflection, competitive intelligence to Intelligence — before any inference runs.
          </p>
        </div>
        <SubLabel>What it makes possible</SubLabel>
        <PossibleGrid rows={VEN_POSSIBLE} />
        <SubLabel>Eight Venice models in production</SubLabel>
        <DefRows rows={VEN_MODELS} monoKey />
      </div>

      {/* ---------------- CTA ---------------- */}
      <div className="wrap" style={{ padding: "100px 40px 120px" }}>
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 64, textAlign: "center" }}>
          <h2 className="lower-target" style={{ fontSize: "clamp(32px,4vw,60px)", fontWeight: 500, letterSpacing: "-0.03em", margin: 0 }}>Three protocols. One flow.</h2>
          <p style={{ fontSize: 17, color: "var(--muted-70)", marginTop: 18, lineHeight: 1.6 }}>
            MetaMask signs once. 1Shot relays without ETH. Venice infers with privacy.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30 }}>
            <button className="btn btn-ghost" onClick={() => go("Docs")} style={{ padding: "14px 26px", fontSize: 15 }}>Read the Docs</button>
            <button className="btn btn-accent" onClick={onLaunch} style={{ padding: "14px 26px", fontSize: 15 }}>Launch App →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TechStackPage });
