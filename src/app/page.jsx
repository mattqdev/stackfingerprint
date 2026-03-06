"use client";
import { useState, useCallback, useEffect } from "react";
import { fetchContents, fetchRepoMeta, parseRepoInput } from "../lib/github";
import { detectStack } from "../lib/detect";
import { buildSVG } from "../lib/svgBuilder";
import { DEFAULT_CONFIG } from "../data/cardOptions";
import RepoInput from "../components/RepoInput";
import CardConfigurator from "../components/CardConfigurator.jsx";
import { StickyCardPreview, CardExport } from "../components/CardPreview";
import ShieldBadges from "../components/ShieldBadges";

const S = {
  green: "#33ff33",
  greenFaint: "rgba(51,255,51,0.08)",
  greenDim: "rgba(51,255,51,0.15)",
  greenMid: "rgba(51,255,51,0.3)",
  greenSub: "rgba(51,255,51,0.45)",
  greenText: "rgba(51,255,51,0.6)",
  bg: "#0a0a0a",
  glow: "0 0 8px rgba(51,255,51,0.5)",
};

const GITHUB_REPO = "https://github.com/mattqdev/stackfingerprint";

function Scanlines() {
  return (
    <div
      style={{
        pointerEvents: "none",
        position: "fixed",
        inset: 0,
        zIndex: 50,
        opacity: 0.035,
        background:
          "repeating-linear-gradient(0deg,#000 0px,#000 1px,transparent 1px,transparent 3px)",
      }}
    />
  );
}

function Vignette() {
  return (
    <div
      style={{
        pointerEvents: "none",
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background:
          "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.7) 100%)",
      }}
    />
  );
}

function GridBg() {
  return (
    <div
      style={{
        pointerEvents: "none",
        position: "fixed",
        inset: 0,
        zIndex: 0,
        backgroundImage:
          "linear-gradient(rgba(51,255,51,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(51,255,51,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
  );
}

function BootSequence({ onComplete }) {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);
  const bootLines = [
    { text: "STACKFINGERPRINT — initializing...", delay: 0 },
    { text: "Loading detection modules................... [OK]", delay: 130 },
    { text: "GitHub API interface........................ [OK]", delay: 260 },
    { text: "SVG renderer................................ [OK]", delay: 390 },
    { text: "Made with love by mattqdev.................. [OK]", delay: 520 },
    { text: "", delay: 640 },
    { text: ">> SYSTEM READY", delay: 700, bright: true },
  ];
  useEffect(() => {
    bootLines.forEach((line, i) => {
      setTimeout(() => {
        setLines((prev) => [...prev, line]);
        if (i === bootLines.length - 1) {
          setTimeout(() => {
            setDone(true);
            onComplete();
          }, 400);
        }
      }, line.delay);
    });
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0a0a",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Scanlines />
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          padding: "0 32px",
          fontFamily: "monospace",
          fontSize: "13px",
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              marginBottom: "4px",
              color: line.bright ? S.green : S.greenText,
              textShadow: line.bright ? S.glow : "none",
            }}
          >
            {line.text || "\u00A0"}
          </div>
        ))}
        {!done && (
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "14px",
              background: S.green,
              animation: "blink 1.1s step-end infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

function StatusBar({ position, children }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        [position]: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 24px",
        fontSize: "10px",
        color: "rgba(51,255,51,0.25)",
        background: "rgba(10,10,10,0.96)",
        borderTop:
          position === "bottom" ? "1px solid rgba(51,255,51,0.1)" : "none",
        borderBottom:
          position === "top" ? "1px solid rgba(51,255,51,0.12)" : "none",
        fontFamily: "monospace",
      }}
    >
      {children}
    </div>
  );
}

function StatusClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const u = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    u();
    const id = setInterval(u, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

function TerminalSection({ label, lineNumber, children }) {
  return (
    <div style={{ border: "1px solid rgba(51,255,51,0.18)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 16px",
          borderBottom: "1px solid rgba(51,255,51,0.1)",
          background: "rgba(51,255,51,0.02)",
          fontSize: "10px",
          fontFamily: "monospace",
        }}
      >
        <span style={{ color: "rgba(51,255,51,0.3)" }}>{lineNumber}</span>
        <span style={{ color: S.green, textShadow: S.glow }}>▶ {label}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            "rgba(255,80,80,0.5)",
            "rgba(255,200,0,0.5)",
            "rgba(51,255,51,0.5)",
          ].map((c, i) => (
            <span
              key={i}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: c,
                display: "inline-block",
              }}
            />
          ))}
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

function GitHubCTA() {
  const embedSnippet = `[![Stack Fingerprint](https://stackfingerprint.com/api/card/mattqdev/stackfingerprint)](${GITHUB_REPO})`;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        marginBottom: "40px",
        border: "1px solid rgba(51,255,51,0.2)",
        background: "rgba(51,255,51,0.02)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      {/* Left: prompt text */}
      <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
        <span style={{ color: "rgba(51,255,51,0.4)" }}>$ </span>
        <span style={{ color: "rgba(51,255,51,0.7)" }}>
          if this tool saved you time, a ⭐ goes a long way
        </span>
      </div>

      {/* Right: action buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {/* Star button */}
        <a
          href={GITHUB_REPO}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 14px",
            border: "1px solid rgba(51,255,51,0.45)",
            background: "rgba(51,255,51,0.06)",
            color: S.green,
            fontSize: "11px",
            fontFamily: "monospace",
            textDecoration: "none",
            textShadow: S.glow,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(51,255,51,0.12)";
            e.currentTarget.style.borderColor = S.green;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(51,255,51,0.06)";
            e.currentTarget.style.borderColor = "rgba(51,255,51,0.45)";
          }}
        >
          {/* Star icon */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          STAR ON GITHUB
        </a>

        {/* Embed CTA */}
        <button
          onClick={handleCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 14px",
            border: "1px solid rgba(51,255,51,0.2)",
            background: "transparent",
            color: "rgba(51,255,51,0.55)",
            fontSize: "11px",
            fontFamily: "monospace",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(51,255,51,0.4)";
            e.currentTarget.style.color = "rgba(51,255,51,0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(51,255,51,0.2)";
            e.currentTarget.style.color = "rgba(51,255,51,0.55)";
          }}
        >
          {/* Clipboard icon */}
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? "COPIED!" : "COPY EMBED"}
        </button>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <header style={{ marginBottom: "56px" }}>
      <h1
        style={{
          fontSize: "clamp(28px, 5vw, 48px)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: S.green,
          textShadow: "0 0 20px rgba(51,255,51,0.4)",
          marginBottom: "16px",
          fontFamily: "monospace",
        }}
      >
        MAP YOUR REPO'S
        <br />
        <span
          style={{
            color: "#fff",
            textShadow: "0 0 15px rgba(255,255,255,0.25)",
          }}
        >
          TECH STACK
        </span>
      </h1>

      <p
        style={{
          fontSize: "12px",
          color: "rgba(51,255,51,0.5)",
          maxWidth: "480px",
          marginBottom: "20px",
          lineHeight: "1.7",
          fontFamily: "monospace",
        }}
      >
        <span style={{ color: "rgba(51,255,51,0.8)" }}>&gt;</span> Deep-scan any
        public GitHub repo. Detect frameworks, runtimes, and tooling. Generate a
        professional SVG embed for your README — zero auth required.
      </p>

      {/* Feature pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "40px",
        }}
      >
        {[
          "60+ SIGNALS",
          "REAL ICONS",
          "ZERO AUTH",
          "STATIC SVG",
          "INSTANT",
        ].map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              border: "1px solid rgba(51,255,51,0.15)",
              color: "rgba(51,255,51,0.45)",
              fontSize: "10px",
              fontFamily: "monospace",
            }}
          >
            <span style={{ color: S.green }}>◆</span> {f}
          </div>
        ))}
      </div>

      {/* GitHub CTA */}
      <GitHubCTA />
    </header>
  );
}

function HowItWorks() {
  const steps = [
    {
      cmd: "DEEP_FETCH",
      arg: "--api github-contents",
      body: "Scans public repository file trees via the GitHub Contents API. No authentication needed.",
    },
    {
      cmd: "FINGERPRINT",
      arg: "--mode lockfile,config,dir",
      body: "Analyzes package files, lockfiles, config patterns, and directory structures for 60+ signals.",
    },
    {
      cmd: "BUILD_SVG",
      arg: "--renderer vector",
      body: "Compiles a lightweight SVG with CDN-hosted vector icons from your detected stack.",
    },
    {
      cmd: "DEPLOY",
      arg: "--output markdown,html",
      body: "Copy the embed snippet and pin it directly to your repository README.",
    },
  ];
  return (
    <section
      style={{
        marginTop: "80px",
        paddingTop: "40px",
        borderTop: "1px solid rgba(51,255,51,0.1)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "rgba(51,255,51,0.3)",
          marginBottom: "24px",
          fontFamily: "monospace",
        }}
      >
        <span style={{ color: S.green }}>$</span> ./stackfp --help --verbose
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "8px",
        }}
      >
        {steps.map((step, idx) => (
          <div
            key={idx}
            style={{
              padding: "16px",
              border: "1px solid rgba(51,255,51,0.1)",
              background: "rgba(51,255,51,0.01)",
              transition: "all 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(51,255,51,0.3)";
              e.currentTarget.style.background = "rgba(51,255,51,0.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(51,255,51,0.1)";
              e.currentTarget.style.background = "rgba(51,255,51,0.01)";
            }}
          >
            <div
              style={{
                fontSize: "10px",
                marginBottom: "10px",
                fontFamily: "monospace",
              }}
            >
              <span style={{ color: "rgba(51,255,51,0.3)" }}>
                {String(idx + 1).padStart(2, "0")}
                {"  "}
              </span>
              <span
                style={{
                  color: S.green,
                  textShadow: "0 0 6px rgba(51,255,51,0.4)",
                }}
              >
                {step.cmd}
              </span>
              <span style={{ color: "rgba(51,255,51,0.35)" }}> {step.arg}</span>
            </div>
            <p
              style={{
                fontSize: "11px",
                lineHeight: "1.7",
                color: "rgba(51,255,51,0.4)",
                fontFamily: "monospace",
              }}
            >
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Page() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [svg, setSvg] = useState("");
  const [stack, setStack] = useState([]);
  const [repoInfo, setRepoInfo] = useState(null);
  const [meta, setMeta] = useState(null);
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);
  const [booted, setBooted] = useState(false);
  const [showBoot, setShowBoot] = useState(true);

  useEffect(() => {
    const already = sessionStorage.getItem("sf_booted");
    if (already) {
      setShowBoot(false);
      setBooted(true);
    }
  }, []);

  const handleBootComplete = () => {
    setTimeout(() => {
      setShowBoot(false);
      setBooted(true);
      sessionStorage.setItem("sf_booted", "1");
    }, 300);
  };

  const generate = useCallback(
    async (overrideInput) => {
      const raw = typeof overrideInput === "string" ? overrideInput : input;

      const parsed = parseRepoInput(raw);
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
        const [detected, repoMeta] = await Promise.all([
          detectStack(parsed.owner, parsed.repo, fetchContents),
          fetchRepoMeta(parsed.owner, parsed.repo),
        ]);
        const card = buildSVG(parsed.owner, parsed.repo, detected, cfg);
        setSvg(card);
        setStack(detected);
        setRepoInfo(parsed);
        setMeta(repoMeta);
        setPhase("done");
      } catch (e) {
        const msgs = {
          RATE_LIMIT: "ERR: GitHub rate limit reached — retry in ~60s",
          NOT_FOUND: "ERR: repository not found or is private",
        };
        setErrorMsg(msgs[e.message] ?? "ERR: unexpected failure");
        setPhase("error");
      }
    },
    [input, cfg]
  );

  const handleCfgChange = useCallback(
    (newCfg) => {
      setCfg(newCfg);
      if (repoInfo && stack.length > 0)
        setSvg(buildSVG(repoInfo.owner, repoInfo.repo, stack, newCfg));
    },
    [repoInfo, stack]
  );

  return (
    <>
      {showBoot && <BootSequence onComplete={handleBootComplete} />}
      <Scanlines />
      <Vignette />
      <GridBg />

      <div
        style={{
          minHeight: "100vh",
          position: "relative",
          background: "#0a0a0a",
          opacity: booted ? 1 : 0,
          transition: "opacity 0.4s ease",
          fontFamily: "'JetBrains Mono', monospace",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Top bar */}
        <StatusBar position="top">
          <span>STACKFINGERPRINT</span>
          <a
            style={{
              color: "rgba(51,255,51,0.15)",
              alignContent: "center",
              display: "inline-flex",
              gap: "4px",
            }}
            href={GITHUB_REPO}
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              width="14"
              height="14"
            >
              <title>GitHub</title>
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GITHUB REPO
          </a>
          <StatusClock />
        </StatusBar>

        {/* Main content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "96px 24px 96px",
            width: "100%",
          }}
        >
          <Hero />

          {/* Input */}
          <div style={{ marginBottom: "40px" }}>
            <RepoInput
              value={input}
              onChange={setInput}
              onSubmit={generate}
              loading={phase === "loading"}
            />
          </div>

          {/* Error */}
          {phase === "error" && (
            <div
              style={{
                marginBottom: "32px",
                padding: "12px 16px",
                border: "1px solid rgba(255,80,80,0.4)",
                background: "rgba(255,40,40,0.05)",
                color: "#ff5555",
                fontSize: "13px",
                fontFamily: "monospace",
              }}
            >
              ✗ {errorMsg}
            </div>
          )}

          {/* Results — two-column: sticky card left, scrollable config right */}
          {phase === "done" && repoInfo && (
            <div
              style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
            >
              {/* LEFT — sticky card preview */}
              <div
                style={{
                  position: "sticky",
                  top: "56px",
                  flexShrink: 0,
                  width: "50%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <StickyCardPreview svg={svg} repoInfo={repoInfo} cfg={cfg} />
              </div>

              {/* RIGHT — scrollable sections */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <TerminalSection label="REPO.INFO" lineNumber="01">
                  <ShieldBadges
                    meta={meta}
                    owner={repoInfo.owner}
                    repo={repoInfo.repo}
                  />
                </TerminalSection>
                <TerminalSection label="EMBED.EXPORT" lineNumber="02">
                  <CardExport svg={svg} repoInfo={repoInfo} cfg={cfg} />
                </TerminalSection>
                <TerminalSection label="CONFIG.ENGINE" lineNumber="03">
                  <CardConfigurator cfg={cfg} onChange={handleCfgChange} />
                </TerminalSection>
              </div>
            </div>
          )}

          {phase !== "loading" && phase !== "done" && <HowItWorks />}
        </div>

        {/* Bottom bar */}
        <StatusBar position="bottom">
          <span>MEM: 2.1MB</span>
          <span>SIG: 60+ PATTERNS LOADED</span>
          <span>GITHUB API: ACTIVE</span>
        </StatusBar>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin  { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .sf-spin { animation: spin 1.5s linear infinite; display:inline-block; }
      `}</style>
    </>
  );
}
