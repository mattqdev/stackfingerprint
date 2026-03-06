'use client';
import { useState } from 'react';

const G = "#33ff33";

export default function CardPreview({ svg, repoInfo, cfg }) {
  if (!svg) return null;

  const embedUrl  = `https://stackfingerprint.dev/api/card?repo=${repoInfo.owner}/${repoInfo.repo}&theme=${cfg.theme}&layout=${cfg.layout}&size=${cfg.size}&icons=${cfg.iconStyle}&pills=${cfg.pillShape}`;
  const embedMd   = `![Stack Fingerprint](${embedUrl})`;
  const embedHtml = `<img src="${embedUrl}" alt="Stack Fingerprint for ${repoInfo.owner}/${repoInfo.repo}" />`;

  const download = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `stack-${repoInfo.repo}-${cfg.layout}.svg` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontFamily: "'JetBrains Mono', monospace" }}>

      {/* Card preview with terminal chrome */}
      <div style={{ border: "1px solid rgba(51,255,51,0.25)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px 14px",
          borderBottom: "1px solid rgba(51,255,51,0.12)",
          background: "rgba(51,255,51,0.02)",
          fontSize: "9px", color: "rgba(51,255,51,0.4)",
        }}>
          <span style={{ color: G }}>◆</span>
          PREVIEW — {repoInfo.owner}/{repoInfo.repo}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: "6px" }}>
            {["rgba(255,80,80,0.5)", "rgba(255,200,0,0.5)", "rgba(51,255,51,0.5)"].map((c, i) => (
              <span key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c, display: "inline-block" }} />
            ))}
          </div>
        </div>
        <div style={{ padding: "20px", background: "rgba(0,0,0,0.2)", overflow: "hidden" }} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <CopyButton text={embedMd}   label="COPY MARKDOWN" icon="MD" />
        <CopyButton text={embedHtml} label="COPY HTML"     icon="<>" />
        <GhostButton onClick={download} label="↓ DOWNLOAD SVG" />
        <CopyButton text={svg} label="⎘" minimal />
      </div>

      {/* Snippets */}
      <EmbedSnippet label="MARKDOWN" filename="embed.md" code={embedMd} />
      <EmbedSnippet label="HTML_IMG" filename="embed.html" code={embedHtml} />
    </div>
  );
}

function CopyButton({ text, label, icon, minimal }) {
  const [copied, setCopied] = useState(false);
  const handle = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const base = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: minimal ? "8px 12px" : "8px 16px",
    fontSize: "10px", fontFamily: "inherit", cursor: "pointer",
    transition: "all 0.15s", letterSpacing: "1px", fontWeight: 700,
  };
  return (
    <button onClick={handle} style={{
      ...base,
      border: copied ? "1px solid rgba(51,255,51,0.5)" : "1px solid rgba(51,255,51,0.22)",
      background: copied ? "rgba(51,255,51,0.08)" : "rgba(51,255,51,0.04)",
      color: copied ? G : "rgba(51,255,51,0.6)",
      textShadow: copied ? "0 0 6px rgba(51,255,51,0.5)" : "none",
    }}>
      {!minimal && <span style={{ color: "rgba(51,255,51,0.4)", fontSize: "9px" }}>{icon}</span>}
      {copied ? "✓ COPIED" : label}
    </button>
  );
}

function GhostButton({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "8px 16px", fontSize: "10px", fontFamily: "inherit",
      cursor: "pointer", transition: "all 0.15s", letterSpacing: "1px",
      border: "1px solid rgba(51,255,51,0.15)",
      background: "transparent", color: "rgba(51,255,51,0.5)",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(51,255,51,0.4)"; e.currentTarget.style.color = G; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(51,255,51,0.15)"; e.currentTarget.style.color = "rgba(51,255,51,0.5)"; }}
    >
      {label}
    </button>
  );
}

function EmbedSnippet({ label, filename, code }) {
  const [copied, setCopied] = useState(false);
  const handle = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ border: "1px solid rgba(51,255,51,0.12)" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "7px 14px",
        borderBottom: "1px solid rgba(51,255,51,0.08)",
        background: "rgba(51,255,51,0.02)",
      }}>
        <span style={{ fontSize: "9px", letterSpacing: "2px", color: "rgba(51,255,51,0.35)", fontFamily: "inherit" }}>
          <span style={{ color: "rgba(51,255,51,0.5)" }}>$</span> cat {filename}
        </span>
        <button onClick={handle} style={{
          fontSize: "9px", padding: "3px 10px",
          border: copied ? "1px solid rgba(51,255,51,0.5)" : "1px solid rgba(51,255,51,0.15)",
          background: "transparent",
          color: copied ? G : "rgba(51,255,51,0.4)",
          fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s",
        }}>
          {copied ? "✓ COPIED" : "COPY"}
        </button>
      </div>
      <pre style={{
        padding: "14px 16px", fontSize: "10px", lineHeight: "1.6",
        color: "rgba(51,255,51,0.6)", background: "rgba(0,0,0,0.25)",
        overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
        margin: 0, fontFamily: "inherit",
      }}>
        {code}
      </pre>
    </div>
  );
}
