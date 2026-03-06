"use client";
import { fmtCount, timeAgo } from "../lib/github";

const G = "#33ff33";

function Badge({ icon, label, value, accent = false }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "stretch", fontSize: "10px", border: "1px solid rgba(51,255,51,0.18)", fontFamily: "'JetBrains Mono', monospace" }}>
      <span style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "4px 10px",
        borderRight: "1px solid rgba(51,255,51,0.1)",
        background: "rgba(51,255,51,0.03)",
        color: "rgba(51,255,51,0.4)",
        letterSpacing: "2px", textTransform: "uppercase",
      }}>
        <span style={{ fontSize: "11px" }}>{icon}</span> {label}
      </span>
      <span style={{
        display: "flex", alignItems: "center",
        padding: "4px 10px",
        background: accent ? "rgba(51,255,51,0.08)" : "rgba(51,255,51,0.03)",
        color: accent ? G : "rgba(51,255,51,0.7)",
        textShadow: accent ? "0 0 6px rgba(51,255,51,0.5)" : "none",
        fontWeight: accent ? 700 : 400,
      }}>
        {value}
      </span>
    </span>
  );
}

export default function ShieldBadges({ meta, owner, repo }) {
  if (!meta) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", fontFamily: "'JetBrains Mono', monospace" }}>
      <a
        href={`https://github.com/${owner}/${repo}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "5px 12px", fontSize: "10px",
          border: "1px solid rgba(51,255,51,0.22)",
          color: "rgba(51,255,51,0.55)", textDecoration: "none",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = G; e.currentTarget.style.borderColor = "rgba(51,255,51,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "rgba(51,255,51,0.55)"; e.currentTarget.style.borderColor = "rgba(51,255,51,0.22)"; }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
        </svg>
        {owner}/{repo}
        <span style={{ color: "rgba(51,255,51,0.3)" }}>↗</span>
      </a>
      <Badge icon="★" label="stars"   value={fmtCount(meta.stars)} accent />
      <Badge icon="⑂" label="forks"   value={fmtCount(meta.forks)} />
      {meta.language && <Badge icon="◈" label="lang"    value={meta.language} />}
      {meta.license  && <Badge icon="©" label="license" value={meta.license} />}
      {meta.pushedAt && <Badge icon="↻" label="updated" value={timeAgo(meta.pushedAt)} />}
      {meta.topics?.slice(0, 2).map(t => <Badge key={t} icon="#" label="topic" value={t} />)}
    </div>
  );
}
