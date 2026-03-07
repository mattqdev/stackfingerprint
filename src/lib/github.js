// src/lib/github.js

// ── Auth headers ───────────────────────────────────────────────────────────
// Set GITHUB_TOKEN in your Vercel environment variables to raise the rate
// limit from 60 req/hour (unauthenticated) to 5,000 req/hour (authenticated).
// Get a token at: https://github.com/settings/tokens
// No scopes needed — public repo access is available without any scope.
function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github.v3+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Fetch with retry ───────────────────────────────────────────────────────
// GitHub's API occasionally returns transient 5xx errors. A single retry
// with a short delay recovers the vast majority of these cases.
async function fetchWithRetry(url, options, retries = 1) {
  const res = await fetch(url, options);

  if (res.status === 403) {
    // Check if it's a rate limit vs a plain permission error
    const body = await res.json().catch(() => ({}));
    const isRateLimit =
      res.headers.get("x-ratelimit-remaining") === "0" ||
      body?.message?.toLowerCase().includes("rate limit");
    throw new Error(isRateLimit ? "RATE_LIMIT" : "FORBIDDEN");
  }
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (res.status === 401) throw new Error("BAD_TOKEN");

  // Retry on transient server errors
  if (res.status >= 500 && retries > 0) {
    await new Promise((r) => setTimeout(r, 400));
    return fetchWithRetry(url, options, retries - 1);
  }

  if (!res.ok) throw new Error("API_ERROR");
  return res;
}

// ── Rate limit status ──────────────────────────────────────────────────────
// Returns remaining requests and reset time so callers can surface this in UI.
export async function fetchRateLimit() {
  try {
    const res = await fetch("https://api.github.com/rate_limit", {
      headers: ghHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const core = data.resources?.core;
    return core
      ? {
          limit: core.limit,
          remaining: core.remaining,
          reset: new Date(core.reset * 1000),
          isAuthenticated: core.limit > 60,
        }
      : null;
  } catch {
    return null;
  }
}

// ── Contents API ───────────────────────────────────────────────────────────
export async function fetchContents(owner, repo, path = "") {
  const res = await fetchWithRetry(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: ghHeaders() }
  );
  return res.json();
}

// ── Repo metadata ──────────────────────────────────────────────────────────
export async function fetchRepoMeta(owner, repo) {
  try {
    const res = await fetchWithRetry(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: ghHeaders() }
    );
    const d = await res.json();
    return {
      stars: d.stargazers_count ?? 0,
      forks: d.forks_count ?? 0,
      watchers: d.watchers_count ?? 0,
      openIssues: d.open_issues_count ?? 0,
      language: d.language ?? null,
      description: d.description ?? "",
      license: d.license?.spdx_id ?? null,
      topics: d.topics ?? [],
      pushedAt: d.pushed_at ?? null,
      defaultBranch: d.default_branch ?? "main",
      isForked: d.fork ?? false,
      homepage: d.homepage ?? null,
    };
  } catch {
    return null;
  }
}

// ── Input parser ───────────────────────────────────────────────────────────
export function parseRepoInput(raw) {
  const input = String(raw || "")
    .trim()
    .replace(/\.git$/, "");
  if (!input) return null;

  const m = input.match(/github\.com\/([^/\s?#]+)\/([^/\s?#]+)/);
  if (m) return { owner: m[1], repo: m[2] };

  const p = input.replace(/^\//, "").split("/");
  if (p.length >= 2 && p[0] && p[1]) return { owner: p[0], repo: p[1] };

  return null;
}

// ── Formatting helpers ─────────────────────────────────────────────────────
export function fmtCount(n) {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function timeAgo(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
