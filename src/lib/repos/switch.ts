//================REPO SWITCH (Dummy vs Supabase)============================
// Keeps API routes stable while swapping backends (dummy vs Supabase).
// Makes demos easy: run without DB, then switch to live.
// =====================================================

import type { Todo, TodoCreateRequest } from "@/lib/types";

export type TodoMode = "dummy" | "live";

type RepoApi = {
  listTodos: () => Promise<Todo[]>;
  createTodo: (input: { id?: string; todo: string; isCompleted?: boolean; createdAt?: string }) => Promise<Todo>;
  updateTodo: (id: string, patch: Partial<Todo>) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<void>;
};

type RepoModule = Record<string, unknown>;

function normalizeRepo(mod: RepoModule): RepoApi {
  if ("default" in mod && typeof (mod as any).default === "object" && (mod as any).default) {
    return normalizeRepo((mod as any).default as RepoModule);
  }

  if ("dList" in mod || "dCreate" in mod || "dUpdate" in mod || "dDelete" in mod) {
    return {
      listTodos: (mod as any).dList,
      createTodo: (mod as any).dCreate,
      updateTodo: (mod as any).dUpdate,
      deleteTodo: (mod as any).dDelete,
    };
  }

  if ("listTodos" in mod && "createTodo" in mod && "updateTodo" in mod && "deleteTodo" in mod) {
    return mod as unknown as RepoApi;
  }

  if ("list" in mod || "create" in mod || "update" in mod || "delete" in mod) {
    return {
      listTodos: (mod as any).list,
      createTodo: (mod as any).create,
      updateTodo: (mod as any).update,
      deleteTodo: (mod as any).delete,
    };
  }

  throw new Error(`Repo module shape not recognized. Exported keys: ${Object.keys(mod).join(", ")}`);
}

export function resolveTodoMode(requested?: string | null): TodoMode {
  const envDefault = (process.env.TODO_MODE_DEFAULT ?? process.env.NEXT_PUBLIC_TODO_MODE_DEFAULT ?? "dummy")
    .toString()
    .toLowerCase();
  const raw = (requested ?? envDefault).toString().toLowerCase();
  if (raw === "live" || raw === "supabase") return "live";
  return "dummy";
}

export function modeFromRequest(req: Request): TodoMode {
  const url = new URL(req.url);
  return resolveTodoMode(req.headers.get("x-todo-mode") ?? url.searchParams.get("mode"));
}

async function getRepo(mode: TodoMode): Promise<RepoApi> {
  const mod =
    mode === "live"
      ? ((await import("./supabase-repo")) as unknown as RepoModule)
      : ((await import("./dummy-repo")) as unknown as RepoModule);

  return normalizeRepo(mod);
}

export async function listTodos(mode: TodoMode): Promise<Todo[]> {
  return (await getRepo(mode)).listTodos();
}

export async function createTodo(
  mode: TodoMode,
  input: { id?: string; todo: string; isCompleted?: boolean; createdAt?: string }
): Promise<Todo> {
  return (await getRepo(mode)).createTodo(input);
}

export async function updateTodo(mode: TodoMode, id: string, patch: Partial<Todo>): Promise<Todo> {
  return (await getRepo(mode)).updateTodo(id, patch);
}

export async function deleteTodo(mode: TodoMode, id: string): Promise<void> {
  await (await getRepo(mode)).deleteTodo(id);
}