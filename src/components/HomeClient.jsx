"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { fetchContents, fetchRepoMeta, parseRepoInput } from "../lib/github";
import { detectStack } from "../lib/detect";
import { buildSVG } from "../lib/svgBuilder";
import { DEFAULT_CONFIG, LAYOUTS } from "../data/cardOptions";
import RepoInput from "./RepoInput";
import CardConfigurator from "./CardConfigurator.jsx";
import { StickyCardPreview, CardExport } from "./CardPreview";
import ShieldBadges from "./ShieldBadges";
import { Mark, Highlight, Eyebrow, Viewfinder } from "./brand/Brand";
import { THEMES } from "../data/themes";
import Showcase from "./Showcase";
import SiteNav from "./site/SiteNav";
import SiteFooter from "./site/SiteFooter";
import { GITHUB_REPO } from "../data/site";

// The site opens on the brand card theme; the API default is unchanged.
const SITE_DEFAULT = { ...DEFAULT_CONFIG, theme: "signal" };

// ── URL ↔ Config helpers ───────────────────────────────────────────────────

const TOP_KEYS = [
  "layout",
  "size",
  "theme",
  "iconStyle",
  "pillShape",
  "categoryFilter",
  "accentLine",
  "bgDecoration",
  "showIgnored", // new param
];

function cfgToParams(repo, cfg) {
  const p = new URLSearchParams();
  if (repo) p.set("repo", repo);
  TOP_KEYS.forEach((k) => {
    if (cfg[k] !== SITE_DEFAULT[k]) p.set(k, cfg[k]);
  });
  Object.entries(cfg.dataFields).forEach(([k, v]) => {
    if (v !== SITE_DEFAULT.dataFields[k]) p.set(`df_${k}`, v ? "1" : "0");
  });
  return p;
}

function paramsToState(params) {
  const repo = params.get("repo") ?? "";
  const cfg = {
    ...SITE_DEFAULT,
    dataFields: { ...SITE_DEFAULT.dataFields },
  };
  TOP_KEYS.forEach((k) => {
    if (params.has(k)) cfg[k] = params.get(k);
  });
  Object.keys(DEFAULT_CONFIG.dataFields).forEach((k) => {
    const raw = params.get(`df_${k}`);
    if (raw !== null) cfg.dataFields[k] = raw === "1";
  });
  return { repo, cfg };
}

// ── Components ─────────────────────────────────────────────────────────────

function StarIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// Biometric intro: ridges draw in, a signal line sweeps the print.
function ScanIntro({ onComplete }) {
  const [out, setOut] = useState(false);
  const [step, setStep] = useState(0);
  const steps = ["Scanning", "Reading signals", "Ready"];

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1250);
    const t3 = setTimeout(() => setOut(true), 1650);
    const t4 = setTimeout(onComplete, 2050);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  return (
    <div className={`sf-intro ${out ? "is-out" : ""}`} aria-hidden="true">
      <div className="sf-intro-box">
        <div className="sf-intro-mark">
          <Mark size={120} />
        </div>
        <div className="sf-intro-text">
          {step === 2 ? <b>{steps[step]}</b> : steps[step]}
          {step < 2 && <span className="sf-cursor" />}
        </div>
      </div>
    </div>
  );
}

function Hero({ children }) {
  const stats = [
    ["60+", "signals"],
    [Object.keys(THEMES).length, "themes"],
    [LAYOUTS.length, "layouts"],
    ["0", "auth"],
  ];
  return (
    <header className="sf-hero sf-container">
      <Eyebrow index="01">Stack scanner</Eyebrow>
      <h1 className="sf-display sf-h1 sf-hero-title">
        Visualize your
        <br />
        Repo&apos;s Stack <Highlight>Instantly</Highlight>
      </h1>
      <p className="sf-lead">
        Paste any public GitHub repo. Stack Fingerprint scans its files, detects
        frameworks, runtimes and tooling, and hands you an embeddable SVG card
        for your README.
      </p>
      {children}
      <div className="sf-hero-meta">
        {stats.map(([n, l]) => (
          <span key={l}>
            <b>{n}</b> {l}
          </span>
        ))}
      </div>
    </header>
  );
}

function Pillars() {
  const items = [
    {
      title: "Zero auth",
      body: "Paste a repo, get a badge. No sign-in, no tokens, no friction.",
    },
    {
      title: "Zero config",
      body: "Smart detection out of the box. Sensible defaults everywhere.",
    },
    {
      title: "Full control",
      body: "Themes, layouts, filters, pins and ignores — you decide what to show.",
    },
  ];
  return (
    <section className="sf-section">
      <div className="sf-container">
        <div className="sf-section-head">
          <div>
            <Eyebrow index="02">Why</Eyebrow>
            <h2 className="sf-display sf-h2">
              Paste a repo,
              <br />
              get a badge.
            </h2>
          </div>
          <p className="sf-lead">
            Biometric scanning meets the developer terminal. One scan reads your
            repo&apos;s fingerprint and turns it into a card.
          </p>
        </div>
        <div className="sf-pillars">
          {items.map((it) => (
            <div key={it.title} className="sf-pillar">
              <h3>{it.title}</h3>
              <p className="sf-body">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Fetch",
      cmd: "--api github-contents",
      body: "Reads the public file tree through the GitHub Contents API. No authentication needed.",
    },
    {
      title: "Fingerprint",
      cmd: "--mode lockfile,config,dir",
      body: "Matches package files, lockfiles, configs and folders against 60+ signals.",
    },
    {
      title: "Render",
      cmd: "--renderer svg",
      body: "Compiles a lightweight static SVG with real vector icons for every tech.",
    },
    {
      title: "Embed",
      cmd: "--output markdown,html",
      body: "Copy the snippet into your README, or let the GitHub Action commit the card for you. It stays in sync.",
    },
  ];
  return (
    <section className="sf-section" id="how">
      <div className="sf-container">
        <div className="sf-section-head">
          <div>
            <Eyebrow index="03">How it works</Eyebrow>
            <h2 className="sf-display sf-h2">One scan, one card.</h2>
          </div>
        </div>
        <div className="sf-steps">
          {steps.map((s, i) => (
            <div key={s.title} className="sf-tile sf-step">
              <span className="sf-step-num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="sf-display sf-h3">{s.title}</h3>
              <p className="sf-body">{s.body}</p>
              <code>$ {s.cmd}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StarCTA({ index }) {
  const embedSnippet = `[![Stack Fingerprint](https://stackfingerprint.vercel.app/api/card?repo=mattqdev/stackfingerprint)](${GITHUB_REPO})`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="sf-section">
      <div className="sf-container">
        <div className="sf-tile sf-cta">
          <div>
            <Eyebrow index={index}>Open source</Eyebrow>
            <h2 className="sf-display sf-h2">
              Saved you time?
              <br />
              Leave a star.
            </h2>
            <p className="sf-body" style={{ maxWidth: "52ch" }}>
              Stack Fingerprint is free and open source. A star on GitHub helps
              other developers find it.
            </p>
          </div>
          <div className="sf-cta-actions">
            <a
              className="sf-btn sf-btn-primary"
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
            >
              <StarIcon /> Star on GitHub
            </a>
            <button
              className={`sf-btn sf-btn-ghost ${copied ? "is-done" : ""}`}
              onClick={handleCopy}
            >
              {copied ? "Copied" : "Copy our badge"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultsHeader({ repoInfo, signals }) {
  return (
    <div className="sf-results-head">
      <div style={{ minWidth: 0 }}>
        <Eyebrow index="02">Fingerprint</Eyebrow>
        <a
          className="sf-results-title"
          href={`https://github.com/${repoInfo.owner}/${repoInfo.repo}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="sf-mint">{repoInfo.owner}</span>
          <span className="slash">/</span>
          {repoInfo.repo}
        </a>
      </div>
      <Viewfinder className="sf-count">
        <div style={{ padding: "6px 14px", textAlign: "center" }}>
          <div className="sf-display" style={{ fontSize: 40, lineHeight: 1 }}>
            {signals}
          </div>
          <div className="sf-label" style={{ marginTop: 6 }}>
            Signals
          </div>
        </div>
      </Viewfinder>
    </div>
  );
}

function Panel({ num, title, children }) {
  return (
    <section className="sf-panel">
      <div className="sf-panel-head">
        <span className="sf-label" style={{ color: "var(--white)" }}>
          <span className="num">{num}</span>
          {title}
        </span>
      </div>
      <div className="sf-panel-body">{children}</div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomeClient({ latestPosts = null }) {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [svg, setSvg] = useState("");
  const [stack, setStack] = useState([]);
  const [repoInfo, setRepoInfo] = useState(null);
  const [meta, setMeta] = useState(null);
  const [cfg, setCfg] = useState(SITE_DEFAULT);
  const [booted, setBooted] = useState(false);
  const [showBoot, setShowBoot] = useState(true);

  const isFirstRender = useRef(true);

  // ── 1. On mount: read URL params → restore state & auto-generate ──────
  useEffect(() => {
    const already = sessionStorage.getItem("sf_booted");
    if (already) {
      setShowBoot(false);
      setBooted(true);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
      const { repo, cfg: restoredCfg } = paramsToState(params);
      if (repo) {
        setInput(repo);
        setCfg(restoredCfg);
        setTimeout(() => generateWithArgs(repo, restoredCfg), 50);
      }
    }
  }, []);

  // ── 2. On every cfg / input change: push to URL ───
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = cfgToParams(input, cfg);
    const newSearch = params.toString() ? `?${params.toString()}` : "";
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${newSearch}`
    );
  }, [cfg, input]);

  const handleBootComplete = () => {
    setShowBoot(false);
    setBooted(true);
    sessionStorage.setItem("sf_booted", "1");
  };

  // ── Core generate — FIX: destructure { stack, sfConfig } from detectStack ──
  const generateWithArgs = useCallback(async (rawInput, activeCfg) => {
    const parsed = parseRepoInput(rawInput);
    if (!parsed) {
      setErrorMsg(
        "ERR: invalid input — expected github.com/owner/repo or owner/repo"
      );
      setPhase("error");
      return;
    }
    setPhase("loading");
    setErrorMsg("");
    try {
      // detectStack now returns { stack, sfConfig } — must destructure properly
      const [detectResult, repoMeta] = await Promise.all([
        detectStack(parsed.owner, parsed.repo, fetchContents),
        fetchRepoMeta(parsed.owner, parsed.repo),
      ]);

      // Guard: handle both old array return and new object return gracefully
      const detectedStack = Array.isArray(detectResult)
        ? detectResult
        : (detectResult?.stack ?? []);

      const card = buildSVG(
        parsed.owner,
        parsed.repo,
        detectedStack,
        activeCfg
      );
      setSvg(card);
      setStack(detectedStack);
      setRepoInfo(parsed);
      setMeta(repoMeta);
      setPhase("done");
    } catch (e) {
      const msgs = {
        RATE_LIMIT: "ERR: GitHub rate limit reached — retry in ~60s",
        NOT_FOUND: "ERR: repository not found or is private",
        FORBIDDEN: "ERR: access forbidden — GitHub rate limit or token issue",
        BAD_TOKEN: "ERR: invalid GitHub token",
        API_ERROR: "ERR: GitHub API error — please retry",
      };
      setErrorMsg(msgs[e.message] ?? `ERR: unexpected failure (${e.message})`);
      setPhase("error");
    }
  }, []);

  const generate = useCallback(
    async (overrideInput) => {
      const raw = typeof overrideInput === "string" ? overrideInput : input;
      await generateWithArgs(raw, cfg);
    },
    [input, cfg, generateWithArgs]
  );

  const handleCfgChange = useCallback(
    (newCfg) => {
      setCfg(newCfg);
      if (repoInfo && stack.length > 0)
        setSvg(buildSVG(repoInfo.owner, repoInfo.repo, stack, newCfg));
    },
    [repoInfo, stack]
  );

  const signals = stack.filter((s) => !s.isIgnored).length;

  return (
    <>
      {showBoot && <ScanIntro onComplete={handleBootComplete} />}
      <div className="sf-canvas" aria-hidden="true" />

      <div
        className="sf-shell"
        style={{ opacity: booted ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
        <SiteNav howHref="#how" />

        <main>
          <Hero>
            <RepoInput
              value={input}
              onChange={setInput}
              onSubmit={generate}
              loading={phase === "loading"}
            />
            {phase === "error" && (
              <div className="sf-alert sf-fade-up" role="alert">
                <b>ERROR</b>
                <span>{errorMsg.replace(/^ERR:\s*/, "")}</span>
              </div>
            )}
          </Hero>

          {phase === "done" && repoInfo && (
            <section className="sf-results sf-container sf-fade-up">
              <ResultsHeader repoInfo={repoInfo} signals={signals} />
              <div className="sf-workspace">
                <div className="sf-workspace-side">
                  <Panel num="01" title="Repository">
                    <ShieldBadges meta={meta} />
                  </Panel>
                  <Panel num="02" title="Embed">
                    <CardExport svg={svg} repoInfo={repoInfo} cfg={cfg} />
                  </Panel>
                  <Panel num="03" title="Customize">
                    <CardConfigurator cfg={cfg} onChange={handleCfgChange} />
                  </Panel>
                </div>
                <div className="sf-workspace-preview">
                  <StickyCardPreview svg={svg} repoInfo={repoInfo} cfg={cfg} />
                </div>
              </div>
            </section>
          )}

          {phase !== "loading" && phase !== "done" && (
            <>
              <Pillars />
              <HowItWorks />
              <Showcase index="04" />
              {latestPosts}
            </>
          )}
          <StarCTA index={phase === "done" ? "03" : "06"} />
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
