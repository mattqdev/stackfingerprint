"use client";
import { fmtCount, timeAgo } from "../lib/github";

function Cell({ label, value, big = false }) {
  return (
    <div className="sf-meta-cell">
      <span className="sf-label">{label}</span>
      <span className={`v ${big ? "big" : ""}`} title={String(value)}>
        {value}
      </span>
    </div>
  );
}

export default function ShieldBadges({ meta }) {
  if (!meta) return null;
  return (
    <div>
      <div className="sf-meta-grid">
        <Cell label="Stars" value={fmtCount(meta.stars)} big />
        <Cell label="Forks" value={fmtCount(meta.forks)} big />
        {meta.language && <Cell label="Language" value={meta.language} />}
        {meta.license && <Cell label="License" value={meta.license} />}
        {meta.pushedAt && (
          <Cell label="Updated" value={timeAgo(meta.pushedAt)} />
        )}
      </div>
      {meta.topics?.length > 0 && (
        <div className="sf-topics">
          {meta.topics.slice(0, 6).map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
