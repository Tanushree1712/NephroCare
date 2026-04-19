import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getCenterScopeId, isPatientPortalUser } from "@/lib/user-access";
import { NextResponse } from "next/server";

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// GET patients
export async function GET() {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPatientPortalUser(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const centerScopeId = getCenterScopeId(currentUser);

    const patients = await prisma.patient.findMany({
      where: centerScopeId ? { centerId: centerScopeId } : undefined,
      include: {
        center: {
          include: {
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(patients);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

// POST patient
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPatientPortalUser(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const centerScopeId = getCenterScopeId(currentUser);
    const body = await req.json();
    const name = cleanText(body.name);
    const centerId = centerScopeId ?? Number(body.centerId);
    const age = Number(body.age);

    if (!name || !Number.isFinite(centerId)) {
      return NextResponse.json(
        { error: "Name and Center are required" },
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

    const patient = await prisma.patient.create({
      data: {
        name,
        age: Number.isFinite(age) ? age : 0,
        gender: cleanText(body.gender) ?? "other",
        phone: cleanText(body.phone) ?? "",
        bloodGroup: cleanText(body.bloodGroup),
        location: cleanText(body.location),
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
    });

    return NextResponse.json(patient);
  } catch {
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
