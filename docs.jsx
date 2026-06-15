/* docs.jsx — Nexario docs reader: grouped sidebar, one topic per page, prev/next pagination */
const { useState: useStateD, useEffect: useEffectD, useRef: useRefD } = React;

const DOCS_LS_KEY = "nexario_docs_topic";

function getDocPages() {
  return [
    ...(window.DOC_PAGES_1 || []),
    ...(window.DOC_PAGES_2 || []),
    ...(window.DOC_PAGES_3 || []),
  ];
}

/* build [{ group, items:[page,…] }] preserving order */
function buildDocGroups(pages) {
  const groups = [];
  let cur = null;
  for (const p of pages) {
    if (!cur || cur.group !== p.group) { cur = { group: p.group, items: [] }; groups.push(cur); }
    cur.items.push(p);
  }
  return groups;
}

function DocsPage({ go }) {
  const PAGES = getDocPages();
  const GROUPS = buildDocGroups(PAGES);

  const [activeId, setActiveId] = useStateD(() => {
    const saved = (() => { try { return localStorage.getItem(DOCS_LS_KEY); } catch (e) { return null; } })();
    return saved && PAGES.some((p) => p.id === saved) ? saved : PAGES[0].id;
  });
  const [navOpen, setNavOpen] = useStateD(false);
  const mainRef = useRefD(null);

  const idx = Math.max(0, PAGES.findIndex((p) => p.id === activeId));
  const page = PAGES[idx];
  const prev = idx > 0 ? PAGES[idx - 1] : null;
  const next = idx < PAGES.length - 1 ? PAGES[idx + 1] : null;

  const goTopic = (id) => {
    setActiveId(id);
    try { localStorage.setItem(DOCS_LS_KEY, id); } catch (e) {}
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  return (
    <div className="page docs-shell" style={{ paddingTop: 92 }}>
      {/* mobile topic toggle */}
      <button className="pill docs-mobile-toggle" onClick={() => setNavOpen((v) => !v)} style={{
        display: "none", position: "fixed", left: 16, top: 84, zIndex: 40,
        background: "rgba(var(--panel),0.95)", color: "#fff", padding: "9px 16px", fontSize: 13,
        alignItems: "center", gap: 8,
      }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: ".1em", color: "var(--muted-50)" }}>CONTENTS</span>
        <span>{navOpen ? "✕" : "☰"}</span>
      </button>

      <div className="docs-grid" style={{ display: "grid", gridTemplateColumns: "300px 1fr", width: "100%", margin: 0, alignItems: "start" }}>
        {/* ---------- sidebar ---------- */}
        <aside className={"docs-sidebar" + (navOpen ? " open" : "")} style={{
          borderRight: "1px solid var(--line)", padding: "44px 26px 90px 40px",
          position: "sticky", top: 92, alignSelf: "start", maxHeight: "calc(100vh - 92px)", overflowY: "auto",
        }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--muted-40)", marginBottom: 26 }}>Documentation</div>
          {GROUPS.map((sec) => (
            <div key={sec.group} style={{ marginBottom: 26 }}>
              <div style={{ color: "var(--muted-90)", fontSize: 14.5, fontWeight: 600, marginBottom: 11, letterSpacing: "-0.01em" }}>{sec.group}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, borderLeft: "1px solid var(--line)" }}>
                {sec.items.map((it) => {
                  const on = activeId === it.id;
                  return (
                    <button key={it.id} onClick={() => goTopic(it.id)} style={{
                      textAlign: "left", background: on ? "rgba(255,255,255,0.04)" : "none", border: "none", padding: "7px 16px",
                      marginLeft: -1, borderLeft: on ? "2px solid var(--accent)" : "2px solid transparent",
                      color: on ? "#fff" : "var(--muted-50)", fontSize: 14.5, transition: "color .15s", cursor: "pointer",
                    }}
                      onMouseEnter={(e) => { if (!on) e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { if (!on) e.currentTarget.style.color = "var(--muted-50)"; }}>
                      {it.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* ---------- content ---------- */}
        <main ref={mainRef} className="docs-main" style={{ padding: "52px 96px 96px 76px", minWidth: 0 }}>
          <div key={page.id} className="page">
            {/* breadcrumb + title */}
            <div className="mono" style={{ fontSize: 12.5, color: "var(--muted-40)", letterSpacing: ".08em", marginBottom: 14 }}>
              {page.group}
              <span style={{ color: "var(--accent)", margin: "0 10px" }}>/</span>
              <span style={{ color: "var(--muted-70)" }}>{page.title}</span>
            </div>
            <h1 className="hero-title lower-target" style={{ fontSize: "clamp(40px,4.1vw,64px)", fontWeight: 500, margin: 0 }}>{page.title}</h1>

            <div style={{ marginTop: 30 }}>
              <DocBlocks blocks={page.blocks} />
            </div>

            {/* ---------- prev / next ---------- */}
            <div className="divline" style={{ margin: "72px 0 28px", maxWidth: 880 }}></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 880 }}>
              <PagerButton dir="prev" page={prev} onClick={() => prev && goTopic(prev.id)} />
              <PagerButton dir="next" page={next} onClick={() => next && goTopic(next.id)} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function PagerButton({ dir, page, onClick }) {
  const isNext = dir === "next";
  if (!page) return <div></div>;
  return (
    <button onClick={onClick} style={{
      display: "flex", flexDirection: "column", gap: 8, alignItems: isNext ? "flex-end" : "flex-start",
      textAlign: isNext ? "right" : "left", background: "#070707", border: "1px solid var(--line)",
      borderRadius: 16, padding: "20px 24px", cursor: "pointer", transition: "border-color .18s, background .18s", width: "100%",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.background = "#0b0b0b"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "#070707"; }}>
      <span className="mono" style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted-40)", display: "flex", alignItems: "center", gap: 8 }}>
        {!isNext && <span style={{ color: "var(--accent)" }}>←</span>}
        {isNext ? "Next" : "Previous"}
        {isNext && <span style={{ color: "var(--accent)" }}>→</span>}
      </span>
      <span style={{ fontSize: 18, fontWeight: 600, color: "var(--muted-90)", letterSpacing: "-0.01em" }}>{page.title}</span>
      <span className="mono" style={{ fontSize: 11.5, color: "var(--muted-30)" }}>{page.group}</span>
    </button>
  );
}

Object.assign(window, { DocsPage });
