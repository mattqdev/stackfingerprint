'use client';
// src/components/CardPreview.jsx

export default function CardPreview({ svg, repoInfo, cfg }) {
  if (!svg) return null;

  const embedUrl  = `https://stackfingerprint.dev/api/card?repo=${repoInfo.owner}/${repoInfo.repo}&theme=${cfg.theme}&layout=${cfg.layout}&size=${cfg.size}&icons=${cfg.iconStyle}&pills=${cfg.pillShape}`;
  const embedMd   = `![Stack Fingerprint](${embedUrl})`;
  const embedHtml = `<img src="${embedUrl}" alt="Stack Fingerprint for ${repoInfo.owner}/${repoInfo.repo}" />`;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
  };

  const download = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), {
      href: url,
      download: `stack-${repoInfo.repo}-${cfg.layout}.svg`,
    }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-up">

      {/* Card preview */}
      <div
        className="rounded-xl overflow-hidden border border-white/6 shadow-2xl shadow-black/60"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {/* Action bar */}
      <div className="flex gap-2 flex-wrap">
        <CopyButton text={embedMd}   label="Copy Markdown" icon="📋" />
        <CopyButton text={embedHtml} label="Copy HTML"     icon="🔗" />
        <button
          onClick={download}
          className="text-[10px] font-mono px-3 py-1.5 rounded-lg border border-white/8 text-white/35 hover:text-white/55 hover:border-white/15 transition-all flex items-center gap-1.5"
        >
          ↓ Download SVG
        </button>
        <CopyButton text={svg} label="Copy SVG" icon="⎘" minimal />
      </div>

      {/* Embed snippet */}
      <EmbedSnippet label="Markdown" code={embedMd} />
      <EmbedSnippet label="HTML img" code={embedHtml} />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CopyButton({ text, label, icon, minimal }) {
  const [copied, setCopied] = useState(false);

  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (minimal) return (
    <button onClick={handle}
      className="text-[10px] font-mono px-3 py-1.5 rounded-lg border border-white/8 text-white/25 hover:text-white/45 hover:border-white/15 transition-all">
      {copied ? '✓' : icon}
    </button>
  );

  return (
    <button onClick={handle}
      className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5
        ${copied ? 'border-green-500/30 bg-green-500/8 text-green-400' : 'border-white/8 text-white/35 hover:text-white/55 hover:border-white/15'}`}>
      <span>{copied ? '✓' : icon}</span>
      {copied ? 'Copied!' : label}
    </button>
  );
}

function EmbedSnippet({ label, code }) {
  const [copied, setCopied] = useState(false);
  const handle = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="rounded-xl border border-white/6 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <span className="text-[9px] font-mono tracking-[2px] text-white/20 uppercase">{label}</span>
        <button onClick={handle}
          className={`text-[10px] font-mono px-2.5 py-0.5 rounded border transition-colors
            ${copied ? 'border-green-500/30 text-green-400' : 'border-white/10 text-white/30 hover:text-white/50 hover:border-white/20'}`}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 text-[10px] font-mono text-indigo-400/70 overflow-x-auto whitespace-pre-wrap break-all m-0 leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

// need useState in sub-components
import { useState } from 'react';
