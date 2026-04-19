import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getCenterScopeId } from "@/lib/user-access";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const currentUser = await getCurrentAppUser();
    const centerScopeId = getCenterScopeId(currentUser);
    const centers = await prisma.center.findMany({
      where: centerScopeId ? { id: centerScopeId } : undefined,
      include: {
        city: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(centers);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch centers" },
      { status: 500 }
    );
  }
}
