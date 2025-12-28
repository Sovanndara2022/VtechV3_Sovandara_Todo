// =====================================================
//  full-featured todo app with two modes:
// 1. Dummy mode 
// 2. Live mode (uses Supabase)
// =====================================================
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Todo } from "@/lib/types";
import { isDuplicate, normalize } from "@/lib/shared";
import { hasSupabasePublicEnv, supabase } from "@/lib/supabaseClient";
// Define the modes of todo app
type TodoMode = "dummy" | "live";

// API success response type
type ApiSuccess = { success: true };


 // Helper function to safely parse JSON from API responses
 // Handles errors gracefully and provides meaningful error messages
 
async function readJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || res.statusText || "Request failed");
  return data as T;
}

 //Random ID for new todos

function uuid(): string {
  // browser-safe uuid
  return (globalThis.crypto?.randomUUID?.() as string) ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}



 // Main Page Component of todo application
  //Manages all state, handles CRUD operations, and renders the UI
 
export default function Page() {
   
  // Track and checking which backend mode using (dummy or live)
  const [todoMode, setTodoMode] = useState<TodoMode>("dummy");
  // Store all todos
  const [todos, setTodos] = useState<Todo[]>([]);

  // Loading state for async operations
  const [loading, setLoading] = useState(true);

  // Error messages from failed operations
  const [error, setError] = useState<string | null>(null);

 // User's search/input query
  const [query, setQuery] = useState("");
  // Warning messages (e.g., duplicate todos, validation errors)
  const [warn, setWarn] = useState<string | null>(null);

  // ID of the todo currently being edited (null when creating new)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Reference to the input field for programmatic
  const inputRef = useRef<HTMLInputElement | null>(null);


    

   // Load saved mode (dummy/live) so making stay after refresh
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("todoMode") : null;
    if (saved === "live" || saved === "dummy") setTodoMode(saved);
  }, []);



   // Save mode so Whenever the mode changes, save it to localStorage 
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("todoMode", todoMode);
  }, [todoMode]);



  // Fetch helper: always send mode header so API uses dummy/live
  const apiFetch = useCallback(
    (path: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set("x-todo-mode", todoMode);
      return fetch(path, { ...init, headers });
    },
    [todoMode]
  );

  

  // Load todos from API (handles loading + errors)
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/todo");
      const data = await readJson<Todo[]>(res);
      setTodos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // Load once on page open (and when load() changes)
  useEffect(() => {
    void load();
  }, [load]);


  // Live mode(Supabase) refresh the list
  useEffect(() => {
    if (todoMode !== "live") return;
    if (!hasSupabasePublicEnv()) return;

    const ch = supabase
      .channel("todos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "todos" }, () => void load())
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [todoMode, load]);

  // ============ SEARCH & FILTERING ============
// Filter todos by search text (normalized) and memoize the result
  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return todos;
    return todos.filter((t) => normalize(t.todo).includes(q));
  }, [todos, query]);

// ============ CREATE & UPDATE  ============
// Create or update the todo list (validate empty and check duplicates)
  const submit = useCallback(async () => {
    const text = query.trim();
    setWarn(null);

    if (!text) return setWarn("Todo cannot be empty.");

    const dupBase = editingId ? todos.filter((t) => t.id !== editingId) : todos;
    if (isDuplicate(text, dupBase)) return setWarn("Duplicate todo. Please enter a unique one.");

    try {
        // ========== UPDATE EXISTING TODO ==========
      if (editingId) {
        const cur = todos.find((t) => t.id === editingId);
        const res = await apiFetch(`/api/todo/${editingId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            todo: text,
            isCompleted: cur?.isCompleted ?? false,
            createdAt: cur?.createdAt ?? new Date().toISOString(),
          }),
        });
        await readJson<ApiSuccess>(res);
        setEditingId(null);
        setQuery("");
        await load();
        return;
      }


      // ========== CREATE NEW TODO ==========
      const newId = uuid();
      const res = await apiFetch("/api/todo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: newId,
          todo: text,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        }),
      });
      await readJson<ApiSuccess>(res);
      setQuery("");
      await load();
    } catch (e: any) {
      setWarn(e?.message ?? "Save failed");
    }
  }, [apiFetch, editingId, query, todos, load]);


  // ============ DELETE OPERATION ============
  
 // Delete todo list (API + remove from UI)
  const onRemove = useCallback(
    async (id: string) => {
      setWarn(null);
      try {
        const res = await apiFetch(`/api/todo/${id}`, { method: "DELETE" });
        await readJson<ApiSuccess>(res);
        setTodos((prev) => prev.filter((t) => t.id !== id));
      } catch (e: any) {
        setWarn(e?.message ?? "Delete failed");
      }
    },
    [apiFetch]
  );

    // ============ TOGGLE COMPLETION STATUS ============
  
 
   // Toggle a todo's completion status (checked/unchecked)(API + update UI) 
  const onToggle = useCallback(
    async (t: Todo) => {
      setWarn(null);
      try {
        const res = await apiFetch(`/api/todo/${t.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: t.id,
            todo: t.todo,
            isCompleted: !t.isCompleted,
            createdAt: t.createdAt,
          }),
        });
        await readJson<ApiSuccess>(res);
        setTodos((prev) => prev.map((x) => (x.id === t.id ? { ...x, isCompleted: !x.isCompleted } : x)));
      } catch (e: any) {
        setWarn(e?.message ?? "Update failed");
      }
    },
    [apiFetch]
  );

  // ============ EDIT MODE ============
  

   // Enter edit mode for a specific todo
  const onEdit = useCallback((t: Todo) => {
    setWarn(null);
    setEditingId(t.id);
    setQuery(t.todo);
    inputRef.current?.focus();
  }, []);


   // ============ RENDER UI ============
  return (
    <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Todo</h1>
        <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          Backend:
          <select value={todoMode} onChange={(e) => setTodoMode(e.target.value as TodoMode)}>
            <option value="dummy">Dummy</option>
            <option value="live">Live (Supabase)</option>
          </select>
        </label>
      </div>

      {todoMode === "live" && !hasSupabasePublicEnv() && (
        <div style={{ padding: 10, border: "1px solid #f0c", borderRadius: 8, marginBottom: 12 }}>
          Live mode selected, but Supabase env is missing.
        </div>
      )}

      <input
        ref={inputRef}
        value={query}
        placeholder={editingId ? "Edit todo and press Enter" : "Type and press Enter to add"}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void submit();
          if (e.key === "Escape") {
            setEditingId(null);
            setQuery("");
            setWarn(null);
          }
        }}
        style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
      />

      <div style={{ marginTop: 10, minHeight: 18 }}>
        {warn && <div style={{ color: "crimson" }}>{warn}</div>}
        {error && <div style={{ color: "crimson" }}>{error}</div>}
        {loading && <div>Loading…</div>}
        {!loading && query.trim() && filtered.length === 0 && <div>No result. Create a new one instead!</div>}
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {filtered.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          >
            <input type="checkbox" checked={t.isCompleted} onChange={() => void onToggle(t)} aria-label="toggle-complete" />
            <div
              style={{
                flex: 1,
                textDecoration: t.isCompleted ? "line-through" : "none",
                opacity: t.isCompleted ? 0.6 : 1,
              }}
            >
              {t.todo}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onEdit(t)} aria-label="edit">
                Edit
              </button>
              <button onClick={() => void onRemove(t.id)} aria-label="remove">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}