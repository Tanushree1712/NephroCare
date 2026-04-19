import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.center.findFirst({
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Database connection failed.",
      },
      { status: 503 }
    );
  }
}
