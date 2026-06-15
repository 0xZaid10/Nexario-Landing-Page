/* home.jsx */
const { useState: useStateH, useEffect: useEffectH } = React;

function HeroStats({ live }) {
  const items = [
    { v: "10", l: "Agents Live", dot: true },
    { v: "Base", l: "Mainnet" },
    { v: "1Shot", l: "Mainnet Relayer" },
  ];
  return (
    <div className="pill" style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "10px 12px",
      background: "rgba(var(--panel),0.7)", flexWrap: "wrap",
    }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 22px" }}>
            {it.dot && (live
              ? <span className="livedot" style={{ width: 10, height: 10 }}></span>
              : <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--accent)", boxShadow: "0 0 12px var(--accent-glow)" }}></span>)}
            <span style={{ fontWeight: 600, fontSize: 20 }} className="mono">{it.v}</span>
            <span style={{ color: "var(--muted-50)", fontSize: 16 }}>{it.l}</span>
          </div>
          {i < items.length - 1 && <span style={{ width: 1, height: 26, background: "var(--line)" }}></span>}
        </React.Fragment>
      ))}
      <span style={{ width: 1, height: 26, background: "var(--line)" }}></span>
      <span className="mono" style={{ fontSize: 15, color: "var(--accent)", padding: "5px 22px", letterSpacing: ".04em" }}>
        ERC-7715 + 7702 + 7710 + 8004
      </span>
      <div style={{ flexBasis: "100%", height: 0 }}></div>
      <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 6, paddingTop: 9, borderTop: "1px solid var(--line)" }}>
        <span className="mono" style={{ fontSize: 14, color: "var(--muted-50)", letterSpacing: ".03em" }}>
          EOA → Smart Account · Zero deployment · EIP-7702
        </span>
      </div>
    </div>
  );
}

function Hero({ bgMode, live, go, onLaunch }) {
  return (
    <section style={{ position: "relative", height: "100vh", minHeight: 720, width: "100%", overflow: "hidden" }}>
      <BgLayer mode={bgMode} />
      {/* protection gradient */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.55) 70%, #000 100%)", zIndex: 2, pointerEvents: "none" }}></div>

      <div style={{ position: "relative", zIndex: 5, height: "100%", maxWidth: 1320, margin: "0 auto", padding: "0 40px" }}>
        {/* Staggered headline */}
        <h1 className="hero-title" style={{ position: "absolute", left: 4, top: "19%", margin: 0, fontWeight: 500, fontSize: "clamp(42px, 7vw, 144px)" }}>
          <Reveal delay={120}>One Signature.</Reveal>
        </h1>
        <h1 className="hero-title" style={{ position: "absolute", right: 4, top: "36%", margin: 0, fontWeight: 500, fontSize: "clamp(42px, 7vw, 144px)", textAlign: "right" }}>
          <Reveal delay={260}>Ten Agents.</Reveal>
        </h1>
        <h1 className="hero-title" style={{ position: "absolute", left: "max(40%, 360px)", top: "53%", margin: 0, fontWeight: 500, fontSize: "clamp(42px, 7vw, 144px)", color: "var(--accent)" }}>
          <Reveal delay={400}>Zero ETH.</Reveal>
        </h1>

        {/* sub + CTAs lower left */}
        <Reveal delay={620} style={{ position: "absolute", left: 4, bottom: "max(19%, 240px)", maxWidth: 430 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--muted-90)", margin: 0 }}>
            Autonomous AI agents execute on-chain tasks, pay for inference, transfer funds, and build reputation — all from a single MetaMask Flask permission grant.
          </p>
          <div className="mono" style={{ fontSize: 12.5, color: "var(--muted-50)", marginTop: 14, letterSpacing: ".03em" }}>
            No gas. No popups. Full auditability.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
            <button className="btn btn-accent" onClick={onLaunch} style={{ padding: "14px 26px", fontSize: 15 }}>Launch App →</button>
            <button className="btn btn-ghost" onClick={() => go("Docs")} style={{ padding: "14px 26px", fontSize: 15 }}>Read the Docs</button>
          </div>
        </Reveal>
      </div>

      {/* live stats bar pinned bottom-center */}
      <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", zIndex: 6, maxWidth: "94vw" }}>
        <HeroStats live={live} />
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", t: "Authorize", b: "Sign ERC-7715 in MetaMask Flask. Your existing EOA gets smart account capabilities via EIP-7702 — no new wallet, no migration. Set your USDC budget, duration, agent requirements, and minimum reputation thresholds. One popup. Then nothing.", k: "wallet_grantPermissions" },
  { n: "02", t: "Delegate", b: "Coordinator receives authority, plans the task, and creates scoped ERC-7710 sub-delegations per agent. Each agent gets only what it needs.", k: "ERC-7710 sub-delegations" },
  { n: "03", t: "Execute", b: "Agents run on Venice AI. Each pays its own fee via 1Shot relay in USDC from your delegated budget. Real transactions on Base, confirmed on Basescan.", k: "1Shot relay on Base" },
  { n: "04", t: "Reputation", b: "Oracle writes execution proof on-chain after every task. Agents earn verifiable scores. Future authority depends on past performance.", k: "ReputationRegistry.write()" },
];

function HowItWorks() {
  return (
    <section className="wrap" style={{ padding: "120px 40px 40px" }}>
      <SectionLabel n="①">How It Works</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden" }}>
        {STEPS.map((s) => (
          <div key={s.n} style={{ background: "#050505", padding: "38px 28px 34px" }}>
            <div className="mono" style={{ fontSize: 13, color: "var(--accent)", marginBottom: 26 }}>STEP {s.n}</div>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 14 }} className="lower-target">{s.t}</div>
            <p style={{ color: "var(--muted-70)", fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{s.b}</p>
            <div className="mono" style={{ marginTop: 24, fontSize: 11.5, color: "var(--muted-40)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, background: "var(--accent)", borderRadius: 999, flexShrink: 0 }}></span>{s.k}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const LOOP = [
  { a: "User signs ERC-7715", b: "Bounded budget delegated" },
  { a: "Coordinator redeems", b: "Plans sub-agent pipeline" },
  { a: "Agents execute", b: "1Shot relay on Base" },
  { a: "Oracle writes tags", b: "Reputation updated" },
  { a: "Future authority", b: "Depends on reputation" },
];

function LeasingDiagram({ go }) {
  return (
    <section className="wrap" style={{ padding: "100px 40px 40px" }}>
      <SectionLabel n="③">The Authority Leasing Model</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 60, alignItems: "center" }}>
        <div style={{ border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden", background: "#050505" }}>
          {LOOP.map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", borderBottom: i < LOOP.length - 1 ? "1px solid var(--line)" : "none" }}>
              <div className="mono" style={{ width: 52, textAlign: "center", color: "var(--muted-30)", fontSize: 13, alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--line)" }}>{i + 1}</div>
              <div style={{ padding: "20px 24px", flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}>{row.a}</span>
                <span style={{ color: "var(--muted-50)", fontSize: 14 }} className="mono">→ {row.b}</span>
              </div>
            </div>
          ))}
        </div>
        <div>
          {[["Every execution", "CONSUMES authority."], ["Every execution", "UPDATES reputation."], ["Future authority", "DEPENDS on reputation."]].map((p, i) => (
            <div key={i} style={{ marginBottom: 26 }}>
              <div style={{ color: "var(--muted-50)", fontSize: 15 }}>{p[0]}</div>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em" }}>
                {p[1].split(" ")[0] === "DEPENDS" || p[1].includes("CONSUMES") || p[1].includes("UPDATES") || p[1].includes("DEPENDS")
                  ? <span><span style={{ color: "var(--accent)" }}>{p[1].split(" ")[0]}</span>{" " + p[1].split(" ").slice(1).join(" ")}</span>
                  : p[1]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const POWERED = ["MetaMask Flask", "1Shot API", "Venice AI", "Base", "0x Protocol"];
function PoweredBy() {
  return (
    <section className="wrap" style={{ padding: "100px 40px 40px" }}>
      <SectionLabel n="④">Powered By</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden" }}>
        {POWERED.map((p) => (
          <div key={p} style={{ background: "#050505", padding: "44px 20px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em" }}>
            {p}
          </div>
        ))}
      </div>
      <div className="mono" style={{ marginTop: 22, fontSize: 12.5, color: "var(--muted-40)", textAlign: "center", letterSpacing: ".12em" }}>
        ERC-7715 · ERC-7710 · EIP-7702 · ERC-8004 · x402
      </div>
    </section>
  );
}

const FEED = [
  { hash: "0x5b2df6…79466", task: "research + audit + report", amt: "0.30", ago: "2m ago" },
  { hash: "0xf64918…42e49", task: "executor USDC transfer", amt: "0.17", ago: "8m ago" },
  { hash: "0xe9dff0…8ac7", task: "counsel + intelligence TEE", amt: "0.35", ago: "15m ago" },
  { hash: "0x3a91c2…1d004", task: "monitor → research pipeline", amt: "0.20", ago: "22m ago" },
  { hash: "0x88ee5b…aa730", task: "reputation scoring", amt: "0.08", ago: "31m ago" },
];
function TxFeed({ live }) {
  return (
    <section className="wrap" style={{ padding: "100px 40px 110px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <span className="livedot"></span>
        <span className="eyebrow lower-target">Live Transaction Feed</span>
        <span style={{ flex: 1, height: 1, background: "var(--line)" }}></span>
        <span className="mono" style={{ fontSize: 12, color: "var(--muted-40)" }}>last 5 relays</span>
      </div>
      <div style={{ border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden", background: "#050505" }}>
        {FEED.map((f, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "200px 1fr 90px 110px 40px", alignItems: "center", gap: 16,
            padding: "18px 26px", borderBottom: i < FEED.length - 1 ? "1px solid var(--line)" : "none",
            transition: "background .15s ease",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#0c0c0c"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span className="mono" style={{ fontSize: 13.5, color: "var(--muted-90)" }}>{f.hash}</span>
            <span style={{ fontSize: 14.5, color: "var(--muted-70)" }}>{f.task}</span>
            <span className="mono" style={{ fontSize: 14, color: "var(--accent)" }}>${f.amt}</span>
            <span className="mono" style={{ fontSize: 12.5, color: "var(--muted-40)" }}>{f.ago}</span>
            <span style={{ textAlign: "right", color: "var(--muted-50)" }}>↗</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  { t: "Your EOA. Upgraded.", b: "No new wallet. No seed phrase. No contract deployment. EIP-7702 gives your existing MetaMask address smart account capabilities the moment you sign." },
  { t: "Per-Task Budgets", b: "Each task gets its own USDC allocation. Agents cannot spend more than the sub-delegation cap. ERC-7710 enforces this cryptographically." },
  { t: "Scoped Permissions", b: "You set which agents can run, the minimum reputation required, and the max budget per agent type. On-chain — no backend rule." },
  { t: "Recurring Tasks", b: "Schedule agents to run daily, weekly, or on price conditions via Binance WebSocket. Your permissionsContext runs tasks while you sleep." },
  { t: "TEE Private Inference", b: "Legal, personal, and competitive queries route automatically to Venice hardware-attested enclaves. Zero data retention. No filters." },
  { t: "x402 Agent Paywalls", b: "Every agent exposes an HTTP 402 paywall. Any external caller — AI, script, app — pays per inference in USDC via 1Shot on Base." },
  { t: "On-Chain Reputation", b: "After every task, a Venice oracle writes revenues, success rate, and response time on-chain. Agents below your threshold get blocked." },
];
function FeatureCards() {
  return (
    <section className="wrap" style={{ padding: "100px 40px 40px" }}>
      <SectionLabel n="②">What You Control</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {FEATURES.map((f) => (
          <div key={f.t} style={{ border: "1px solid var(--line)", borderRadius: 18, padding: "30px 28px 32px", background: "#070707", transition: "border-color .2s ease" }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--line-strong)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--line)"}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 14 }} className="lower-target">{f.t}</div>
            <p style={{ fontSize: 14.5, color: "var(--muted-70)", lineHeight: 1.6, margin: 0 }}>{f.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const TRUST = ["MetaMask DelegationManager (EIP-7702)", "1Shot ERC-7710 relay", "Venice AI TEE", "0x Protocol", "Base mainnet"];
function TrustSection() {
  return (
    <section className="wrap" style={{ padding: "40px 40px 100px" }}>
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 48, textAlign: "center" }}>
        <div style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--muted-90)" }} className="lower-target">Built on audited infrastructure.</div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 18px", marginTop: 22 }}>
          {TRUST.map((t, i) => (
            <React.Fragment key={t}>
              <span className="mono" style={{ fontSize: 12.5, color: "var(--muted-50)", letterSpacing: ".03em" }}>{t}</span>
              {i < TRUST.length - 1 && <span style={{ color: "var(--muted-30)" }}>·</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 12, color: "var(--accent)", marginTop: 18, letterSpacing: ".04em" }}>All contracts verified on Basescan.</div>
      </div>
    </section>
  );
}

function HomePage({ bgMode, live, go, onLaunch }) {
  return (
    <div className="page">
      <Hero bgMode={bgMode} live={live} go={go} onLaunch={onLaunch} />
      <HowItWorks />
      <FeatureCards />
      <LeasingDiagram go={go} />
      <PoweredBy />
      <TrustSection />
    </div>
  );
}

Object.assign(window, { HomePage });
