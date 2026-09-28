// src/lib/server/adminAuth.js
// Single-admin auth: the session cookie holds an HMAC of ADMIN_PASSWORD, so
// changing the password invalidates every existing session.
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "sf_admin";

function sign(value) {
  return createHmac("sha256", process.env.ADMIN_PASSWORD ?? "")
    .update(value)
    .digest("hex");
}

function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function sessionToken() {
  return sign("stackfingerprint-admin-session");
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string") return false;
  return safeEqual(sign(password), sign(expected));
}

export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  return !!token && safeEqual(token, sessionToken());
}

// Vercel Cron sends "Authorization: Bearer $CRON_SECRET".
export function isCron(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  return !!secret && safeEqual(auth, `Bearer ${secret}`);
}
