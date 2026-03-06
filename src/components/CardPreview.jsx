"use client";
import { useState } from "react";

const G = "#33ff33";
const FONT = "'JetBrains Mono', monospace";

/* ─── Extracts natural width/height from an SVG string ─────────────────── */
function parseSVGDimensions(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const el = doc.querySelector("svg");
  if (!el) return { w: 540, h: 180 };

  const vb = el.getAttribute("viewBox");
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/);
    if (parts.length === 4) {
      const w = parseFloat(parts[2]);
      const h = parseFloat(parts[3]);
      if (w && h) return { w, h };
    }
  }

  const w = parseFloat(el.getAttribute("width")) || 540;
  const h = parseFloat(el.getAttribute("height")) || 180;
  return { w, h };
}

/* ─── Rewrites the SVG to be 100% wide and auto-height ─────────────────── */
function makeResponsiveSVG(svgString) {
  // Ensure a viewBox exists (copy from width/height if needed), then set
  // width="100%" height="auto" so it fills its container naturally.
  let out = svgString;

  // If no viewBox, try to build one from width/height attributes
  if (!out.includes("viewBox")) {
    const wMatch = out.match(/width="([^"]+)"/);
    const hMatch = out.match(/height="([^"]+)"/);
    const w = wMatch ? wMatch[1] : "540";
    const h = hMatch ? hMatch[1] : "180";
    out = out.replace("<svg ", `<svg viewBox="0 0 ${w} ${h}" `);
  }

  // Replace/inject width and height on the root <svg> tag only
  out = out.replace(/<svg([^>]*)>/, (match, attrs) => {
    const cleaned = attrs
      .replace(/\bwidth="[^"]*"/, "")
      .replace(/\bheight="[^"]*"/, "")
      .trim();
    return `<svg${cleaned ? " " + cleaned : ""} width="100%" height="auto">`;
  });

  return out;
}

/* ─── Sticky left panel: just the card visual ─────────────────────────── */
export function StickyCardPreview({ svg, repoInfo, cfg }) {
  if (!svg) return null;

  const { w: naturalW, h: naturalH } = parseSVGDimensions(svg);
  // paddingBottom trick: makes the box hold exactly the card's aspect ratio
  const aspectPct = (naturalH / naturalW) * 100;
  const responsiveSvg = makeResponsiveSVG(svg);

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

      {/*
        Aspect-ratio container:
        - Outer: position:relative + paddingBottom=(h/w)*100% + some inset padding
          → the box always matches the card's exact proportions, no JS needed
        - Inner: position:absolute inset:12px holds the SVG
        - SVG has width="100%" height="auto" so it fills and respects aspect ratio
      */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: `calc(${aspectPct}% + 24px)`,
          background: "rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{ width: "100%", lineHeight: 0 }}
            dangerouslySetInnerHTML={{ __html: responsiveSvg }}
          />
        </div>
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

  const embedUrl = `https://stackfingerprint.vercel.app/api/card?repo=${repoInfo.owner}/${repoInfo.repo}&theme=${cfg.theme}&layout=${cfg.layout}&size=${cfg.size}&icons=${cfg.iconStyle}&pills=${cfg.pillShape}`;
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
