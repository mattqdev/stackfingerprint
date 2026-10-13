// Components available inside content/blog/*.mdx without importing them.
import CopyButton from "./CopyButton";
import { getTech, iconUrl } from "../../lib/tech";
import { SITE_URL } from "../../data/site";

const CARD_PARAMS = ["theme", "layout", "size", "categoryFilter", "path"];

export function cardUrl(repo, opts = {}, base = "") {
  const p = new URLSearchParams({ repo });
  for (const k of CARD_PARAMS) if (opts[k]) p.set(k, opts[k]);
  return `${base}/api/card?${p.toString().replace(/%2F/g, "/")}`;
}

/** Live Stack Fingerprint card for a public repo. */
export function StackCard({ repo, caption, ...opts }) {
  return (
    <figure className="sf-mdx-card">
      <a href={`/?repo=${repo}`} title={`Open ${repo} in the builder`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardUrl(repo, opts)}
          alt={`Tech stack card for ${repo}`}
          loading="lazy"
        />
      </a>
      <figcaption>
        {caption ?? (
          <>
            <code>{repo}</code> · generated live from the repo
          </>
        )}
      </figcaption>
    </figure>
  );
}

/** Deep link into the builder with a repo pre-filled. */
export function TryIt({ repo, children }) {
  return (
    <p className="sf-mdx-tryit">
      <a className="sf-btn sf-btn-primary" href={repo ? `/?repo=${repo}` : "/"}>
        {children ?? (repo ? `Scan ${repo} →` : "Scan your repo →")}
      </a>
    </p>
  );
}

export function Callout({ type = "note", title, children }) {
  return (
    <aside className={`sf-mdx-callout is-${type}`}>
      <span className="sf-label">{title ?? type}</span>
      <div>{children}</div>
    </aside>
  );
}

/** Copyable snippet. `code` is the exact text copied. */
export function Snippet({ code, lang = "markdown", label }) {
  return (
    <div className="sf-mdx-snippet">
      <div className="sf-mdx-snippet-head">
        <span className="sf-label">{label ?? lang}</span>
        <CopyButton text={code} />
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Ready-to-paste README embed for a repo. */
export function EmbedSnippet({ repo = "OWNER/REPO", ...opts }) {
  const code = `[![Stack Fingerprint](${cardUrl(repo, opts, SITE_URL)})](${SITE_URL}/?repo=${repo})`;
  return <Snippet code={code} label="README.md" />;
}

/** Pills linking to /tech pages. */
export function TechList({ ids = [] }) {
  const techs = ids.map(getTech).filter(Boolean);
  return <TechPills techs={techs} />;
}

export function TechPills({ techs }) {
  return (
    <ul className="sf-tech-pills">
      {techs.map((t) => (
        <li key={t.id}>
          <a href={`/tech/${t.id}`} style={{ "--pill": t.color }}>
            {iconUrl(t) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconUrl(t)} alt="" width={14} height={14} />
            )}
            {t.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export const mdxComponents = {
  StackCard,
  TryIt,
  Callout,
  Snippet,
  EmbedSnippet,
  TechList,
};
