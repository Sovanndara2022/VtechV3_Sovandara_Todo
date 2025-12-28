//================DUMMY REPO (In-Memory)=====================================
// In-memory storage for quick demo (no external DB needed).
// Keeps same interface as Supabase repo so API stays unchanged.
// =====================================================

import { makeId } from "../shared";
import type { Todo } from "../types";

type Store = { todos: Todo[] };
declare global {
  // eslint-disable-next-line no-var
  var __DUMMY_TODO_STORE__: Store | undefined;
}
const g = globalThis as any;
const store: Store = (g.__DUMMY_TODO_STORE__ ||= { todos: [] });

export async function dList(): Promise<Todo[]> {
  await new Promise((r) => setTimeout(r, 25));
  return [...store.todos].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function dCreate(input: { id?: string; todo: string; isCompleted?: boolean; createdAt?: string }): Promise<Todo> {
  const createdAt = typeof input.createdAt === "string" ? input.createdAt : new Date().toISOString();
  const row: Todo = {
    id: typeof input.id === "string" ? input.id : makeId(),
    todo: input.todo,
    isCompleted: typeof input.isCompleted === "boolean" ? input.isCompleted : false,
    createdAt,
  };
  store.todos.unshift(row);
  return row;
}

export async function dUpdate(id: string, patch: Partial<Pick<Todo, "todo" | "isCompleted">>): Promise<Todo> {
  const i = store.todos.findIndex((t) => t.id === id);
  if (i < 0) throw new Error("Not found");
  store.todos[i] = { ...store.todos[i], ...patch };
  return store.todos[i];
}

export async function dDelete(id: string): Promise<void> {
  const i = store.todos.findIndex((t) => t.id === id);
  if (i >= 0) store.todos.splice(i, 1);
}

export const listTodos = dList;
export const createTodo = dCreate;
export const updateTodo = dUpdate;
export const deleteTodo = dDelete;

export default { listTodos, createTodo, updateTodo, deleteTodo };
