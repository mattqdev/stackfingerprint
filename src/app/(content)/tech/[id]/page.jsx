import { notFound } from "next/navigation";
import { getAllTechs, getTech, getRelatedTechs } from "../../../../lib/tech";
import { getPostsByTech } from "../../../../lib/posts.mjs";
import PostCard from "../../../../components/blog/PostCard";
import {
  StackCard,
  Snippet,
  EmbedSnippet,
  TechPills,
} from "../../../../components/blog/MdxComponents";
import JsonLd, { breadcrumbs } from "../../../../components/site/JsonLd";
import { Eyebrow } from "../../../../components/brand/Brand";
import { SITE_URL } from "../../../../data/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTechs().map((t) => ({ id: t.id }));
}

const describe = (t) =>
  `How Stack Fingerprint detects ${t.label} in a GitHub repository, plus a ready-to-paste ${t.label} README badge and an auto-updating tech stack card.`;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const t = getTech(id);
  if (!t) return {};
  return {
    title: `${t.label} badge & stack detection for GitHub READMEs`,
    description: describe(t),
    alternates: { canonical: `${SITE_URL}/tech/${id}` },
    // Pages without hand-written copy stay out of the index until they get it.
    robots: t.indexable ? undefined : { index: false, follow: true },
  };
}

function shieldsBadge(t) {
  const label = t.label.replace(/-/g, "--").replace(/_/g, "__");
  const color = (t.color ?? "#555").replace("#", "");
  const logo = t.iconSlug ? `&logo=${t.iconSlug}&logoColor=white` : "";
  const url = `https://img.shields.io/badge/${encodeURIComponent(label)}-${color}?style=for-the-badge${logo}`;
  return { url, markdown: `![${t.label}](${url})` };
}

export default async function TechPage({ params }) {
  const { id } = await params;
  const t = getTech(id);
  if (!t) notFound();

  const related = getRelatedTechs(t);
  const posts = getPostsByTech(id).slice(0, 3);
  const badge = shieldsBadge(t);
  const url = `${SITE_URL}/tech/${id}`;
  const hasSignals = t.patterns.length || t.exts.length || t.deps.length;

  return (
    <div className="sf-container sf-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              name: `${t.label} detection`,
              url,
              description: describe(t),
            },
            breadcrumbs([
              ["Home", SITE_URL],
              ["Technologies", `${SITE_URL}/tech`],
              [t.label, url],
            ]),
          ],
        }}
      />

      <header className="sf-page-head">
        <Eyebrow index="01">
          <a href="/tech">Technologies</a> /{" "}
          <a href={`/tech#${t.category}`}>{t.categoryLabel}</a>
        </Eyebrow>
        <h1 className="sf-display sf-h1">
          Detect {t.label} in any GitHub repo
        </h1>
        <p className="sf-lead">
          {t.content?.intro ??
            `${t.label} is one of the ${t.categoryLabel.toLowerCase()} technologies Stack Fingerprint recognises automatically when it scans a public repository.`}
        </p>
      </header>

      <div className="sf-tech-layout">
        <div className="sf-prose">
          {t.content?.readme && (
            <>
              <h2>Why show {t.label} on your README</h2>
              <p>{t.content.readme}</p>
            </>
          )}

          <h2>How {t.label} is detected</h2>
          {hasSignals ? (
            <>
              <p>
                Stack Fingerprint reads the repo&apos;s full file tree in one
                GitHub API call and flags {t.label} when it finds any of these:
              </p>
              <ul>
                {t.patterns.length > 0 && (
                  <li>
                    <strong>Files or folders:</strong>{" "}
                    {t.patterns.map((p, i) => (
                      <span key={p}>
                        {i > 0 && ", "}
                        <code>{p}</code>
                      </span>
                    ))}
                  </li>
                )}
                {t.exts.length > 0 && (
                  <li>
                    <strong>File extensions:</strong>{" "}
                    {t.exts.map((e, i) => (
                      <span key={e}>
                        {i > 0 && ", "}
                        <code>{e}</code>
                      </span>
                    ))}
                  </li>
                )}
                {t.deps.map((d) => (
                  <li key={d.source}>
                    <strong>Dependencies in {d.source}:</strong>{" "}
                    {d.names.map((n, i) => (
                      <span key={n}>
                        {i > 0 && ", "}
                        <code>{n}</code>
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>
              {t.label} is detected from the repository&apos;s dependency
              manifests.
            </p>
          )}

          <h2>{t.label} README badge</h2>
          <p>A static badge you can paste anywhere in Markdown:</p>
          <p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badge.url} alt={`${t.label} badge`} height={28} />
          </p>
          <Snippet code={badge.markdown} label="Markdown" />

          <h2>Or let the repo describe itself</h2>
          <p>
            Static badges go stale the moment you swap a dependency. A Stack
            Fingerprint card is generated from the repo, so {t.label} (and
            everything around it) appears or disappears on its own:
          </p>
          {t.content?.example && <StackCard repo={t.content.example} />}
          <EmbedSnippet />
          <p>
            Replace <code>OWNER/REPO</code> with your repository, or{" "}
            <a href="/">open the builder</a> to pick a theme and layout.
          </p>
        </div>

        <aside className="sf-article-aside">
          {related.length > 0 && (
            <div className="sf-toc">
              <span className="sf-label">More {t.categoryLabel}</span>
              <TechPills techs={related} />
            </div>
          )}
        </aside>
      </div>

      {posts.length > 0 && (
        <section className="sf-section">
          <Eyebrow index="02">Related articles</Eyebrow>
          <div className="sf-post-grid">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
