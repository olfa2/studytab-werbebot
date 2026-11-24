import "server-only";
import { readdirSync } from "node:fs";
import { join } from "node:path";

export type LibraryImage = { key: string; src: string; group: string };

const GROUPS: Record<string, string> = {
  app: "App",
  kapy: "Kapy",
  p: "Stimmung",
};

/** Alle Bilder aus public/library, gruppiert nach Präfix */
export function listLibrary(): LibraryImage[] {
  return readdirSync(join(process.cwd(), "public/library"))
    .filter((f) => /\.(png|jpg)$/.test(f))
    .map((f) => {
      const key = f.replace(/\.(png|jpg)$/, "");
      return { key, src: `/library/${f}`, group: GROUPS[key.split("-")[0]] ?? "Sonstige" };
    })
    .sort((a, b) => a.group.localeCompare(b.group) || a.key.localeCompare(b.key, "de", { numeric: true }));
}
