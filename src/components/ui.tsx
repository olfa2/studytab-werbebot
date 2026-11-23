import type { DraftStatus } from "@/lib/database.types";

const STATUS_STYLE: Record<DraftStatus, string> = {
  entwurf: "bg-amber-100 text-amber-800",
  freigegeben: "bg-blue-100 text-blue-800",
  verworfen: "bg-gray-100 text-gray-500",
  gepostet: "bg-green-100 text-green-800",
  fehler: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: DraftStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  );
}

export function SlotBadge({ slot }: { slot: string }) {
  const color = slot === "A" ? "bg-kapy text-white" : slot === "B" ? "bg-ozean text-white" : "bg-kapy-braun text-white";
  return (
    <span className={`grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold ${color}`}>{slot}</span>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {sub && <p className="mt-1 text-sm text-tinte/60">{sub}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card text-center text-sm text-tinte/50">{children}</div>;
}
