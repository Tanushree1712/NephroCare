import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const centers = await prisma.center.findMany({
      include: {
        city: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(centers);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch centers" },
      { status: 500 }
    );
  }
}