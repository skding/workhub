import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { task, dueDate } = body;

    if (!task || !task.trim()) {
      return NextResponse.json(
        { success: false, error: "Task description is required" },
        { status: 400 }
      );
    }

    const todo = await db.todoItem.create({
      data: {
        enquiryId: id,
        task: task.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json({ success: true, data: todo });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
