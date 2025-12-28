 //================API: /api/todo (GET, POST)===========================
 // Validates request payload with Zod to enforce the spec.
 //  Uses repo switch (dummy vs Supabase) for easy demo.
 //Returns { success: true } for POST per assignment.
// =====================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { createTodo, listTodos, modeFromRequest } from "@/lib/repos/switch";

const CreateSchema = z.object({
  id: z.string().uuid(),
  todo: z.string().trim().min(1),
  isCompleted: z.boolean(),
  createdAt: z.string().refine((v) => Number.isFinite(Date.parse(v)), "createdAt must be a timestamp string"),
});

export async function GET(req: Request) {
  const mode = modeFromRequest(req);
  const todos = await listTodos(mode);
  return NextResponse.json(todos);
}

export async function POST(req: Request) {
  try {
    const mode = modeFromRequest(req);
    const body = CreateSchema.parse(await req.json());
    await createTodo(mode, body);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Create failed" }, { status: 400 });
  }
}