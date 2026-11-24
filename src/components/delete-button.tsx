"use client";

import { useState } from "react";

/** Zweistufiger Lösch-Knopf ohne Browser-Dialog */
export function DeleteButton({ label = "Entwurf löschen" }: { label?: string }) {
  const [armed, setArmed] = useState(false);
  return armed ? (
    <span className="flex gap-1">
      <button className="btn bg-red-600 text-white hover:bg-red-700">Wirklich löschen</button>
      <button type="button" className="btn-ghost" onClick={() => setArmed(false)}>Abbrechen</button>
    </span>
  ) : (
    <button type="button" className="btn-ghost text-red-600" onClick={() => setArmed(true)}>{label}</button>
  );
}
