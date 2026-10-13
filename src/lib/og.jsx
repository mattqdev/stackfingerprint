// Shared Open Graph image renderer (1200×630, brand colours).
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

async function loadDela(text) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Dela+Gothic+One&text=${encodeURIComponent(text)}`
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null; // offline build: fall back to the default font
  }
}

export async function renderOg({ eyebrow, title, footer }) {
  const font = await loadDela(title);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: "#fff",
        backgroundColor: "#000",
        backgroundImage:
          "radial-gradient(circle at 0% 100%, rgba(54,198,0,0.35), rgba(0,0,0,0) 60%)",
      }}
    >
      <div
        style={{
          fontSize: 26,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "#36c600",
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: font ? "Dela" : undefined,
          fontSize: title.length > 60 ? 60 : 76,
          lineHeight: 1.08,
          maxWidth: 1050,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 26,
          color: "#a3a3a3",
        }}
      >
        <span>{footer}</span>
        <span style={{ color: "#fff" }}>stackfingerprint.vercel.app</span>
      </div>
    </div>,
    {
      ...ogSize,
      fonts: font ? [{ name: "Dela", data: font, style: "normal" }] : [],
    }
  );
}
