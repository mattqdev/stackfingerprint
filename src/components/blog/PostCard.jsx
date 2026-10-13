import { slugifyTag } from "../../lib/posts.mjs";

export const fmtDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export default function PostCard({ post, large = false }) {
  return (
    <article className={`sf-tile sf-post-card ${large ? "is-large" : ""}`}>
      <div className="sf-post-meta sf-label">
        <time dateTime={post.date}>{fmtDate(post.date)}</time>
        <span>·</span>
        <span>{post.readingMinutes} min read</span>
        {post.draft && <span className="sf-post-draft">Draft</span>}
      </div>
      <h3 className={`sf-display ${large ? "sf-h2" : "sf-h3"}`}>
        <a href={`/blog/${post.slug}`} className="sf-post-link">
          {post.title}
        </a>
      </h3>
      <p className="sf-body">{post.description}</p>
      {post.tags.length > 0 && (
        <ul className="sf-post-tags">
          {post.tags.map((t) => (
            <li key={t}>
              <a href={`/blog/tag/${slugifyTag(t)}`}>#{t}</a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
