//================SUPABASE REPO (Postgres)===================================
// Implements Todo CRUD using Supabase (Postgres).
// Maps DB snake_case fields to app camelCase fields.
// Keeps timestamps as ISO strings for API consistency.
// =====================================================
import type { Todo } from "../types";
import { getServerSupabase } from "../supabase/server";

const toIso = (row: any): string => {
  if (row.created_at) return new Date(row.created_at).toISOString();
  if (typeof row.created_at_ms === "number") return new Date(row.created_at_ms).toISOString();
  return new Date().toISOString();
};

const toApp = (row: any): Todo => ({
  id: row.id,
  todo: row.todo,
  isCompleted: row.is_completed ?? false,
  createdAt: toIso(row),
});

const toMs = (iso?: string): number | undefined => {
  if (typeof iso !== "string") return undefined;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : undefined;
};

export async function listTodos(): Promise<Todo[]> {
  const s = getServerSupabase();
  const { data, error } = await s
    .from("todos")
    .select("id,todo,is_completed,created_at,created_at_ms")
    .order("created_at_ms", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toApp);
}

export async function createTodo(input: { id?: string; todo: string; isCompleted?: boolean; createdAt?: string }): Promise<Todo> {
  const s = getServerSupabase();

  const payload: Record<string, unknown> = {
    todo: input.todo,
    is_completed: typeof input.isCompleted === "boolean" ? input.isCompleted : false,
  };

  if (typeof input.id === "string") payload.id = input.id;
  const ms = toMs(input.createdAt);
  if (typeof ms === "number") payload.created_at_ms = ms;

  const { data, error } = await s
    .from("todos")
    .insert(payload)
    .select("id,todo,is_completed,created_at,created_at_ms")
    .single();

  if (error) throw error;
  return toApp(data);
}

export async function updateTodo(id: string, patch: Partial<Todo>): Promise<Todo> {
  const s = getServerSupabase();

  const payload: Record<string, unknown> = {};
  if (typeof patch.todo === "string") payload.todo = patch.todo;
  if (typeof patch.isCompleted === "boolean") payload.is_completed = patch.isCompleted;

  const { data, error } = await s
    .from("todos")
    .update(payload)
    .eq("id", id)
    .select("id,todo,is_completed,created_at,created_at_ms")
    .single();

  if (error) throw error;
  return toApp(data);
}

export async function deleteTodo(id: string): Promise<void> {
  const s = getServerSupabase();
  const { error } = await s.from("todos").delete().eq("id", id);
  if (error) throw error;
}

export default { listTodos, createTodo, updateTodo, deleteTodo };
