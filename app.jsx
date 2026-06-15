/* app.jsx — router, tweaks, mount */
const { useState: useStateApp, useEffect: useEffectApp } = React;

const FONT_PAIRS = {
  "Readex Pro": { display: "'Readex Pro', system-ui, sans-serif", body: "'Readex Pro', system-ui, sans-serif", mono: "'JetBrains Mono', monospace" },
  "Space Grotesk": { display: "'Space Grotesk', system-ui, sans-serif", body: "'Readex Pro', system-ui, sans-serif", mono: "'IBM Plex Mono', monospace" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "oklch(0.86 0.17 145)",
  "bgMode": "video",
  "headlineCase": "title",
  "fontPair": "Readex Pro",
  "liveStats": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useStateApp(() => {
    const h = decodeURIComponent((location.hash || "").replace("#", ""));
    return NAV_ITEMS.includes(h) ? h : "Home";
  });

  const go = (item) => {
    setRoute(item);
    location.hash = item;
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  useEffectApp(() => {
    const onHash = () => {
      const h = decodeURIComponent((location.hash || "").replace("#", ""));
      setRoute(NAV_ITEMS.includes(h) ? h : "Home");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // apply accent + fonts to :root
  useEffectApp(() => {
    const r = document.documentElement;
    r.style.setProperty("--accent", t.accent);
    const fp = FONT_PAIRS[t.fontPair] || FONT_PAIRS["Readex Pro"];
    r.style.setProperty("--font-display", fp.display);
    r.style.setProperty("--font-body", fp.body);
    r.style.setProperty("--font-mono", fp.mono);
  }, [t.accent, t.fontPair]);

  const onLaunch = () => go("Agents");

  let Page = null;
  if (route === "Home") Page = <HomePage bgMode={t.bgMode} live={t.liveStats} go={go} onLaunch={onLaunch} />;
  else if (route === "Agents") Page = <AgentsPage />;
  else if (route === "Tech Stack") Page = <TechStackPage go={go} onLaunch={onLaunch} />;
  else if (route === "Docs") Page = <DocsPage go={go} />;
  else if (route === "Roadmap") Page = <RoadmapPage />;

  return (
    <div className={t.headlineCase === "lower" ? "case-lower" : ""}>
      <div className="grain"></div>
      <NavBar route={route} go={go} onLaunch={onLaunch} />
      <div key={route}>{Page}</div>
      <Footer go={go} />

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent}
          options={["oklch(0.86 0.17 145)", "oklch(0.86 0.17 215)", "oklch(0.86 0.17 80)", "oklch(0.9 0.03 250)"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSelect label="Font pairing" value={t.fontPair}
          options={Object.keys(FONT_PAIRS)} onChange={(v) => setTweak("fontPair", v)} />
        <TweakRadio label="Headline case" value={t.headlineCase}
          options={["title", "lower"]} onChange={(v) => setTweak("headlineCase", v)} />

        <TweakSection label="Hero background" />
        <TweakRadio label="Treatment" value={t.bgMode}
          options={["video", "canvas", "gradient"]} onChange={(v) => setTweak("bgMode", v)} />

        <TweakSection label="Data" />
        <TweakToggle label="Animate live stats" value={t.liveStats}
          onChange={(v) => setTweak("liveStats", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
