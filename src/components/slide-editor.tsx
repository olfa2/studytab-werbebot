"use client";

import { useState } from "react";
import type { Slide } from "@/lib/slides";
import type { LibraryImage } from "@/lib/library";

/** Slides bearbeiten: Text ändern, Bild wählen, verschieben, löschen, hinzufügen. Ergebnis geht als JSON ans Formular. */
export function SlideEditor({ initial, library }: { initial: Slide[]; library: LibraryImage[] }) {
  const [slides, setSlides] = useState<Slide[]>(initial);
  const [picker, setPicker] = useState<number | null>(null);

  const update = (i: number, patch: Partial<Slide>) =>
    setSlides((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) =>
    setSlides((s) => {
      const t = [...s];
      [t[i], t[i + d]] = [t[i + d], t[i]];
      return t;
    });
  const remove = (i: number) => setSlides((s) => s.filter((_, j) => j !== i));
  const add = (at: number) =>
    setSlides((s) => [...s.slice(0, at), { title: "new slide", body: "" }, ...s.slice(at)]);
  const src = (key?: string) => library.find((l) => l.key === key)?.src;
  const groups = [...new Set(library.map((l) => l.group))];

  return (
    <div className="mt-2 space-y-3">
      <input type="hidden" name="slides_json" value={JSON.stringify(slides)} />
      {slides.map((sl, i) => (
        <div key={i} className="rounded-lg bg-grund p-3">
          <div className="mb-2 flex items-center gap-1">
            <span className="text-xs font-bold text-tinte/50">Slide {i + 1}</span>
            <div className="ml-auto flex gap-1">
              <button type="button" className="btn-ghost px-2 py-0.5" disabled={i === 0} onClick={() => move(i, -1)} title="Nach vorne">↑</button>
              <button type="button" className="btn-ghost px-2 py-0.5" disabled={i === slides.length - 1} onClick={() => move(i, 1)} title="Nach hinten">↓</button>
              <button type="button" className="btn-ghost px-2 py-0.5" onClick={() => add(i + 1)} title="Slide danach einfügen">+</button>
              <button type="button" className="btn-ghost px-2 py-0.5 text-red-600" disabled={slides.length <= 1} onClick={() => remove(i)} title="Slide löschen">✕</button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_96px]">
            <div className="space-y-2">
              <div>
                <label className="label">Überschrift</label>
                <input value={sl.title} onChange={(e) => update(i, { title: e.target.value })} className="input" />
              </div>
              {i === 0 ? (
                <div>
                  <label className="label">Kleiner Text unter dem Bild</label>
                  <input value={sl.small ?? ""} onChange={(e) => update(i, { small: e.target.value || undefined })} className="input" placeholder="(save this)" />
                </div>
              ) : (
                <div>
                  <label className="label">Text (_so_ = unterstrichen)</label>
                  <textarea value={sl.body ?? ""} onChange={(e) => update(i, { body: e.target.value || undefined })} rows={2} className="input" />
                </div>
              )}
            </div>
            <div>
              <label className="label">Bild</label>
              <button
                type="button"
                onClick={() => setPicker(picker === i ? null : i)}
                className="grid h-28 w-24 place-items-center overflow-hidden rounded-lg border border-black/10 bg-white text-xs text-tinte/50"
              >
                {src(sl.img) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src(sl.img)} alt="" className="h-full w-full object-contain" />
                ) : (
                  "automatisch"
                )}
              </button>
            </div>
          </div>
          {picker === i && (
            <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-black/10 bg-white p-2">
              <button type="button" className="btn-ghost mb-2 w-full" onClick={() => { update(i, { img: undefined }); setPicker(null); }}>
                Kein festes Bild (automatisch wählen)
              </button>
              {groups.map((g) => (
                <div key={g} className="mb-2">
                  <p className="label">{g}</p>
                  <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
                    {library.filter((l) => l.group === g).map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        title={l.key}
                        onClick={() => { update(i, { img: l.key }); setPicker(null); }}
                        className={`aspect-[3/4] overflow-hidden rounded border ${sl.img === l.key ? "border-aktion ring-2 ring-aktion/30" : "border-black/10"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.src} alt={l.key} loading="lazy" className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn-ghost w-full" onClick={() => add(slides.length)}>+ Slide am Ende</button>
    </div>
  );
}
