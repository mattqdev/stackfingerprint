// src/app/api/admin/logout/route.js
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "../../../../lib/server/adminAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
