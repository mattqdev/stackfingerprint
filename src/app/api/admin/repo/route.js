// src/app/api/admin/repo/route.js
// Feature / hide / reset a repo, edit its showcase settings, or add one by hand.
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/server/adminAuth";
import { getDb } from "../../../../lib/server/db";
import { fetchRepoMeta } from "../../../../lib/server/githubMeta";
import { THEMES } from "../../../../data/themes";
import { LAYOUTS } from "../../../../data/cardOptions";

const REPO_RE = /^[\w.-]+\/[\w.-]+$/;
const LAYOUT_IDS = new Set(LAYOUTS.map((l) => l.id));

export async function POST(request) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  if (!db)
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );

  const body = await request.json().catch(() => ({}));
  const repo = String(body.repo ?? "")
    .trim()
    .toLowerCase();
  if (!REPO_RE.test(repo))
    return NextResponse.json({ error: "Invalid repo" }, { status: 400 });

  const patch = {};
  switch (body.action) {
    case "add":
    case "feature": {
      const meta = await fetchRepoMeta(repo, { withStack: true }).catch(
        () => null
      );
      if (meta?.missing)
        return NextResponse.json({ error: "Repo not found" }, { status: 404 });
      Object.assign(patch, {
        meta,
        meta_updated_at: new Date().toISOString(),
      });
      if (body.action === "feature") {
        patch.status = "featured";
        patch.featured_at = new Date().toISOString();
      }
      break;
    }
    case "hide":
      patch.status = "hidden";
      break;
    case "reset":
      patch.status = "new";
      patch.featured_at = null;
      break;
    case "refresh": {
      const { data } = await db
        .from("sf_repos")
        .select("status")
        .eq("repo", repo)
        .single();
      patch.meta = await fetchRepoMeta(repo, {
        withStack: data?.status === "featured",
      });
      patch.meta_updated_at = new Date().toISOString();
      break;
    }
    case "update":
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  // Showcase settings can ride along with any action.
  if (body.theme !== undefined)
    patch.featured_theme = THEMES[body.theme] ? body.theme : null;
  if (body.layout !== undefined)
    patch.featured_layout = LAYOUT_IDS.has(body.layout) ? body.layout : null;
  if (body.order !== undefined) patch.featured_order = Number(body.order) || 0;
  if (body.params !== undefined)
    patch.featured_params = String(body.params).replace(/^[?&]+/, "") || null;
  if (body.notes !== undefined) patch.notes = String(body.notes) || null;

  const { data: existing } = await db
    .from("sf_repos")
    .select("sources")
    .eq("repo", repo)
    .maybeSingle();
  if (!existing) patch.sources = ["manual"];

  const { data, error } = await db
    .from("sf_repos")
    .upsert({ repo, ...patch }, { onConflict: "repo" })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ repo: data });
}
