import type { Json } from "./database.types";

export type Slide = {
  title: string;
  body?: string;
  small?: string;
  img?: string; // Schlüssel aus public/library, z. B. "app-scan" oder "kapy-buch"
};
export function parseSlides(slides: Json): Slide[] {
  if (!Array.isArray(slides)) return [];
  return slides.map((s) => {
    if (typeof s === "string") return { title: s };
    if (s && typeof s === "object" && !Array.isArray(s)) {
      const o = s as Record<string, Json | undefined>;
      return {
        title: typeof o.title === "string" ? o.title : typeof o.text === "string" ? o.text : "",
        body: typeof o.body === "string" ? o.body : undefined,
        small: typeof o.small === "string" ? o.small : undefined,
        img: typeof o.img === "string" ? o.img : undefined,
      };
    }
    return { title: "" };
  });
}

