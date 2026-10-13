import { getAllTechs, getTech } from "../../../../lib/tech";
import { renderOg, ogSize } from "../../../../lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Stack Fingerprint technology page";

// Prebuild only indexable pages; the rest render on first request.
export function generateStaticParams() {
  return getAllTechs()
    .filter((t) => t.indexable)
    .map((t) => ({ id: t.id }));
}

export default async function Image({ params }) {
  const { id } = await params;
  const t = getTech(id);
  return renderOg({
    eyebrow: `Stack Fingerprint · ${t?.categoryLabel ?? "Tech"}`,
    title: `Detect ${t?.label ?? "any tech"} in any GitHub repo`,
    footer: "README badge · auto-updating stack card",
  });
}
