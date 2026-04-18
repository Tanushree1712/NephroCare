import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all appointments
export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: true,
        center: {
          include: { city: true },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// CREATE appointment
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.patientId || !body.centerId || !body.date) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: Number(body.patientId),
        centerId: Number(body.centerId),
        date: new Date(body.date),
      },
    });

    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}