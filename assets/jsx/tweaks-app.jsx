// Tweaks app for purwarkrishna.dev
// Applies accent / headline-face / grain tweaks as CSS variables on :root.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C9A35B",
  "headline": "Serif",
  "grain": true
}/*EDITMODE-END*/;

// Each accent swatch maps to a full, harmonious oklch token set.
const ACCENTS = {
  "#C9A35B": { accent: "oklch(0.785 0.105 78)",  a2: "oklch(0.70 0.10 70)",  soft: "oklch(0.785 0.105 78 / 0.12)",  ink: "oklch(0.20 0.04 80)" },  // Gold
  "#C56A4A": { accent: "oklch(0.685 0.13 45)",   a2: "oklch(0.62 0.12 40)",  soft: "oklch(0.685 0.13 45 / 0.12)",   ink: "oklch(0.17 0.045 45)" }, // Terracotta
  "#5E9C8B": { accent: "oklch(0.725 0.065 175)", a2: "oklch(0.66 0.06 175)", soft: "oklch(0.725 0.065 175 / 0.12)", ink: "oklch(0.16 0.02 175)" }, // Sage
  "#D8D4CB": { accent: "oklch(0.87 0.012 90)",   a2: "oklch(0.80 0.012 90)", soft: "oklch(0.87 0.012 90 / 0.14)",   ink: "oklch(0.17 0.006 90)" }  // Platinum
};

const FACES = {
  "Serif": '"Newsreader", Georgia, "Times New Roman", serif',
  "Sans":  '"Hanken Grotesk", system-ui, sans-serif'
};

// Derives approximate CSS token set from any arbitrary hex color.
function hexToTokens(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const d = (c) => Math.max(0, Math.round(c * 0.82)).toString(16).padStart(2, '0');
  const t = (c) => Math.max(0, Math.round(c * 0.14)).toString(16).padStart(2, '0');
  return {
    accent: hex,
    a2: `#${d(r)}${d(g)}${d(b)}`,
    soft: hex + '1e',
    ink: `#${t(r)}${t(g)}${t(b)}`,
  };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const root = document.documentElement;
    const a = ACCENTS[t.accent] || hexToTokens(t.accent);
    root.style.setProperty("--accent", a.accent);
    root.style.setProperty("--accent-2", a.a2);
    root.style.setProperty("--accent-soft", a.soft);
    root.style.setProperty("--accent-ink", a.ink);
    root.style.setProperty("--display", FACES[t.headline] || FACES.Serif);
    root.style.setProperty("--grain-opacity", t.grain ? "0.04" : "0");
  }, [t]);

  const customVal = /^#[0-9a-fA-F]{6}$/.test(t.accent) ? t.accent : "#C9A35B";

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Accent" />
      <TweakColor
        label="Preset"
        value={t.accent}
        options={Object.keys(ACCENTS)}
        onChange={(v) => setTweak("accent", v)}
      />
      <TweakColor
        label="Custom"
        value={customVal}
        onChange={(v) => setTweak("accent", v)}
      />
      <TweakSection label="Typography" />
      <TweakRadio
        label="Headline face"
        value={t.headline}
        options={["Serif", "Sans"]}
        onChange={(v) => setTweak("headline", v)}
      />
      <TweakSection label="Texture" />
      <TweakToggle
        label="Film grain"
        value={t.grain}
        onChange={(v) => setTweak("grain", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<App />);
