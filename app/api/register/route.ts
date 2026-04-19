import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function confirmSupabaseAuthUser(
  tx: Prisma.TransactionClient,
  supabaseId: string
) {
  await tx.$executeRaw`
    UPDATE auth.users
    SET
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
    WHERE id = CAST(${supabaseId} AS uuid)
  `;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = cleanText(body.name);
    const email = cleanText(body.email)?.toLowerCase();
    const supabaseId = cleanText(body.supabaseId);
    const phone = cleanText(body.phone);
    const gender = cleanText(body.gender) ?? "other";
    const location = cleanText(body.location);
    const centerId = Number(body.centerId);
    const age = Number(body.age);

    if (!name || !email || !supabaseId || !phone || !location) {
      return NextResponse.json(
        { error: "Name, email, phone, location, and auth details are required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(centerId) || !Number.isFinite(age)) {
      return NextResponse.json(
        { error: "Valid age and center details are required." },
        { status: 400 }
      );
    }

    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { id: true },
    });

    if (!center) {
      return NextResponse.json(
        { error: "Selected center could not be found." },
        { status: 404 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { supabaseId }],
      },
      select: {
        id: true,
        patientId: true,
      },
    });

    if (existingUser?.patientId) {
      return NextResponse.json(
        { error: "This account is already linked to a patient profile." },
        { status: 409 }
      );
    }

    const patient = await prisma.$transaction(async (tx) => {
      const createdPatient = await tx.patient.create({
        data: {
          name,
          age,
          gender,
          phone,
          bloodGroup: cleanText(body.bloodGroup),
          location,
          primaryDiagnosis: cleanText(body.primaryDiagnosis),
          dialysisType: cleanText(body.dialysisType),
          dialysisFrequency: cleanText(body.dialysisFrequency),
          vascularAccess: cleanText(body.vascularAccess),
          dialysisSince: body.dialysisSince ? new Date(body.dialysisSince) : null,
          preferredSlot: cleanText(body.preferredSlot),
          allergies: cleanText(body.allergies),
          comorbidities: cleanText(body.comorbidities),
          medicalHistory: cleanText(body.medicalHistory),
          emergencyContactName: cleanText(body.emergencyContactName),
          emergencyContactPhone: cleanText(body.emergencyContactPhone),
          centerId,
        },
        include: {
          center: {
            include: {
              city: true,
            },
          },
        },
      });

      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            email,
            phone,
            supabaseId,
            role: "PATIENT",
            centerId,
            patientId: createdPatient.id,
          },
        });
      } else {
        await tx.user.create({
          data: {
            name,
            email,
            phone,
            supabaseId,
            role: "PATIENT",
            centerId,
            patientId: createdPatient.id,
          },
        });
      }

      await confirmSupabaseAuthUser(tx, supabaseId);

      return createdPatient;
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This patient record already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to complete patient registration." },
      { status: 500 }
    );
  }
}
