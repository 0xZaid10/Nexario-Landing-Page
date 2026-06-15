/* docsBlocks.jsx — block renderer for the Nexario docs reader */

/* ---------- inline rich text: `code`  **bold**  [text](url) ---------- */
function richText(str) {
  if (str == null) return null;
  if (typeof str !== "string") return str;
  const out = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(str))) {
    if (m.index > last) out.push(str.slice(last, m.index));
    const tok = m[0];
    if (tok[0] === "`") {
      out.push(<code key={k++} className="ic">{tok.slice(1, -1)}</code>);
    } else if (tok.slice(0, 2) === "**") {
      out.push(<strong key={k++} style={{ color: "var(--muted-90)", fontWeight: 600 }}>{tok.slice(2, -2)}</strong>);
    } else {
      const lm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      out.push(<a key={k++} href={lm[2]} target="_blank" rel="noreferrer" className="dlink">{lm[1]}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < str.length) out.push(str.slice(last));
  return out;
}

/* ---------- one block ---------- */
function DocBlock({ b }) {
  switch (b.type) {
    case "lead":
      return (
        <p style={{ fontSize: 20, color: "var(--muted-70)", lineHeight: 1.62, maxWidth: 880, margin: "0 0 8px" }}>
          {richText(b.text)}
        </p>
      );

    case "h2":
      return (
        <div style={{ marginTop: 60, marginBottom: 6 }}>
          {b.eyebrow && (
            <div className="mono" style={{ fontSize: 12.5, color: "var(--accent)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 14 }}>{b.eyebrow}</div>
          )}
          <h2 className="lower-target tight" style={{ fontSize: 33, fontWeight: 500, margin: 0 }}>{b.text}</h2>
        </div>
      );

    case "h3":
      return <h3 className="lower-target" style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em", margin: "38px 0 2px" }}>{b.text}</h3>;

    case "p":
      return <p style={{ fontSize: 16.5, color: "var(--muted-70)", lineHeight: 1.72, maxWidth: 880, margin: "16px 0 0", textWrap: "pretty" }}>{richText(b.text)}</p>;

    case "list":
      return (
        <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 0", display: "flex", flexDirection: "column", gap: 11, maxWidth: 880 }}>
          {b.items.map((it, i) => (
            <li key={i} style={{ display: "flex", gap: 14, fontSize: 16, color: "var(--muted-70)", lineHeight: 1.6 }}>
              <span style={{ flexShrink: 0, marginTop: 9, width: 6, height: 6, borderRadius: 999, background: "var(--accent)", opacity: 0.85 }}></span>
              <span style={{ textWrap: "pretty" }}>{richText(it)}</span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <div style={{ margin: "22px 0 0", display: "flex", flexDirection: "column", gap: 16, maxWidth: 880 }}>
          {b.items.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span className="mono" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 999, border: "1px solid var(--accent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13.5 }}>{i + 1}</span>
              <div style={{ paddingTop: 3 }}>
                <span style={{ fontSize: 16.5, color: "var(--muted-90)" }}>{richText(typeof it === "string" ? it : it.t)}</span>
                {it.b && <div style={{ fontSize: 15.5, color: "var(--muted-50)", lineHeight: 1.6, marginTop: 4 }}>{richText(it.b)}</div>}
              </div>
            </div>
          ))}
        </div>
      );

    case "code":
      return <div style={{ marginTop: 22 }}><CodeBlock lang={b.lang} code={b.code} /></div>;

    case "table":
      return (
        <div style={{ marginTop: 24, border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14.5, minWidth: Math.max(420, b.head.length * 150) }}>
            <thead>
              <tr>
                {b.head.map((h, i) => (
                  <th key={i} className="mono" style={{ textAlign: "left", padding: "13px 18px", fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted-40)", borderBottom: "1px solid var(--line)", fontWeight: 500, whiteSpace: "nowrap", background: "#070707" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} style={{ padding: "13px 18px", color: ci === 0 ? "var(--muted-90)" : "var(--muted-60, var(--muted-70))", borderBottom: ri === b.rows.length - 1 ? "none" : "1px solid var(--line)", lineHeight: 1.55, verticalAlign: "top", fontWeight: ci === 0 ? 500 : 400 }}>{richText(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "callout": {
      const tone = b.tone || "note";
      const accentMap = {
        note: { c: "var(--muted-70)", bd: "var(--line-strong)", bg: "rgba(255,255,255,0.02)" },
        warn: { c: "oklch(0.82 0.15 70)", bd: "color-mix(in oklch, oklch(0.82 0.15 70) 40%, transparent)", bg: "color-mix(in oklch, oklch(0.82 0.15 70) 8%, transparent)" },
        tee: { c: "var(--accent)", bd: "color-mix(in oklch, var(--accent) 42%, transparent)", bg: "var(--accent-dim)" },
      };
      const s = accentMap[tone] || accentMap.note;
      return (
        <div style={{ marginTop: 24, border: `1px solid ${s.bd}`, background: s.bg, borderRadius: 14, padding: "20px 24px", maxWidth: 880 }}>
          {b.title && (
            <div className="mono" style={{ fontSize: 11.5, letterSpacing: ".12em", textTransform: "uppercase", color: s.c, marginBottom: 9 }}>{b.title}</div>
          )}
          <div style={{ fontSize: 16, color: "var(--muted-70)", lineHeight: 1.62 }}>{richText(b.text)}</div>
        </div>
      );
    }

    case "specs":
      return (
        <div style={{ marginTop: 24, border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", maxWidth: 880 }}>
          {b.items.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 18, padding: "13px 20px", borderBottom: i === b.items.length - 1 ? "none" : "1px solid var(--line)", flexWrap: "wrap" }}>
              <div className="mono" style={{ width: 150, flexShrink: 0, fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted-40)", paddingTop: 2 }}>{row[0]}</div>
              <div className="mono" style={{ fontSize: 14, color: "var(--muted-90)", wordBreak: "break-all", flex: 1, minWidth: 200 }}>{richText(row[1])}</div>
            </div>
          ))}
        </div>
      );

    case "cards":
      return (
        <div className="doc-cards" style={{ marginTop: 26, display: "grid", gridTemplateColumns: `repeat(${b.cols || 2}, 1fr)`, gap: 18 }}>
          {b.items.map((c, i) => (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 16, padding: "26px 28px", background: "#070707" }}>
              {c.tag && <div className="mono" style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 12 }}>{c.tag}</div>}
              <div className="lower-target" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 10 }}>{c.t}</div>
              <p style={{ fontSize: 15.5, color: "var(--muted-70)", lineHeight: 1.6, margin: 0 }}>{richText(c.b)}</p>
            </div>
          ))}
        </div>
      );

    case "agent": {
      const a = (window.AGENTS || []).find((x) => x.n === b.n) || {};
      return (
        <div style={{ marginTop: 30, border: "1px solid var(--line-strong)", borderRadius: 20, padding: "30px 32px", background: "linear-gradient(180deg, #0a0a0a, #050505)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 22, flexWrap: "wrap" }}>
            <div className="mono" style={{ fontSize: 30, fontWeight: 600, color: "var(--accent)", lineHeight: 1 }}>#{a.n}</div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }} className="lower-target">{a.name}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                <Chip>{a.model}</Chip>
                <Chip>${a.fee} / task</Chip>
                {a.tee && <Chip tee>TEE · zero retention</Chip>}
                <Chip>{a.cat}</Chip>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 16.5, color: "var(--muted-70)", lineHeight: 1.65, margin: "22px 0 0", maxWidth: 760 }}>{a.long || a.desc}</p>
        </div>
      );
    }

    case "caps": {
      const a = (window.AGENTS || []).find((x) => x.n === b.n) || {};
      const caps = a.caps || [];
      return (
        <div className="doc-caps" style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {caps.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 18px", background: "#070707" }}>
              <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: 999, background: "var(--accent)" }}></span>
              <span style={{ fontSize: 15, color: "var(--muted-90)" }}>{c}</span>
            </div>
          ))}
        </div>
      );
    }

    case "divider":
      return <div className="divline" style={{ margin: "44px 0 0", maxWidth: 880 }}></div>;

    default:
      return null;
  }
}

function DocBlocks({ blocks }) {
  return (
    <div>
      {blocks.map((b, i) => <DocBlock key={i} b={b} />)}
    </div>
  );
}

Object.assign(window, { richText, DocBlock, DocBlocks });
