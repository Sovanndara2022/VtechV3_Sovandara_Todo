//================API: /api/todo/:id (PUT, DELETE)===========================
// Ensures URL id matches body id to avoid accidental updates.
// Uses repo switch (dummy vs Supabase) for easy demo.
// Returns { success: true } per spec.
// =====================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteTodo, modeFromRequest, updateTodo } from "@/lib/repos/switch";

const UpdateSchema = z.object({
  id: z.string().uuid(),
  todo: z.string().trim().min(1),
  isCompleted: z.boolean(),
  createdAt: z.string().refine((v) => Number.isFinite(Date.parse(v)), "createdAt must be a timestamp string"),
});

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const mode = modeFromRequest(req);
    const body = UpdateSchema.parse(await req.json());

    if (body.id !== id) {
      return NextResponse.json({ error: "Body id must match URL id" }, { status: 400 });
    }

    await updateTodo(mode, id, { todo: body.todo, isCompleted: body.isCompleted });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const mode = modeFromRequest(req);
    await deleteTodo(mode, id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Delete failed" }, { status: 500 });
  }
}