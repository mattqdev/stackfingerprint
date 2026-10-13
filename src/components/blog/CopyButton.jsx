"use client";
import { useState } from "react";

export default function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  return (
    <button
      type="button"
      className={`sf-btn sf-btn-ghost sf-btn-sm ${copied ? "is-done" : ""}`}
      onClick={copy}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
