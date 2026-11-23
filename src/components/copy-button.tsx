"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Kopieren" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "Kopiert ✓" : label}
    </button>
  );
}
