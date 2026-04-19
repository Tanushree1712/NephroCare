import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/current-user";
import { getCenterScopeId, isPatientPortalUser } from "@/lib/user-access";
import { NextResponse } from "next/server";

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const patientId = Number(resolvedParams.id);

    if (!Number.isInteger(patientId) || patientId < 1) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }

    if (isPatientPortalUser(currentUser) && currentUser.patientId !== patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const centerScopeId = getCenterScopeId(currentUser);

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        ...(centerScopeId ? { centerId: centerScopeId } : {}),
      },
      include: {
        center: {
          include: { city: true },
        },
        appointments: {
          include: {
            center: true,
          },
          orderBy: { date: "desc" },
        },
        files: true,
        sessions: {
          orderBy: { createdAt: "desc" },
          include: {
            appointment: {
              include: { center: true }
            }
          }
        }
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const patientId = Number(resolvedParams.id);

    if (!Number.isInteger(patientId) || patientId < 1) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }

    if (isPatientPortalUser(currentUser) && currentUser.patientId !== patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const centerScopeId = getCenterScopeId(currentUser);
    const body = await req.json();
    const name = cleanText(body.name);
    const phone = cleanText(body.phone);
    const gender = cleanText(body.gender);
    const centerId = centerScopeId ?? Number(body.centerId);
    const age = Number(body.age);

    if (!name || !phone || !gender) {
      return NextResponse.json(
        { error: "Name, phone, and gender are required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(age) || age < 1) {
      return NextResponse.json(
        { error: "A valid age is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(centerId)) {
      return NextResponse.json(
        { error: "A valid center is required." },
        { status: 400 }
      );
    }

    const existingPatient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        ...(centerScopeId ? { centerId: centerScopeId } : {}),
      },
      select: { id: true },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updatedPatient = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.update({
        where: { id: patientId },
        data: {
          name,
          age,
          gender,
          phone,
          bloodGroup: cleanText(body.bloodGroup),
          location: cleanText(body.location),
          centerId,
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
        },
        include: {
          center: {
            include: {
              city: true,
            },
          },
        },
      });

      await tx.user.updateMany({
        where: { patientId },
        data: {
          name,
          phone,
          centerId,
        },
      });

      return patient;
    });

    return NextResponse.json(updatedPatient);
  } catch {
    return NextResponse.json(
      { error: "Failed to update patient profile" },
      { status: 500 }
    );
  }
}
