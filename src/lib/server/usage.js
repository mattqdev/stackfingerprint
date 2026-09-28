// src/lib/server/usage.js
// Classifies who requested a card and records it (aggregated, no IPs).
import { getDb } from "./db";

const OWN_HOSTS = new Set(["stackfingerprint.vercel.app", "localhost"]);

export function classifyRequest(request) {
  const ua = request.headers.get("user-agent") ?? "";
  const referer = request.headers.get("referer") ?? "";
  let refererHost = "";
  try {
    refererHost = referer ? new URL(referer).hostname : "";
  } catch {}

  let source;
  if (/github-camo/i.test(ua)) source = "readme";
  else if (/stack-fingerprint-action/i.test(ua)) source = "action";
  else if (OWN_HOSTS.has(refererHost)) source = "site";
  else if (refererHost) source = "website";
  else if (/^(curl|wget|python|node|go-http|axios)/i.test(ua))
    source = "script";
  else if (/mozilla/i.test(ua)) source = "direct";
  else source = "other";

  return { source, refererHost, userAgent: ua };
}

export async function trackHit(request, repo, subPath) {
  const db = getDb();
  if (!db) return;
  const { source, refererHost, userAgent } = classifyRequest(request);
  const params = new URL(request.url).searchParams;
  params.delete("repo");

  const { error } = await db.rpc("sf_track_hit", {
    p_repo: repo.toLowerCase(),
    p_sub_path: subPath ?? "",
    p_source: source,
    p_referer_host: refererHost,
    p_user_agent: userAgent,
    p_params: params.toString(),
  });
  if (error) console.error("[usage] track failed:", error.message);
}
