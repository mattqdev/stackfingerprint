"use client";
import { useEffect, useState } from "react";
import { Eyebrow } from "./brand/Brand";
import { SHOWCASE } from "../data/showcase";

const GITHUB_REPO = "https://github.com/mattqdev/stackfingerprint";

// GitHub's own language colours for the most common ones.
const LANG_COLORS = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Shell: "#89e051",
  Lua: "#000080",
};

const fmt = (n) =>
  n == null ? "0" : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

function ago(iso) {
  if (!iso) return null;
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "today";
  if (d < 30) return `${Math.floor(d)}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export default function Showcase({ index }) {
  const [items, setItems] = useState(
    SHOWCASE.map((s) => ({ ...s, params: "", meta: null }))
  );

  useEffect(() => {
    fetch("/api/showcase")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.items?.length && setItems(d.items))
      .catch(() => {});
  }, []);

  return (
    <section className="sf-section" id="showcase">
      <div className="sf-container">
        <div className="sf-section-head">
          <div>
            <Eyebrow index={index}>Used by</Eyebrow>
            <h2 className="sf-display sf-h2">In the wild.</h2>
          </div>
          <p className="sf-lead">
            Real READMEs wearing their fingerprint. Using it too?{" "}
            <a
              className="sf-mint"
              href={`${GITHUB_REPO}/issues/new?template=4_showcase.yml`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get featured →
            </a>
          </p>
        </div>
        <div className="sf-showcase">
          {items.map((it) => (
            <ShowcaseCard key={it.repo} {...it} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({ repo, theme, layout, params, meta }) {
  const q = `repo=${repo}&theme=${theme}&layout=${layout}${params ? `&${params}` : ""}`;
  const name = meta?.fullName ?? repo;
  const [owner, project] = name.split("/");
  const updated = ago(meta?.pushedAt);

  return (
    <article className="sf-tile sf-showcase-item">
      <a
        className="sf-showcase-card"
        href={`/?${q}`}
        aria-label={`Open ${name} in the builder`}
      >
        <img
          src={`/api/card?${q}`}
          alt={`Stack Fingerprint card for ${name}`}
          loading="lazy"
        />
      </a>

      <div className="sf-showcase-body">
        <div className="sf-showcase-title">
          {meta?.owner?.avatar && (
            <img
              className="sf-showcase-avatar"
              src={`${meta.owner.avatar}&s=64`}
              alt=""
              loading="lazy"
            />
          )}
          <a
            href={`https://github.com/${name}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sf-showcase-owner">{owner}/</span>
            {project}
          </a>
        </div>

        {meta?.description && (
          <p className="sf-showcase-desc">{meta.description}</p>
        )}

        {meta?.signals > 0 && (
          <p className="sf-showcase-stack">
            <b>{meta.signals} signals</b>
            {meta.topStack?.length > 0 && ` · ${meta.topStack.join(" · ")}`}
          </p>
        )}

        {meta?.topics?.length > 0 && (
          <div className="sf-showcase-topics">
            {meta.topics.slice(0, 4).map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
        )}

        <div className="sf-showcase-meta">
          {meta?.language && (
            <span>
              <i
                style={{
                  background: LANG_COLORS[meta.language] ?? "var(--text-3)",
                }}
              />
              {meta.language}
            </span>
          )}
          {meta && <span>★ {fmt(meta.stars)}</span>}
          {meta && <span>{fmt(meta.forks)} forks</span>}
          {meta?.license && meta.license !== "NOASSERTION" && (
            <span>{meta.license}</span>
          )}
          {updated && <span>updated {updated}</span>}
        </div>
      </div>

      <div className="sf-showcase-actions">
        <a
          className="sf-btn sf-btn-ghost sf-btn-sm"
          href={`https://github.com/${name}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
        <a className="sf-btn sf-btn-quiet sf-btn-sm" href={`/?${q}`}>
          Open in builder
        </a>
        {/^https?:\/\//.test(meta?.homepage ?? "") && (
          <a
            className="sf-btn sf-btn-quiet sf-btn-sm"
            href={meta.homepage}
            target="_blank"
            rel="noopener noreferrer"
          >
            Site ↗
          </a>
        )}
      </div>
    </article>
  );
}
