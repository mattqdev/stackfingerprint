"use client";
import { useState, useRef, useEffect } from "react";

const G = "#33ff33";
const FONT = "'JetBrains Mono', monospace";

/* ─── Sticky left panel: just the card visual ─────────────────────────── */
export function StickyCardPreview({ svg, repoInfo, cfg }) {
  if (!svg) return null;

  // Parse SVG dimensions so we can scale it correctly
  const svgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [svgH, setSvgH] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;
    const el = svgRef.current.querySelector("svg");
    if (!el) return;

    const vb = el.getAttribute("viewBox");
    let naturalW = parseFloat(el.getAttribute("width") || 0);
    let naturalH = parseFloat(el.getAttribute("height") || 0);

    if (vb) {
      const parts = vb.split(/[\s,]+/);
      if (parts.length === 4) {
        naturalW = parseFloat(parts[2]);
        naturalH = parseFloat(parts[3]);
      }
    }

    if (!naturalW) naturalW = 540; // sensible default
    if (!naturalH) naturalH = 180;

    // Available width inside padding (20px each side = 40px total)
    const containerW = svgRef.current.offsetWidth - 32;
    const s = Math.min(1, containerW / naturalW);
    setScale(s);
    setSvgH(naturalH * s);
  }, [svg]);

  return (
    <div style={{ border: "1px solid rgba(51,255,51,0.25)", fontFamily: FONT }}>
      {/* Terminal chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 14px",
          borderBottom: "1px solid rgba(51,255,51,0.12)",
          background: "rgba(51,255,51,0.02)",
          fontSize: "9px",
          color: "rgba(51,255,51,0.4)",
        }}
      >
        <span style={{ color: G }}>◆</span>
        <span>LIVE PREVIEW</span>
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

      {/* Repo label */}
      <div
        style={{
          padding: "6px 14px",
          borderBottom: "1px solid rgba(51,255,51,0.08)",
          fontSize: "9px",
          color: "rgba(51,255,51,0.35)",
          background: "rgba(0,0,0,0.2)",
          letterSpacing: "1px",
        }}
      >
        <span style={{ color: "rgba(51,255,51,0.5)" }}>$</span> {repoInfo.owner}
        /{repoInfo.repo}
      </div>

      {/* SVG card — scale-to-fit without clipping */}
      <div
        style={{
          padding: "16px",
          background: "rgba(0,0,0,0.3)",
          // Height collapses to scaled SVG height + padding
          height: svgH ? `${svgH + 32}px` : "auto",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={svgRef}
          style={{
            transform: `scale(${scale})`,
            // Compensate layout so container knows the real rendered size
            width: scale < 1 ? `${100 / scale}%` : "100%",
            lineHeight: 0,
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* Config summary */}
      <div
        style={{
          padding: "8px 14px",
          borderTop: "1px solid rgba(51,255,51,0.08)",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          background: "rgba(51,255,51,0.01)",
        }}
      >
        {[
          ["THEME", cfg.theme],
          ["LAYOUT", cfg.layout],
          ["SIZE", cfg.size],
        ].map(([k, v]) => (
          <span
            key={k}
            style={{
              fontSize: "8px",
              padding: "2px 7px",
              border: "1px solid rgba(51,255,51,0.12)",
              color: "rgba(51,255,51,0.4)",
              letterSpacing: "1px",
            }}
          >
            <span style={{ color: "rgba(51,255,51,0.3)" }}>{k}:</span>{" "}
            {v.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Right panel: actions + embed snippets ────────────────────────────── */
export function CardExport({ svg, repoInfo, cfg }) {
  if (!svg) return null;

  const embedUrl = `https://stackfingerprint.dev/api/card?repo=${repoInfo.owner}/${repoInfo.repo}&theme=${cfg.theme}&layout=${cfg.layout}&size=${cfg.size}&icons=${cfg.iconStyle}&pills=${cfg.pillShape}`;
  const embedMd = `![Stack Fingerprint](${embedUrl})`;
  const embedHtml = `<img src="${embedUrl}" alt="Stack Fingerprint for ${repoInfo.owner}/${repoInfo.repo}" />`;

  const download = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: `stack-${repoInfo.repo}-${cfg.layout}.svg`,
    }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        fontFamily: FONT,
      }}
    >
      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <CopyButton text={embedMd} label="COPY MARKDOWN" icon="MD" />
        <CopyButton text={embedHtml} label="COPY HTML" icon="<>" />
        <GhostButton onClick={download} label="↓ DOWNLOAD SVG" />
        <CopyButton text={svg} label="⎘" minimal />
      </div>

      <EmbedSnippet filename="embed.md" code={embedMd} />
      <EmbedSnippet filename="embed.html" code={embedHtml} />
    </div>
  );
}

/* ─── Shared sub-components ────────────────────────────────────────────── */
function CopyButton({ text, label, icon, minimal }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: minimal ? "8px 12px" : "8px 16px",
        fontSize: "10px",
        fontFamily: FONT,
        cursor: "pointer",
        transition: "all 0.15s",
        letterSpacing: "1px",
        fontWeight: 700,
        border: copied
          ? "1px solid rgba(51,255,51,0.5)"
          : "1px solid rgba(51,255,51,0.22)",
        background: copied ? "rgba(51,255,51,0.08)" : "rgba(51,255,51,0.04)",
        color: copied ? G : "rgba(51,255,51,0.6)",
        textShadow: copied ? "0 0 6px rgba(51,255,51,0.5)" : "none",
      }}
    >
      {!minimal && (
        <span style={{ color: "rgba(51,255,51,0.4)", fontSize: "9px" }}>
          {icon}
        </span>
      )}
      {copied ? "✓ COPIED" : label}
    </button>
  );
}

function GhostButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        fontSize: "10px",
        fontFamily: FONT,
        cursor: "pointer",
        transition: "all 0.15s",
        letterSpacing: "1px",
        border: "1px solid rgba(51,255,51,0.15)",
        background: "transparent",
        color: "rgba(51,255,51,0.5)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(51,255,51,0.4)";
        e.currentTarget.style.color = G;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(51,255,51,0.15)";
        e.currentTarget.style.color = "rgba(51,255,51,0.5)";
      }}
    >
      {label}
    </button>
  );
}

function EmbedSnippet({ filename, code }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ border: "1px solid rgba(51,255,51,0.12)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 14px",
          borderBottom: "1px solid rgba(51,255,51,0.08)",
          background: "rgba(51,255,51,0.02)",
        }}
      >
        <span
          style={{
            fontSize: "9px",
            letterSpacing: "2px",
            color: "rgba(51,255,51,0.35)",
          }}
        >
          <span style={{ color: "rgba(51,255,51,0.5)" }}>$</span> cat {filename}
        </span>
        <button
          onClick={handle}
          style={{
            fontSize: "9px",
            padding: "3px 10px",
            border: copied
              ? "1px solid rgba(51,255,51,0.5)"
              : "1px solid rgba(51,255,51,0.15)",
            background: "transparent",
            color: copied ? G : "rgba(51,255,51,0.4)",
            fontFamily: FONT,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {copied ? "✓ COPIED" : "COPY"}
        </button>
      </div>
      <pre
        style={{
          padding: "14px 16px",
          fontSize: "10px",
          lineHeight: "1.6",
          color: "rgba(51,255,51,0.6)",
          background: "rgba(0,0,0,0.25)",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          margin: 0,
          fontFamily: FONT,
        }}
      >
        {code}
      </pre>
    </div>
  );
}
