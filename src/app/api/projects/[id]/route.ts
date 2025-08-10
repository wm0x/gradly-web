import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = 'nodejs';



export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }  
) {
  const { id } = await params;                       
  try {
    await db.project.delete({ where: { id } });
    return NextResponse.json({ message: "Project deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
