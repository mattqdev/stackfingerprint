// src/app/api/admin/login/route.js
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  checkPassword,
  sessionToken,
} from "../../../../lib/server/adminAuth";

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));
  if (!checkPassword(password)) {
    // Small delay to slow down guessing.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
