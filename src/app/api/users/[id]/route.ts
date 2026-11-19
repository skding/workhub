import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, password } = body;

    // Check authorization: Admin can update anyone, others can only update their own profile
    if (session.role !== "ADMIN" && session.userId !== id) {
      return NextResponse.json(
        { success: false, error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (role && session.role === "ADMIN") {
      updateData.role = ["ADMIN", "ENGINEER", "VIEWER"].includes(role) ? role : "ENGINEER";
    }
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only Admins can delete users" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Cannot delete yourself
    if (session.userId === id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account while logged in" },
        { status: 400 }
      );
    }

    // Check if this is the last admin
    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the sole Administrator account" },
          { status: 400 }
        );
      }
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
