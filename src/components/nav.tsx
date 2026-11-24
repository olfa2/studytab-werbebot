"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Übersicht" },
  { href: "/tiktok", label: "TikTok" },
  { href: "/trends", label: "Trends" },
  { href: "/entwuerfe", label: "Entwürfe" },
  { href: "/plan", label: "Plan & Posts" },
  { href: "/wissen", label: "Wissen" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
              active ? "bg-hellblau text-ozean" : "text-tinte/70 hover:bg-grund"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
