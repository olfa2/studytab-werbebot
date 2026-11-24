import { ImageResponse } from "next/og";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Slide } from "./slides";
export type { Slide } from "./slides";

export const W = 1080;
export const H = 1440;
const M = 72;
const BOTTOM = 1300; // darunter liegt der TikTok-Titel
const SAFE_R = 880; // rechts unten liegen Profilbild, Like, Kommentar
const INK = "#111111";
const BRAND = {
  green: "#73BF06",
  ocean: "#0B6D9E",
  ink: "#1C1F29",
  bg: "#F5F7FA",
  light: "#DDEFF9",
};

export type Template = "notiz" | "marke";

const root = process.cwd();
const fonts = [
  { name: "Inter", data: readFileSync(join(root, "assets/Inter-400.ttf")), weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: readFileSync(join(root, "assets/Inter-700.ttf")), weight: 700 as const, style: "normal" as const },
];

/** Bild aus der Bibliothek als Data-URL + Seitenverhältnis */
function libraryImage(key?: string) {
  if (!key || !/^[a-z0-9-]+$/.test(key)) return null;
  for (const ext of ["png", "jpg"] as const) {
    const p = join(root, "public/library", `${key}.${ext}`);
    if (!existsSync(p)) continue;
    const buf = readFileSync(p);
    let w = 1, h = 1;
    if (ext === "png") {
      w = buf.readUInt32BE(16);
      h = buf.readUInt32BE(20);
    } else {
      // JPEG: SOF-Marker suchen
      let i = 2;
      while (i < buf.length) {
        const marker = buf[i + 1];
        const len = buf.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          h = buf.readUInt16BE(i + 5);
          w = buf.readUInt16BE(i + 7);
          break;
        }
        i += 2 + len;
      }
    }
    return { src: `data:image/${ext === "png" ? "png" : "jpeg"};base64,${buf.toString("base64")}`, w, h };
  }
  return null;
}

function fit(img: { w: number; h: number }, maxW: number, maxH: number) {
  const r = Math.min(maxW / img.w, maxH / img.h);
  return { width: Math.round(img.w * r), height: Math.round(img.h * r) };
}

/** Text mit _Unterstreichung_ (auch über mehrere Wörter) als Wort-Spans */
function RichText({
  text,
  size,
  lineHeight,
  color,
  weight = 400,
  mark,
  center,
}: {
  text: string;
  size: number;
  lineHeight: number;
  color: string;
  weight?: number;
  mark: "underline" | "highlight";
  center?: boolean;
}) {
  const space = Math.round(size * 0.28);
  const lines = text.split("\n").map((para) => {
    let on = false;
    const words: { w: string; ul: boolean }[] = [];
    for (let w of para.split(/\s+/).filter(Boolean)) {
      if (w.startsWith("_")) {
        on = true;
        w = w.slice(1);
      }
      const core = w.replace(/[.,!?:;"')]+$/, "");
      const ul = on;
      let end = false;
      if (core.endsWith("_")) {
        w = core.slice(0, -1) + w.slice(core.length);
        end = true;
      }
      words.push({ w, ul });
      if (end) on = false;
    }
    return words;
  });
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {lines.map((words, li) => (
        <div
          key={li}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: center ? "center" : "flex-start" }}
        >
          {words.map((t, i) => {
            const nextUl = i + 1 < words.length && words[i + 1].ul;
            const deco =
              t.ul && mark === "underline"
                ? { borderBottom: `${Math.max(2, Math.round(size / 18))}px solid ${color}` }
                : t.ul
                  ? { backgroundColor: "rgba(115,191,6,0.35)" }
                  : {};
            const core = t.ul ? t.w.replace(/[.,!?:;"')]+$/, "") : t.w;
            const punct = t.w.slice(core.length);
            const cont = t.ul && nextUl && !punct;
            return (
              <span
                key={i}
                style={{ display: "flex", height: lineHeight, alignItems: "center", marginRight: cont ? 0 : space }}
              >
                <span
                  style={{ display: "flex", fontSize: size, fontWeight: weight, color, paddingRight: cont ? space : 0, ...deco }}
                >
                  {core}
                </span>
                {punct && <span style={{ display: "flex", fontSize: size, fontWeight: weight, color }}>{punct}</span>}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function NotizSlide({ s, i }: { s: Slide; i: number }) {
  const img = libraryImage(s.img);
  const cover = i === 1;
  const isPhone = s.img?.startsWith("app-");
  return (
    <div
      style={{
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        fontFamily: "Inter",
        padding: `230px ${M}px 0 ${M}px`,
      }}
    >
      <RichText text={s.title} size={cover ? 74 : 64} lineHeight={cover ? 92 : 80} color={INK} mark="underline" />
      {!cover && s.body && img && !isPhone && i % 2 === 1 ? (
        // Text links, Bild rechts (rechter Rand bleibt frei für die TikTok-Buttons)
        <div style={{ display: "flex", marginTop: 50, alignItems: "flex-start" }}>
          <div style={{ display: "flex", width: 480 }}>
            <RichText text={s.body} size={36} lineHeight={50} color={INK} mark="underline" />
          </div>
          <div style={{ display: "flex", width: SAFE_R - M - 480 - 24, marginLeft: 24, marginTop: 20, justifyContent: "flex-end" }}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img src={img.src} {...fit(img, SAFE_R - M - 480 - 24, 760)} />
          </div>
        </div>
      ) : !cover && s.body && (
        <div style={{ display: "flex", marginTop: 50 }}>
          <RichText text={s.body} size={36} lineHeight={50} color={INK} mark="underline" />
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: cover ? "flex-start" : "flex-end",
          flexGrow: 1,
          marginTop: 60,
          marginBottom: H - BOTTOM,
        }}
      >
        {img && (cover || isPhone || i % 2 === 0 || !s.body) && (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={img.src} {...fit(img, cover ? 680 : isPhone ? 560 : 540, cover ? 560 : 640)} />
        )}
        {cover && (
          <span style={{ display: "flex", fontSize: 30, color: INK, marginTop: 24 }}>{s.small ?? "(save this)"}</span>
        )}
      </div>
    </div>
  );
}

function MarkeSlide({ s, i, n }: { s: Slide; i: number; n: number }) {
  const img = libraryImage(s.img);
  const cover = i === 1;
  const bg = cover ? BRAND.green : BRAND.bg;
  const fg = cover ? "#ffffff" : BRAND.ink;
  return (
    <div
      style={{
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        backgroundColor: bg,
        fontFamily: "Inter",
        padding: `200px ${M}px 0 ${M}px`,
        position: "relative",
      }}
    >
      {!cover && (
        <div style={{ display: "flex", position: "absolute", top: 120, left: M, fontSize: 28, fontWeight: 700, color: BRAND.ocean }}>
          {`${i - 1}/${n - 1}`}
        </div>
      )}
      <RichText text={s.title} size={cover ? 82 : 66} lineHeight={cover ? 98 : 80} color={fg} weight={700} mark={cover ? "underline" : "highlight"} />
      {s.body && (
        <div style={{ display: "flex", marginTop: 40 }}>
          <RichText text={s.body} size={38} lineHeight={54} color={fg} mark={cover ? "underline" : "highlight"} />
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          flexGrow: 1,
          marginTop: 50,
          marginBottom: H - BOTTOM,
        }}
      >
        {img && (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={img.src} {...fit(img, 600, cover ? 620 : 700)} />
        )}
      </div>
    </div>
  );
}

export function renderSlide(template: Template, slides: Slide[], index: number) {
  const s = slides[index - 1];
  const el =
    template === "marke" ? <MarkeSlide s={s} i={index} n={slides.length} /> : <NotizSlide s={s} i={index} />;
  return new ImageResponse(el, { width: W, height: H, fonts });
}
