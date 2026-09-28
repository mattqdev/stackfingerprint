"use client";
import { useState } from "react";
import { Viewfinder, Monogram } from "./brand/Brand";

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

/* ─── Live preview: the card, framed by the viewfinder ─────────────────── */
export function StickyCardPreview({ svg, repoInfo, cfg }) {
  if (!svg) return null;

  const { w, h } = parseSVGDimensions(svg);
  const responsiveSvg = makeResponsiveSVG(svg);

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <span className="sf-label" style={{ color: "var(--white)" }}>
          Live preview
        </span>
        <span className="sf-label">
          {Math.round(w)} × {Math.round(h)}
        </span>
      </div>

      <div className="sf-stage">
        <Viewfinder>
          <div
            className="sf-stage-svg"
            aria-label={`Stack card for ${repoInfo.owner}/${repoInfo.repo}`}
            dangerouslySetInnerHTML={{ __html: responsiveSvg }}
          />
        </Viewfinder>
      </div>

      <div className="sf-stage-foot">
        {[
          ["Theme", cfg.theme],
          ["Layout", cfg.layout],
          ["Size", cfg.size],
        ].map(([k, v]) => (
          <span key={k} className="sf-tag">
            <span>{k}</span> {v}
          </span>
        ))}
        <Monogram className="sf-sig" />
      </div>
    </div>
  );
}

/* ─── Export: actions + embed snippets ─────────────────────────────────── */
export function CardExport({ svg, repoInfo, cfg }) {
  if (!svg) return null;

  const embedUrl = `https://stackfingerprint.vercel.app/api/card?repo=${repoInfo.owner}/${repoInfo.repo}&theme=${cfg.theme}&layout=${cfg.layout}&size=${cfg.size}&icons=${cfg.iconStyle}&pills=${cfg.pillShape}`;
  // Clicking the card opens the builder pre-filled with this repo.
  const linkUrl = `https://stackfingerprint.vercel.app/?repo=${repoInfo.owner}/${repoInfo.repo}`;
  const embedMd = `[![Stack Fingerprint](${embedUrl})](${linkUrl})`;
  const embedHtml = `<a href="${linkUrl}"><img src="${embedUrl}" alt="Stack Fingerprint for ${repoInfo.owner}/${repoInfo.repo}" /></a>`;

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
    <div>
      <div className="sf-actions">
        <CopyButton text={embedMd} label="Copy Markdown" primary />
        <CopyButton text={embedHtml} label="Copy HTML" />
        <button className="sf-btn sf-btn-ghost" onClick={download}>
          <DownloadIcon /> SVG
        </button>
        <CopyButton text={svg} label="Raw SVG" quiet />
      </div>
      <EmbedSnippet filename="README.md" code={embedMd} />
      <EmbedSnippet filename="index.html" code={embedHtml} />
    </div>
  );
}

/* ─── Shared sub-components ────────────────────────────────────────────── */
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return [copied, copy];
}

function CopyButton({ text, label, primary, quiet }) {
  const [copied, copy] = useCopy();
  const variant = primary
    ? "sf-btn-primary"
    : quiet
      ? "sf-btn-quiet"
      : "sf-btn-ghost";
  return (
    <button
      onClick={() => copy(text)}
      className={`sf-btn ${variant} ${copied && !primary ? "is-done" : ""}`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

function EmbedSnippet({ filename, code }) {
  const [copied, copy] = useCopy();
  return (
    <div className="sf-code">
      <div className="sf-code-head">
        <span className="sf-label">{filename}</span>
        <button
          onClick={() => copy(code)}
          className={`sf-btn sf-btn-sm ${copied ? "is-done" : "sf-btn-quiet"}`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
}
