/* roadmap.jsx */
const LIVE = [
  "ERC-7715 session authorization via MetaMask Flask",
  "ERC-7710 redelegation chain — coordinator to sub-agents",
  "10 agents registered as ERC-8004 NFTs on Base mainnet",
  "1Shot gasless relay — all 5 API methods integrated",
  "Venice AI — 8 model families, TEE enclaves, TTS, web search",
  "x402 HTTP 402 paywalls on all 10 agent endpoints",
  "On-chain reputation oracle — 5 tags written per task",
  "Real-time Binance WebSocket price monitor",
  "Autonomous scheduled tasks with stored permissionsContext",
  "Persistent sessions — restored from backend on reload",
  "USDC transfers via executor + 1Shot bundle",
  "Budget enforcement — delegation caveat protects overspending",
  "50+ confirmed 1Shot relay transactions on Base mainnet",
];

const NEXT = [
  { soon: true, t: "DEX Swaps via ERC-7715 contract-call permission", built: "0x Permit2 integration, calldata bundling, Binance trigger", blocked: "ERC20PeriodTransferEnforcer rejects non-transfer calldata", fix: "Switch to contract-call permission type scoped to 0x router" },
  { soon: true, t: "MetaMask Agent Wallets", status: "Accepted by MetaMask for early access to Agent Wallets — not yet integrated.", b: "MetaMask Agent Wallets is a new primitive currently in early access. Once tested and understood, Nexario's existing infrastructure (ERC-8004 registry, reputation oracle, x402 paywalls, delegation framework) is designed to plug in directly — but the integration is not built yet. This is the next major technical exploration." },
  { soon: true, t: "Cross-chain execution", b: "1Shot bundles extended to Arbitrum, Optimism, Polygon." },
  { soon: true, t: "Agent-to-Agent delegation", b: "Deeper ERC-7710 chains — agents spawning sub-agents." },
  { soon: false, t: "User-deployed agent logic", b: "Custom system prompts + Venice model selection." },
  { soon: false, t: "Reputation-gated routing", b: "Coordinator auto-selects by live on-chain score." },
  { soon: false, t: "Mobile app", b: "MetaMask SDK + React Native." },
];

function RoadmapPage() {
  return (
    <div className="page" style={{ paddingTop: 130 }}>
      <div className="wrap" style={{ paddingTop: 30 }}>
        <span className="eyebrow lower-target">Roadmap</span>
        <h1 className="hero-title lower-target" style={{ fontSize: "clamp(40px,5.6vw,88px)", fontWeight: 500, margin: "20px 0 0" }}>What's Built. What's Next.</h1>
        <p style={{ fontSize: 17, color: "var(--muted-70)", maxWidth: 660, lineHeight: 1.6, marginTop: 20 }}>
          Here's what works in production today, and where Nexario goes next.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, marginTop: 80, paddingBottom: 110, alignItems: "start" }}>
          {/* whats live */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--accent)", boxShadow: "0 0 12px var(--accent-glow)" }}></span>
              <span className="eyebrow lower-target" style={{ color: "var(--accent)" }}>What's Live</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted-40)" }}>{LIVE.length} shipped</span>
            </div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden", background: "#070707" }}>
              {LIVE.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "15px 22px", borderBottom: i < LIVE.length - 1 ? "1px solid var(--line)" : "none", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--accent)", fontSize: 14, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 14.5, color: "var(--muted-90)", lineHeight: 1.45 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* whats next */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, border: "1px solid var(--muted-40)" }}></span>
              <span className="eyebrow lower-target">What's Next</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {NEXT.map((item, i) => (
                <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 16, padding: "22px 24px", background: "#070707" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span className="mono" style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, border: `1px solid ${item.soon ? "var(--accent)" : "var(--line-strong)"}`, color: item.soon ? "var(--accent)" : "var(--muted-50)" }}>{item.soon ? "NEXT" : "EXPLORING"}</span>
                    <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em" }} className="lower-target">{item.t}</span>
                  </div>
                  {item.status && (
                    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--accent-dim)", border: "1px solid var(--accent)", borderRadius: 10, padding: "10px 13px", margin: "0 0 12px" }}>
                      <span className="mono" style={{ fontSize: 10.5, letterSpacing: ".1em", color: "var(--accent)", marginTop: 2, flexShrink: 0 }}>STATUS</span>
                      <span style={{ fontSize: 13, color: "var(--muted-90)", lineHeight: 1.5 }}>{item.status}</span>
                    </div>
                  )}
                  {item.b && <p style={{ fontSize: 14, color: "var(--muted-70)", lineHeight: 1.55, margin: 0 }}>{item.b}</p>}
                  {item.built && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 6 }}>
                      <RoadKV k="Built" v={item.built} c="var(--accent)" />
                      <RoadKV k="Blocked" v={item.blocked} c="#e5a04d" />
                      <RoadKV k="Fix" v={item.fix} c="var(--muted-70)" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function RoadKV({ k, v, c }) {
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.5 }}>
      <span className="mono" style={{ color: c, minWidth: 56, flexShrink: 0 }}>{k}</span>
      <span style={{ color: "var(--muted-70)" }}>{v}</span>
    </div>
  );
}

Object.assign(window, { RoadmapPage });
