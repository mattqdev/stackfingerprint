// src/app/api/admin/scan/route.js
// Runs a GitHub code search for every public file referencing Stack
// Fingerprint. Triggered daily by Vercel Cron (GET) or from the dashboard (POST).
import { NextResponse } from "next/server";
import { isAdmin, isCron } from "../../../../lib/server/adminAuth";
import { runScan } from "../../../../lib/server/scan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle() {
  try {
    return NextResponse.json(await runScan());
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request) {
  if (!isCron(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return handle();
}

export async function POST() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return handle();
}
