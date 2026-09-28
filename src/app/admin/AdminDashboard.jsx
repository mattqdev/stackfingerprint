"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Lockup } from "../../components/brand/Brand";
import { THEMES } from "../../data/themes";
import { LAYOUTS } from "../../data/cardOptions";

const SOURCE_INFO = {
  readme: "Rendered on GitHub (README, issues, wikis) via Camo",
  action: "Stack Fingerprint Action / workflow",
  website: "Embedded on a website (referrer known)",
  direct: "Opened directly in a browser",
  script: "curl / scripts (includes older workflows)",
  site: "stackfingerprint.vercel.app itself",
  other: "Unknown client — check the user agent",
  code_search: "Found by GitHub code search",
  manual: "Added by hand",
};

const STATUS_TABS = ["all", "new", "featured", "hidden"];

function ago(iso) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const fmt = (n) =>
  n == null ? "—" : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

function cardSrc(repo, r) {
  const q = new URLSearchParams({
    repo,
    theme: r.featured_theme ?? "scanner",
    layout: r.featured_layout ?? "classic",
  });
  const extra = r.featured_params ? `&${r.featured_params}` : "";
  return `/api/card?${q}${extra}`;
}

async function api(path, body) {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("repos");
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api("/api/admin/data"));
      setError("");
    } catch (e) {
      if (e.message === "Unauthorized") window.location.reload();
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const scan = async () => {
    setScanning(true);
    setNotice("");
    try {
      const r = await api("/api/admin/scan", {});
      setNotice(
        `Scan done — ${r.found} files, ${r.repos} repos (${r.newRepos} new), ${r.refreshed} refreshed.`
      );
      await load();
    } catch (e) {
      setNotice(`Scan failed: ${e.message}`);
    }
    setScanning(false);
  };

  const logout = async () => {
    await api("/api/admin/logout", {});
    window.location.reload();
  };

  const embedsByRepo = useMemo(() => {
    const map = {};
    for (const e of data?.embeds ?? []) {
      (map[e.card_repo] ??= []).push(e);
      if (e.host_repo !== e.card_repo) (map[e.host_repo] ??= []).push(e);
    }
    return map;
  }, [data]);

  const usageByRepo = useMemo(() => {
    const map = {};
    for (const u of data?.usage ?? []) (map[u.repo] ??= []).push(u);
    return map;
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return [];
    const repos = data.repos ?? [];
    return [
      ["Repos", repos.length],
      ["Featured", repos.filter((r) => r.status === "featured").length],
      ["New", repos.filter((r) => r.status === "new").length],
      [
        "Card requests",
        fmt(repos.reduce((a, r) => a + Number(r.total_hits ?? 0), 0)),
      ],
      ["Embeds found", (data.embeds ?? []).length],
    ];
  }, [data]);

  const lastScan = data?.scans?.[0];

  return (
    <>
      <div className="sf-canvas" aria-hidden="true" />
      <div className="sf-shell">
        <nav className="sf-nav">
          <div className="sf-container sf-nav-inner">
            <a href="/" aria-label="Stack Fingerprint — home">
              <Lockup size={30} />
            </a>
            <div className="sf-nav-links">
              <span className="sf-label hide-sm">Admin</span>
              <button
                className="sf-btn sf-btn-ghost sf-btn-sm"
                onClick={logout}
              >
                Log out
              </button>
            </div>
          </div>
        </nav>

        <main className="sf-container sf-admin">
          <header className="sf-admin-head">
            <div>
              <span className="sf-eyebrow">00 / Usage</span>
              <h1 className="sf-display sf-h2">Who uses it.</h1>
              <p className="sf-body sf-admin-sub">
                Every card request is logged automatically; a daily GitHub code
                search finds every public file that references Stack
                Fingerprint.{" "}
                {lastScan &&
                  `Last scan ${ago(lastScan.finished_at ?? lastScan.started_at)}${lastScan.error ? " (failed)" : ""}.`}
              </p>
            </div>
            <div className="sf-admin-head-actions">
              <button
                className="sf-btn sf-btn-primary"
                onClick={scan}
                disabled={scanning || !data?.configured}
              >
                {scanning ? "Scanning GitHub…" : "Scan GitHub now"}
              </button>
              <button className="sf-btn sf-btn-ghost" onClick={load}>
                Reload
              </button>
            </div>
          </header>

          {notice && <div className="sf-admin-notice">{notice}</div>}
          {error && (
            <div className="sf-alert" role="alert">
              <b>ERROR</b>
              <span>{error}</span>
            </div>
          )}
          {data && !data.configured && (
            <div className="sf-alert" role="alert">
              <b>SETUP</b>
              <span>
                Set SUPABASE_URL and SUPABASE_SECRET_KEY, then run
                supabase/schema.sql in the SQL editor.
              </span>
            </div>
          )}

          {data?.configured && (
            <>
              <div className="sf-admin-stats">
                {stats.map(([l, n]) => (
                  <div key={l} className="sf-tile sf-admin-stat">
                    <b className="sf-display">{n}</b>
                    <span className="sf-label">{l}</span>
                  </div>
                ))}
              </div>

              <div className="sf-admin-tabs" role="tablist">
                {[
                  ["repos", `Repos · ${data.repos.length}`],
                  ["usage", `Request log · ${data.usage.length}`],
                  ["embeds", `Embeds · ${data.embeds.length}`],
                  ["scans", "Scans"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={tab === id}
                    className={`sf-admin-tab ${tab === id ? "is-on" : ""}`}
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "repos" && (
                <ReposTab
                  repos={data.repos}
                  embedsByRepo={embedsByRepo}
                  usageByRepo={usageByRepo}
                  onChange={load}
                />
              )}
              {tab === "usage" && <UsageTab usage={data.usage} />}
              {tab === "embeds" && <EmbedsTab embeds={data.embeds} />}
              {tab === "scans" && <ScansTab scans={data.scans} />}
            </>
          )}
          {!data && !error && <p className="sf-body">Loading…</p>}
        </main>
      </div>
    </>
  );
}

// ── Repos ──────────────────────────────────────────────────────────────────
function ReposTab({ repos, embedsByRepo, usageByRepo, onChange }) {
  const [status, setStatus] = useState("new");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("last_seen");
  const [addRepo, setAddRepo] = useState("");
  const [addError, setAddError] = useState("");

  const counts = useMemo(() => {
    const c = { all: repos.length, new: 0, featured: 0, hidden: 0 };
    repos.forEach((r) => c[r.status]++);
    return c;
  }, [repos]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = repos.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (!needle ||
          r.repo.includes(needle) ||
          r.meta?.description?.toLowerCase().includes(needle))
    );
    const key = {
      last_seen: (r) => -new Date(r.last_seen).getTime(),
      first_seen: (r) => -new Date(r.first_seen).getTime(),
      hits: (r) => -Number(r.total_hits),
      stars: (r) => -(r.meta?.stars ?? -1),
      order: (r) => r.featured_order,
    }[sort];
    return rows.sort((a, b) => key(a) - key(b));
  }, [repos, status, q, sort]);

  const add = async (e) => {
    e.preventDefault();
    setAddError("");
    try {
      await api("/api/admin/repo", { repo: addRepo, action: "add" });
      setAddRepo("");
      onChange();
    } catch (err) {
      setAddError(err.message);
    }
  };

  return (
    <section>
      <div className="sf-admin-toolbar">
        <div className="sf-admin-seg">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              className={status === s ? "is-on" : ""}
              onClick={() => setStatus(s)}
            >
              {s} <span>{counts[s]}</span>
            </button>
          ))}
        </div>
        <input
          className="sf-admin-input"
          placeholder="Filter…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="sf-admin-input"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="last_seen">Last seen</option>
          <option value="first_seen">First seen</option>
          <option value="hits">Requests</option>
          <option value="stars">Stars</option>
          <option value="order">Showcase order</option>
        </select>
        <form className="sf-admin-add" onSubmit={add}>
          <input
            className="sf-admin-input"
            placeholder="Add owner/repo"
            value={addRepo}
            onChange={(e) => setAddRepo(e.target.value)}
          />
          <button className="sf-btn sf-btn-ghost sf-btn-sm">Add</button>
        </form>
      </div>
      {addError && <p className="sf-admin-error">{addError}</p>}

      {list.length === 0 && (
        <p className="sf-body sf-admin-empty">Nothing here.</p>
      )}
      <div className="sf-admin-repos">
        {list.map((r) => (
          <RepoRow
            key={r.repo}
            r={r}
            embeds={embedsByRepo[r.repo] ?? []}
            usage={usageByRepo[r.repo] ?? []}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}

function RepoRow({ r, embeds, usage, onChange }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    theme: r.featured_theme ?? "scanner",
    layout: r.featured_layout ?? "classic",
    order: r.featured_order ?? 0,
    params: r.featured_params ?? "",
    notes: r.notes ?? "",
  });
  const m = r.meta;

  const act = async (action, extra = {}) => {
    setBusy(action);
    setErr("");
    try {
      await api("/api/admin/repo", { repo: r.repo, action, ...extra });
      await onChange();
    } catch (e) {
      setErr(e.message);
    }
    setBusy("");
  };

  const preview = cardSrc(r.repo, {
    featured_theme: form.theme,
    featured_layout: form.layout,
    featured_params: form.params,
  });

  return (
    <article className={`sf-tile sf-admin-repo is-${r.status}`}>
      <div className="sf-admin-repo-main">
        {m?.owner?.avatar ? (
          <img className="sf-admin-avatar" src={m.owner.avatar} alt="" />
        ) : (
          <span className="sf-admin-avatar" />
        )}
        <div className="sf-admin-repo-info">
          <div className="sf-admin-repo-title">
            <a
              href={`https://github.com/${r.repo}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {r.repo}
            </a>
            <span className={`sf-admin-status is-${r.status}`}>{r.status}</span>
            {m?.missing && <span className="sf-admin-status">deleted</span>}
            {m?.archived && <span className="sf-admin-status">archived</span>}
          </div>
          {m?.description && <p className="sf-admin-desc">{m.description}</p>}
          <div className="sf-admin-facts">
            {m?.stars != null && <span>★ {fmt(m.stars)}</span>}
            {m?.language && <span>{m.language}</span>}
            <span>{fmt(Number(r.total_hits))} requests</span>
            <span>{embeds.length} embeds</span>
            <span>first {ago(r.first_seen)}</span>
            <span>last {ago(r.last_seen)}</span>
          </div>
          <div className="sf-admin-sources">
            {r.sources.map((s) => (
              <span key={s} className="sf-admin-chip" title={SOURCE_INFO[s]}>
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="sf-admin-repo-actions">
          {r.status !== "featured" && (
            <button
              className="sf-btn sf-btn-primary sf-btn-sm"
              disabled={!!busy}
              onClick={() => act("feature", form)}
            >
              {busy === "feature" ? "…" : "Feature"}
            </button>
          )}
          {r.status !== "hidden" && (
            <button
              className="sf-btn sf-btn-ghost sf-btn-sm"
              disabled={!!busy}
              onClick={() => act("hide")}
            >
              Hide
            </button>
          )}
          {r.status !== "new" && (
            <button
              className="sf-btn sf-btn-quiet sf-btn-sm"
              disabled={!!busy}
              onClick={() => act("reset")}
            >
              {r.status === "featured" ? "Unfeature" : "Restore"}
            </button>
          )}
          <button
            className="sf-btn sf-btn-quiet sf-btn-sm"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Close" : "Details"}
          </button>
        </div>
      </div>
      {err && <p className="sf-admin-error">{err}</p>}

      {open && (
        <div className="sf-admin-detail">
          <div className="sf-admin-detail-preview">
            <img src={preview} alt={`Card preview for ${r.repo}`} />
            <div className="sf-admin-form">
              <label>
                <span className="sf-label">Theme</span>
                <select
                  className="sf-admin-input"
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                >
                  {Object.entries(THEMES).map(([id, t]) => (
                    <option key={id} value={id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sf-label">Layout</span>
                <select
                  className="sf-admin-input"
                  value={form.layout}
                  onChange={(e) => setForm({ ...form, layout: e.target.value })}
                >
                  {LAYOUTS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sf-label">Order</span>
                <input
                  className="sf-admin-input"
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </label>
              <label className="is-wide">
                <span className="sf-label">Extra card params</span>
                <input
                  className="sf-admin-input"
                  placeholder="size=lg&bgDecoration=none"
                  value={form.params}
                  onChange={(e) => setForm({ ...form, params: e.target.value })}
                />
              </label>
              <label className="is-wide">
                <span className="sf-label">Notes (private)</span>
                <input
                  className="sf-admin-input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
              <div className="sf-admin-form-actions">
                <button
                  className="sf-btn sf-btn-ghost sf-btn-sm"
                  disabled={!!busy}
                  onClick={() => act("update", form)}
                >
                  {busy === "update" ? "Saving…" : "Save settings"}
                </button>
                <button
                  className="sf-btn sf-btn-quiet sf-btn-sm"
                  disabled={!!busy}
                  onClick={() => act("refresh")}
                >
                  {busy === "refresh" ? "…" : "Refresh GitHub data"}
                </button>
              </div>
            </div>
          </div>

          <div className="sf-admin-detail-lists">
            <div>
              <span className="sf-label">Where it appears</span>
              {embeds.length === 0 ? (
                <p className="sf-admin-muted">
                  No file found by code search yet.
                </p>
              ) : (
                <ul className="sf-admin-list">
                  {embeds.map((e) => (
                    <li key={e.id}>
                      <span className="sf-admin-chip">{e.kind}</span>
                      <a
                        href={e.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {e.host_repo}/{e.path}
                      </a>
                      {e.card_repo !== r.repo && (
                        <span className="sf-admin-muted">
                          shows {e.card_repo}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <span className="sf-label">Requests by source</span>
              {usage.length === 0 ? (
                <p className="sf-admin-muted">No card requests logged.</p>
              ) : (
                <ul className="sf-admin-list">
                  {usage.map((u) => (
                    <li key={u.id}>
                      <span
                        className="sf-admin-chip"
                        title={SOURCE_INFO[u.source]}
                      >
                        {u.source}
                      </span>
                      <span>
                        {u.referer_host || "—"}
                        {u.sub_path && ` · /${u.sub_path}`}
                      </span>
                      <span className="sf-admin-muted">
                        {fmt(Number(u.hits))}× · {ago(u.last_seen)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

// ── Raw request log ────────────────────────────────────────────────────────
function UsageTab({ usage }) {
  const [source, setSource] = useState("all");
  const sources = useMemo(
    () => ["all", ...new Set(usage.map((u) => u.source))],
    [usage]
  );
  const rows = usage.filter((u) => source === "all" || u.source === source);

  return (
    <section>
      <div className="sf-admin-toolbar">
        <div className="sf-admin-seg">
          {sources.map((s) => (
            <button
              key={s}
              className={source === s ? "is-on" : ""}
              onClick={() => setSource(s)}
              title={SOURCE_INFO[s]}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="sf-admin-table-wrap">
        <table className="sf-admin-table">
          <thead>
            <tr>
              <th>Repo</th>
              <th>Source</th>
              <th>Referrer</th>
              <th>Requests</th>
              <th>First</th>
              <th>Last</th>
              <th>Last params</th>
              <th>User agent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <a
                    href={`https://github.com/${u.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {u.repo}
                  </a>
                  {u.sub_path && (
                    <span className="sf-admin-muted"> /{u.sub_path}</span>
                  )}
                </td>
                <td>
                  <span className="sf-admin-chip" title={SOURCE_INFO[u.source]}>
                    {u.source}
                  </span>
                </td>
                <td>{u.referer_host || "—"}</td>
                <td>{fmt(Number(u.hits))}</td>
                <td>{ago(u.first_seen)}</td>
                <td>{ago(u.last_seen)}</td>
                <td className="sf-admin-mono" title={u.last_params}>
                  {u.last_params || "—"}
                </td>
                <td className="sf-admin-mono" title={u.user_agent}>
                  {u.user_agent || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Code-search results ────────────────────────────────────────────────────
function EmbedsTab({ embeds }) {
  return (
    <div className="sf-admin-table-wrap">
      <table className="sf-admin-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Kind</th>
            <th>Card shows</th>
            <th>First found</th>
            <th>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {embeds.map((e) => (
            <tr key={e.id}>
              <td>
                <a href={e.html_url} target="_blank" rel="noopener noreferrer">
                  {e.host_repo}/{e.path}
                </a>
              </td>
              <td>
                <span className="sf-admin-chip">{e.kind}</span>
              </td>
              <td>{e.card_repo}</td>
              <td>{ago(e.first_seen)}</td>
              <td>{ago(e.last_seen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScansTab({ scans }) {
  return (
    <div className="sf-admin-table-wrap">
      <table className="sf-admin-table">
        <thead>
          <tr>
            <th>Started</th>
            <th>Duration</th>
            <th>Files found</th>
            <th>New repos</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s) => (
            <tr key={s.id}>
              <td>{new Date(s.started_at).toLocaleString()}</td>
              <td>
                {s.finished_at
                  ? `${Math.round((new Date(s.finished_at) - new Date(s.started_at)) / 1000)}s`
                  : "running"}
              </td>
              <td>{s.found}</td>
              <td>{s.new_repos}</td>
              <td className="sf-admin-mono">{s.error ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
