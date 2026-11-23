import type { Json } from "./database.types";

/** slides-Spalte: ["Text", …] oder [{ text, … }, …] */
export function slideTexts(slides: Json): string[] {
  if (!Array.isArray(slides)) return [];
  return slides.map((s) => {
    if (typeof s === "string") return s;
    if (s && typeof s === "object" && !Array.isArray(s) && typeof s.text === "string") return s.text;
    return JSON.stringify(s);
  });
}
