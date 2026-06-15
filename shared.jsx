/* shared.jsx — Nexario shared data + components (exported to window) */
const { useState, useEffect, useRef } = React;

/* ============================ AGENT DATA ============================ */
const AGENTS = [
  {
    n: 1, name: "Coordinator", cat: "Execution", model: "Venice · Qwen3 235B",
    tee: false, fee: "0.05",
    desc: "The brain of Nexario. Analyzes user requests, plans multi-agent pipelines, delegates sub-tasks, and synthesizes final results. Every task starts and ends here.",
    long: "The Coordinator is the orchestration layer. It decomposes an incoming request into a pipeline of sub-tasks, selects which specialized agents to dispatch, redelegates scoped authority via ERC-7710, enforces the session budget, and synthesizes every agent's output into a single coherent result.",
    caps: ["Task decomposition", "Agent selection", "Sub-delegation via ERC-7710", "Result synthesis", "Budget enforcement"],
    special: "Routes sensitive content to Venice TEE agents automatically",
    modelId: "qwen3-235b", rep: { revenue: "96.40", success: 98, resp: "8s", tasks: 52, depth: 0 },
  },
  {
    n: 2, name: "Research", cat: "Research", model: "Venice · Kimi K2.6 + Web Search",
    tee: false, fee: "0.10",
    desc: "Live data fetcher. Pulls token prices, wallet history, DeFi metrics, and market intelligence using Venice's native web search — no external APIs.",
    long: "The Research agent fetches live on-chain data, token prices, DeFi protocol metrics, wallet history, and market intelligence using Venice's Kimi K2.6 model with native web search enabled. No external APIs needed — Venice handles everything.",
    caps: ["Live token prices (ETH, BTC, SOL, Base tokens)", "On-chain wallet analysis", "DeFi TVL, APY & risk metrics", "Gas price & Base network conditions", "News & market sentiment via live web search"],
    special: null,
    modelId: "kimi-k2-6", rep: { revenue: "312.90", success: 96, resp: "42s", tasks: 31, depth: 2 },
  },
  {
    n: 3, name: "Audit", cat: "Analysis", model: "Venice · Qwen3 235B Thinking",
    tee: false, fee: "0.15",
    desc: "Deep risk analyst. Uses Qwen3's extended thinking mode to reason step-by-step through smart contract risks, transaction exposure, and financial vulnerabilities.",
    long: "The Audit agent uses Qwen3's extended thinking mode to reason step-by-step through smart contract risks, transaction exposure, and financial vulnerabilities before returning a structured risk assessment.",
    caps: ["Smart contract risk scoring", "Transaction analysis", "DeFi exposure assessment", "Counterparty risk", "Slippage analysis"],
    special: null,
    modelId: "qwen3-235b-thinking", rep: { revenue: "210.15", success: 94, resp: "78s", tasks: 14, depth: 2 },
  },
  {
    n: 4, name: "Report", cat: "Analysis", model: "Venice · Kimi K2.5 + TTS",
    tee: false, fee: "0.05",
    desc: "Executive communicator. Synthesizes research and audit outputs into clear reports, then generates audio summaries via Venice TTS for every task.",
    long: "The Report agent synthesizes research and audit outputs into clear executive reports, then generates an audio summary via Venice TTS for every task — actionable findings in plain language, plus an MP3.",
    caps: ["Executive summaries", "Audio reports (MP3)", "Structured findings", "Non-technical language", "Actionable recommendations"],
    special: null,
    modelId: "kimi-k2-5", rep: { revenue: "42.30", success: 95, resp: "38s", tasks: 8, depth: 1 },
  },
  {
    n: 5, name: "Monitor", cat: "Monitoring", model: "Venice · Qwen3 235B",
    tee: false, fee: "0.05",
    desc: "Real-time condition watcher. Connects to Binance WebSocket streams for instant price alerts. Fires full agent pipelines when conditions are met — even when the browser is closed.",
    long: "The Monitor agent connects to Binance WebSocket streams for instant price alerts and fires full agent pipelines when conditions are met — even with the browser closed — using stored permissionsContext for autonomous execution.",
    caps: ["Price alerts (any Binance pair)", "Percentage drop / rise triggers", "Wallet activity monitoring", "Autonomous pipeline execution", "Stored permissionsContext execution"],
    special: "Uses Binance @trade WebSocket — sub-second trigger latency vs polling",
    modelId: "qwen3-235b", rep: { revenue: "18.50", success: 100, resp: "95s", tasks: 3, depth: 1 },
  },
  {
    n: 6, name: "Executor", cat: "Execution", model: "Pure calldata builder (no Venice)",
    tee: false, fee: "0.05",
    desc: "On-chain action agent. Builds and submits USDC transfers as part of 1Shot relay bundles. No AI inference — pure deterministic calldata with budget enforcement.",
    long: "The Executor builds and submits USDC transfers as part of 1Shot relay bundles. No AI inference — pure deterministic calldata construction with on-chain budget enforcement.",
    caps: ["USDC transfers to any address", "Budget cap enforcement", "Calldata construction", "1Shot bundle integration"],
    special: "DEX swaps built but pending ERC-7715 contract-call permission support",
    modelId: "none", rep: { revenue: "48.20", success: 100, resp: "12s", tasks: 9, depth: 1 },
  },
  {
    n: 7, name: "Counsel", cat: "Private/TEE", model: "Venice · Qwen3 6.35B TEE",
    tee: true, fee: "0.20",
    desc: "Private legal advisor. Runs in a Venice hardware-attested secure enclave. Legal analysis, contract review, compliance — zero data retention, hardware-level privacy.",
    long: "The Counsel agent runs in a Venice hardware-attested secure enclave for legal analysis, contract review and compliance questions. Zero data retention, hardware-level privacy, Venice end-to-end encryption.",
    caps: ["Legal analysis", "Contract interpretation", "Regulatory compliance", "DeFi legal risk", "Deal structure review"],
    special: "TEE: Hardware-attested · Zero retention · Venice E2EE",
    modelId: "qwen3-6.35b-tee", rep: { revenue: "64.00", success: 97, resp: "88s", tasks: 12, depth: 2 },
  },
  {
    n: 8, name: "Reputation", cat: "Analysis", model: "Venice · Kimi K2.6",
    tee: false, fee: "0.08",
    desc: "Wallet identity scorer. Analyzes on-chain history, transaction patterns, and behavioral signals to assess wallet reputation and counterparty trust.",
    long: "The Reputation agent analyzes on-chain history, transaction patterns and behavioral signals to assess wallet reputation and counterparty trust — a trust score grounded in verifiable activity.",
    caps: ["Wallet history analysis", "Transaction pattern scoring", "DeFi behavior assessment", "Counterparty risk profiling"],
    special: null,
    modelId: "kimi-k2-6", rep: { revenue: "22.40", success: 99, resp: "30s", tasks: 14, depth: 1 },
  },
  {
    n: 9, name: "Intelligence", cat: "Private/TEE", model: "Venice · Qwen3 6.35B TEE",
    tee: true, fee: "0.15",
    desc: "Private competitive research. Runs in Venice TEE for business intelligence, competitor analysis, and strategic research with full privacy guarantees.",
    long: "The Intelligence agent runs in a Venice TEE for business intelligence, competitor analysis and strategic research with full privacy guarantees — sensitive strategy work that never leaves the enclave.",
    caps: ["Competitive analysis", "Market positioning", "Business intelligence", "Protocol comparison", "Investment thesis research"],
    special: "TEE: Hardware-attested · Zero retention · Venice E2EE",
    modelId: "qwen3-6.35b-tee", rep: { revenue: "51.30", success: 93, resp: "102s", tasks: 9, depth: 2 },
  },
  {
    n: 10, name: "Reflection", cat: "Private/TEE", model: "Venice · Gemma 4 26B TEE Uncensored",
    tee: true, fee: "0.10",
    desc: "Private personal reasoning. Venice's uncensored TEE model for journaling, wellness reasoning, and personal decision-making — no filters, no data retention.",
    long: "The Reflection agent uses Venice's uncensored TEE model for journaling, wellness reasoning and personal decision-making with no filters and no data retention. Private thought processing that stays private.",
    caps: ["Personal journaling", "Wellness reasoning", "Life decisions", "Uncensored personal reflection", "Private thought processing"],
    special: "TEE: Hardware-attested · Uncensored · Zero retention",
    modelId: "gemma-4-26b-tee", rep: { revenue: "19.20", success: 100, resp: "70s", tasks: 6, depth: 1 },
  },
];

const NAV_ITEMS = ["Home", "Agents", "Tech Stack", "Docs", "Roadmap"];

/* ============================ BACKGROUND LAYER ============================ */
function BgLayer({ mode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (mode !== "canvas") return;
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let raf, w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const N = 64;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006, vy: (Math.random() - 0.5) * 0.0006,
    }));
    function resize() {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#7CFFB0";
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = pts[i], b = pts[j];
          const dx = (a.x - b.x) * w, dy = (a.y - b.y) * h;
          const d = Math.hypot(dx, dy);
          if (d < 150) {
            ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 150) * 0.07})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(b.x * w, b.y * h); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 1.4, 0, 7); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    resize(); frame();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [mode]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000" }}>
      {mode === "video" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <video autoPlay loop muted playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            data-bg-video src="assets/hero-bg.mp4">
          </video>
        </div>
      )}
      {mode === "canvas" && (
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}></canvas>
      )}
      {mode === "gradient" && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(90% 70% at 78% 8%, var(--accent-glow), transparent 55%), radial-gradient(70% 60% at 10% 90%, rgba(255,255,255,0.05), transparent 60%), #000",
        }}></div>
      )}
    </div>
  );
}

/* ============================ NAVBAR ============================ */
function NavBar({ route, go, onLaunch }) {
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "20px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        {/* Left: brand only — no logo, per spec */}
        <button className="pill" onClick={() => go("Home")} style={{
          background: "rgba(var(--panel),0.90)", padding: "10px 22px", display: "flex", alignItems: "center", gap: 10,
          color: "#fff", flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600, fontSize: 22, letterSpacing: "-0.03em" }}>Nexario</span>
        </button>

        {/* Center: nav links */}
        <div className="pill nav-center" style={{ display: "flex", alignItems: "center", gap: 2, padding: "5px" }}>
          {NAV_ITEMS.map((item) => {
            const active = route === item;
            return (
              <button key={item} onClick={() => go(item)} style={{
                background: active ? "rgba(255,255,255,0.10)" : "transparent",
                color: active ? "#fff" : "var(--muted-50)",
                border: "none", borderRadius: 999, padding: "8px 13px", fontSize: 13, whiteSpace: "nowrap",
              }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--muted-50)"; }}>
                {item}
              </button>
            );
          })}
        </div>

        {/* Right: launch app */}
        <button className="btn btn-primary" onClick={onLaunch} style={{ padding: "10px 18px", flexShrink: 0 }}>
          Launch App <span style={{ marginLeft: 2 }}>→</span>
        </button>
      </div>
    </nav>
  );
}

/* ============================ FOOTER ============================ */
function Footer({ go }) {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", marginTop: 0, background: "#000" }}>
      <div className="wrap" style={{ padding: "64px 40px 56px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40 }}>
          <div style={{ maxWidth: 380 }}>
            <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em" }}>Nexario</div>
            <div style={{ color: "var(--muted-50)", fontSize: 15, marginTop: 12, lineHeight: 1.6 }}>
              Authority Leasing Infrastructure. Autonomous AI agents that execute on-chain, pay for themselves, and build verifiable reputation.
            </div>
            <div className="mono" style={{ color: "var(--muted-30)", fontSize: 11, marginTop: 22, letterSpacing: ".1em" }}>
              ERC-7715 · ERC-7710 · EIP-7702 · ERC-8004 · x402
            </div>
          </div>
          <FooterCol title="Product" links={["Agents", "Tech Stack", "Roadmap"]} go={go} />
          <FooterCol title="Resources" links={["Docs", "Home"]} go={go} extra={["GitHub ↗"]} />
        </div>
        <div className="divline" style={{ margin: "44px 0 24px" }}></div>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <div className="mono" style={{ fontSize: 11.5, color: "var(--muted-40)", lineHeight: 1.7 }}>
            © 2026 Nexario — Authority Leasing Infrastructure
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <span className="btn btn-ghost" style={{ fontSize: 13, padding: "9px 18px" }}>GitHub</span>
            <button className="btn btn-accent" style={{ fontSize: 13, padding: "9px 18px" }}>Launch App →</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
function FooterCol({ title, links, extra = [], go }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted-40)", marginBottom: 16 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {links.map((l) => (
          <button key={l} onClick={() => go(l)} style={{ background: "none", border: "none", color: "var(--muted-70)", fontSize: 14, textAlign: "left", padding: 0 }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted-70)"}>{l}</button>
        ))}
        {extra.map((l) => (
          <span key={l} style={{ color: "var(--muted-70)", fontSize: 14 }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ============================ PRIMITIVES ============================ */
function SectionLabel({ children, n }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
      {n && <span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>{n}</span>}
      <span className="eyebrow lower-target">{children}</span>
      <span style={{ flex: 1, height: 1, background: "var(--line)" }}></span>
    </div>
  );
}

function Chip({ children, tee, accent }) {
  return (
    <span className="mono" style={{
      fontSize: 11, padding: "4px 10px", borderRadius: 999,
      border: `1px solid ${tee ? "var(--accent)" : "var(--line-strong)"}`,
      color: tee ? "var(--accent)" : "var(--muted-70)",
      background: tee ? "var(--accent-dim)" : "transparent",
      letterSpacing: ".04em", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

/* tiny syntax highlighter for our code blocks */
function CodeBlock({ code, lang }) {
  const html = highlight(code);
  return (
    <div style={{ position: "relative" }}>
      {lang && <div className="mono" style={{ position: "absolute", top: 14, right: 16, fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted-30)" }}>{lang}</div>}
      <pre className="code" dangerouslySetInnerHTML={{ __html: html }}></pre>
    </div>
  );
}
function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function highlight(code) {
  return esc(code)
    .replace(/(\/\/[^\n]*)/g, '<span class="c-com">$1</span>')
    .replace(/(#[^\n]*)/g, '<span class="c-com">$1</span>')
    .replace(/('[^']*')/g, '<span class="c-str">$1</span>')
    .replace(/(&quot;[^&]*&quot;)/g, '<span class="c-str">$1</span>')
    .replace(/\b(const|let|await|async|method|params|return|function|new)\b/g, '<span class="c-key">$1</span>')
    .replace(/\b(0x[a-fA-F0-9]+|\d{2,})\b/g, '<span class="c-num">$1</span>');
}

/* number countup hook */
function useCountUp(target, run, decimals = 0, dur = 1200) {
  const [v, setV] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) { setV(target); return; }
    let raf, start;
    const from = 0;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * e);
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString();
}

/* reveal on mount stagger (inline-style transition so captures stay visible) */
function Reveal({ children, delay = 0, style }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      ...style,
      opacity: shown ? 1 : 0,
      transform: shown ? "none" : "translateY(22px)",
      transition: "opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1)",
    }}>{children}</div>
  );
}

Object.assign(window, {
  AGENTS, NAV_ITEMS, BgLayer, NavBar, Footer, SectionLabel, Chip, CodeBlock, useCountUp, Reveal,
});
