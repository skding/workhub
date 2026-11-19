import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; todoId: string }> }
) {
  try {
    const { todoId } = await params;
    const body = await request.json();

    const updated = await db.todoItem.update({
      where: { id: todoId },
      data: {
        ...(body.completed !== undefined && { completed: Boolean(body.completed) }),
        ...(body.task !== undefined && { task: body.task }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; todoId: string }> }
) {
  try {
    const { todoId } = await params;
    await db.todoItem.delete({
      where: { id: todoId },
    });

    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
