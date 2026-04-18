import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET sessions
export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        patient: true,
        appointment: {
          include: {
            center: {
              include: { city: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// CREATE session
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.patientId || !body.appointmentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await prisma.session.create({
      data: {
        patientId: Number(body.patientId),
        appointmentId: Number(body.appointmentId),
        weightBefore: body.weightBefore
          ? Number(body.weightBefore)
          : null,
        weightAfter: body.weightAfter
          ? Number(body.weightAfter)
          : null,
        bp: body.bp,
        notes: body.notes,
      },
    });

    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}