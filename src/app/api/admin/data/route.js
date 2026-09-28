// src/app/api/admin/data/route.js
// Everything the dashboard shows: repos, raw usage, embeds and scan history.
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/server/adminAuth";
import { getDb } from "../../../../lib/server/db";

export const dynamic = "force-dynamic";

// PostgREST caps a response at 1000 rows — page through to get them all.
async function all(query) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query().range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  if (!db)
    return NextResponse.json({ configured: false, repos: [], usage: [] });

  try {
    const [repos, usage, embeds, scans] = await Promise.all([
      all(() =>
        db.from("sf_repos").select("*").order("last_seen", { ascending: false })
      ),
      all(() =>
        db.from("sf_usage").select("*").order("last_seen", { ascending: false })
      ),
      all(() =>
        db
          .from("sf_embeds")
          .select("*")
          .order("last_seen", { ascending: false })
      ),
      db
        .from("sf_scans")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10)
        .then((r) => r.data ?? []),
    ]);
    return NextResponse.json({ configured: true, repos, usage, embeds, scans });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
