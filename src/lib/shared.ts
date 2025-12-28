export type Backend = "supabase" | "dummy";

// Single source of truth to avoid hydration mismatches.
export function backendMode(): Backend {
  const v = (process.env.NEXT_PUBLIC_DATA_BACKEND ?? process.env.DATA_BACKEND ?? "dummy").toLowerCase();
  return v === "dummy" ? "dummy" : "supabase";
}

// Simple ID helper (used by dummy repo)
export function makeId(): string {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (globalThis.crypto?.randomUUID?.() as string) ?? Math.random().toString(36).slice(2, 10);
}

export const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
export const isDuplicate = (q: string, todos: { todo: string }[]) =>
  !!normalize(q) && todos.some((t) => normalize(t.todo) === normalize(q));