import { Dela_Gothic_One, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dela = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dela",
});

const jetbrains = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export const metadata = {
  metadataBase: new URL("https://stackfingerprint.vercel.app"),
  title: {
    default: "Stack Fingerprint — Detect any repo's tech stack",
    template: "%s | Stack Fingerprint",
  },
  description:
    "Analyze any GitHub repository to identify its tech stack instantly. Generate beautiful, embeddable SVG cards for your README or portfolio.",
  keywords: [
    "GitHub tech stack detector",
    "repository analyzer",
    "SVG shields",
    "developer tools",
    "project stack fingerprint",
  ],
  authors: [{ name: "mattdev" }],
  creator: "mattdev",
  openGraph: {
    title: "Stack Fingerprint — Tech Stack Detector",
    description: "Paste a GitHub URL and generate a beautiful tech stack card.",
    url: "https://stackfingerprint.vercel.app",
    siteName: "Stack Fingerprint",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/StackFingerprintThumb.png",
        width: 1200,
        height: 630,
        alt: "Stack Fingerprint Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stack Fingerprint — Detect any repo's tech stack",
    description: "Instantly identify tech stacks from GitHub URLs.",
    creator: "@mattqdev",
    images: ["/StackFingerprintThumb.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://stackfingerprint.vercel.app",
  },
  verification: {
    google: "kkjcQbru_GaoTFpR7cIshWnCbYCi4Xl0lAaclaF_Fy0",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dela.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
