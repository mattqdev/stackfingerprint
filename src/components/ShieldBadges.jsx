"use client";
// src/components/ShieldBadges.jsx
import { fmtCount, timeAgo } from "../lib/github";

function Badge({ icon, label, value, accent = false }) {
  return (
    <span className="inline-flex items-stretch rounded-full overflow-hidden border border-white/8 text-[10px] font-mono select-none shrink-0">
      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] text-white/30">
        <span className="text-[11px] leading-none">{icon}</span>
        <span className="tracking-wide uppercase">{label}</span>
      </span>
      <span
        className={`flex items-center px-2.5 py-1 font-semibold ${accent ? "bg-indigo-500/20 text-indigo-300" : "bg-white/[0.06] text-white/60"}`}
      >
        {value}
      </span>
    </span>
  );
}

export default function ShieldBadges({ meta, owner, repo }) {
  if (!meta) return null;
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* GitHub link */}
      <a
        href={`https://github.com/${owner}/${repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-white/35 hover:text-white/60 hover:border-white/20 transition-colors font-mono tracking-wide"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
        </svg>
        {owner}/{repo}
      </a>

      <Badge icon="⭐" label="stars" value={fmtCount(meta.stars)} accent />
      <Badge icon="🍴" label="forks" value={fmtCount(meta.forks)} />
      {meta.language && <Badge icon="💬" label="lang" value={meta.language} />}
      {meta.license && <Badge icon="📄" label="license" value={meta.license} />}
      {meta.pushedAt && (
        <Badge icon="🕐" label="updated" value={timeAgo(meta.pushedAt)} />
      )}
      {meta.topics?.slice(0, 2).map((t) => (
        <Badge key={t} icon="🏷" label="topic" value={t} />
      ))}
    </div>
  );
}
