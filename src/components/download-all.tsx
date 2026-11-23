"use client";

import { useState } from "react";

export function DownloadAll({ id, count }: { id: string; count: number }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn-primary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        for (let i = 1; i <= count; i++) {
          const res = await fetch(`/api/slides/${id}/${i}`);
          const blob = await res.blob();
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${id.slice(0, 8)}-slide-${i}.png`;
          a.click();
          URL.revokeObjectURL(a.href);
          await new Promise((r) => setTimeout(r, 300));
        }
        setBusy(false);
      }}
    >
      {busy ? "Lädt…" : `Alle ${count} Slides laden`}
    </button>
  );
}
