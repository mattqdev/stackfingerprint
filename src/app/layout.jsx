import "./globals.css";

export const metadata = {
  title: "Stack Fingerprint — Detect any repo's tech stack",
  description:
    "Paste a GitHub URL and generate a beautiful, embeddable SVG card showing the project's automatically detected tech stack.",
  openGraph: {
    title: "Stack Fingerprint",
    description: "Detect any GitHub repo's tech stack instantly.",
    url: "https://stackfingerprint.dev",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
