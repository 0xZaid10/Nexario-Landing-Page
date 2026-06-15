/* agents.jsx */
const { useState: useStateA, useEffect: useEffectA } = React;

const FILTERS = ["All", "Research", "Execution", "Private/TEE", "Analysis", "Monitoring"];

function RepBar({ pct, label, value }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 5, color: "var(--muted-50)" }} className="mono">
        <span>{label}</span><span style={{ color: "var(--muted-90)" }}>{value}</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: "var(--accent)", borderRadius: 999, transition: "width .8s cubic-bezier(.2,.7,.2,1)" }}></div>
      </div>
    </div>
  );
}

function AgentCard({ a, onClick }) {
  const [hov, setHov] = useStateA(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        textAlign: "left", background: hov ? "#0d0d0d" : "#070707", border: "1px solid",
        borderColor: hov ? "var(--line-strong)" : "var(--line)", borderRadius: 18, padding: "26px 24px 22px",
        transition: "all .2s ease", transform: hov ? "translateY(-3px)" : "none", color: "#fff",
        display: "flex", flexDirection: "column", gap: 16, cursor: "pointer",
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", lower: 1 }} className="lower-target">{a.name}</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--muted-40)", marginTop: 3 }}>ERC-8004 #{a.n}</div>
        </div>
        <span className="mono" style={{ fontSize: 12, color: "var(--muted-30)", border: "1px solid var(--line)", borderRadius: 999, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.n}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <Chip>{a.model.replace("Venice · ", "").replace(" (no Venice)", "")}</Chip>
        {a.tee && <Chip tee>TEE 🔒</Chip>}
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--muted-70)", margin: 0, minHeight: 64 }}>{a.desc}</p>

      <div style={{ marginTop: "auto" }}>
        <RepBar pct={a.rep.success} label="success rate" value={a.rep.success + "%"} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <span className="mono" style={{ fontSize: 14, color: "var(--accent)" }}>${a.fee} <span style={{ color: "var(--muted-40)" }}>/ task</span></span>
        <span style={{ fontSize: 13, color: hov ? "#fff" : "var(--muted-50)", transition: "color .2s" }}>View Details →</span>
      </div>
    </button>
  );
}

function AgentModal({ a, onClose }) {
  useEffectA(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, []);

  const tech = [
    ["Venice Model", a.modelId],
    ["TEE", a.tee ? "Yes — hardware-attested" : "No"],
    ["Fee per task", "$" + a.fee + " USDC"],
    ["Payment", "Via 1Shot ERC-7710 relay"],
    ["x402 endpoint", "POST /api/agents/" + a.n + "/call"],
  ];
  const rep = [
    ["Revenue earned", "$" + a.rep.revenue],
    ["Success rate", a.rep.success + "%"],
    ["Avg response", a.rep.resp],
    ["Tasks completed", a.rep.tasks],
    ["Delegation depth", a.rep.depth],
  ];

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 24px", overflowY: "auto",
      animation: "pageIn .25s ease both",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(820px, 100%)", background: "#0a0a0a", border: "1px solid var(--line-strong)",
        borderRadius: 22, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.7)",
      }}>
        {/* header */}
        <div style={{ padding: "30px 36px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em" }} className="lower-target">{a.name} Agent</span>
              <span className="mono" style={{ fontSize: 14, color: "var(--muted-40)" }}>#{a.n}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <Chip>{a.model}</Chip>
              {a.tee && <Chip tee>TEE 🔒</Chip>}
              <Chip>ERC-8004 #{a.n}</Chip>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid var(--line-strong)", color: "var(--muted-70)", borderRadius: 999, width: 38, height: 38, fontSize: 18, flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: "30px 36px 36px" }}>
          <ModalSection title="What it does">
            <p style={{ fontSize: 15.5, lineHeight: 1.7, color: "var(--muted-90)", margin: 0 }}>{a.long}</p>
          </ModalSection>

          <ModalSection title="Capabilities">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
              {a.caps.map((c) => (
                <div key={c} style={{ display: "flex", gap: 10, fontSize: 14.5, color: "var(--muted-70)", alignItems: "baseline" }}>
                  <span style={{ color: "var(--accent)" }}>·</span><span>{c}</span>
                </div>
              ))}
            </div>
            {a.special && <div style={{ marginTop: 16, fontSize: 13.5, color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid var(--accent)", borderRadius: 12, padding: "12px 16px" }}>{a.special}</div>}
          </ModalSection>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
            <ModalSection title="Technical details">
              <KV rows={tech} />
            </ModalSection>
            <ModalSection title="Live reputation">
              <KV rows={rep} accent />
            </ModalSection>
          </div>

          <ModalSection title="x402 paywall">
            <CodeBlock lang="bash" code={`curl -X POST https://api.nexario.xyz/api/agents/${a.n}/call\n→ HTTP 402 · X-Payment-Amount: ${Math.round(parseFloat(a.fee) * 1e6)} · x402+1shot`} />
          </ModalSection>

          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <a className="btn btn-ghost" href={`https://basescan.org/token/0x3a7C05101aC0Bb99e06026855459d376d7906f15?a=${a.n}`} target="_blank" rel="noopener noreferrer">View on Basescan ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}
function ModalSection({ title, children }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div className="mono" style={{ fontSize: 11.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted-40)", marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}
function KV({ rows, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 14.5, alignItems: "baseline", borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
          <span style={{ color: "var(--muted-50)" }}>{k}</span>
          <span className="mono" style={{ color: accent ? "var(--accent)" : "var(--muted-90)", textAlign: "right" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function AgentsPage() {
  const [filter, setFilter] = useStateA("All");
  const [open, setOpen] = useStateA(null);
  const shown = AGENTS.filter((a) => filter === "All" || a.cat === filter);

  return (
    <div className="page" style={{ paddingTop: 130 }}>
      <div className="wrap" style={{ paddingTop: 30, paddingBottom: 40 }}>
        <h1 className="hero-title lower-target" style={{ fontSize: "clamp(40px,5vw,76px)", fontWeight: 500, margin: 0 }}>The Agent Network</h1>
        <p style={{ fontSize: 17, color: "var(--muted-70)", maxWidth: 720, lineHeight: 1.6, marginTop: 22 }}>
          10 specialized AI agents, each registered as an ERC-8004 NFT on Base mainnet. Each has a Venice model, fee schedule, TEE status, and live on-chain reputation. Click any agent to expand full details.
        </p>

        {/* filter bar */}
        <div style={{ display: "flex", gap: 8, marginTop: 36, flexWrap: "wrap" }}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} className="pill" style={{
                padding: "9px 20px", fontSize: 13.5, color: active ? "#000" : "var(--muted-70)",
                background: active ? "#fff" : "rgba(var(--panel),0.9)", borderColor: active ? "#fff" : "var(--line)",
                transition: "color .18s ease, border-color .18s ease",
              }}>{f}</button>
            );
          })}
        </div>

        {/* grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 32 }}>
          {shown.map((a) => <AgentCard key={a.n} a={a} onClick={() => setOpen(a)} />)}
        </div>
      </div>
      {open && <AgentModal a={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

Object.assign(window, { AgentsPage });
