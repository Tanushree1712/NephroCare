import { NextResponse } from "next/server";
import {
  createDevSessionValue,
  DEV_LOGIN_EMAIL,
  DEV_LOGIN_PASSWORD,
  DEV_SESSION_COOKIE,
  devSessionCookieOptions,
  isDevLoginEnabled,
} from "@/lib/dev-session";
import { prisma } from "@/lib/prisma";

async function ensureDemoCenter() {
  const existingCenter = await prisma.center.findFirst({
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (existingCenter) {
    return existingCenter;
  }

  const existingCity = await prisma.city.findFirst({
    where: { name: "Demo City" },
    select: { id: true },
  });
  const city =
    existingCity ??
    (await prisma.city.create({
      data: { name: "Demo City" },
      select: { id: true },
    }));

  return prisma.center.upsert({
    where: { centerCode: "DEM-C1" },
    update: {},
    create: {
      name: "NephroCare Demo Center",
      address: "Developer Preview Wing",
      centerCode: "DEM-C1",
      cityId: city.id,
    },
    select: { id: true },
  });
}

async function ensureDemoUser() {
  const existingUser = await prisma.user.findUnique({
    where: { email: DEV_LOGIN_EMAIL },
    include: {
      patient: {
        select: { id: true },
      },
    },
  });

  if (existingUser?.patient) {
    return existingUser;
  }

  const center = await ensureDemoCenter();

  return prisma.$transaction(async (tx) => {
    const patient =
      existingUser?.patient ??
      (await tx.patient.create({
        data: {
          name: "Demo Patient",
          age: 30,
          gender: "other",
          phone: "+91 99999 99999",
          bloodGroup: "O+",
          location: "Nagpur",
          primaryDiagnosis: "Chronic kidney disease",
          dialysisType: "Hemodialysis",
          dialysisFrequency: "Thrice weekly",
          vascularAccess: "AV fistula",
          preferredSlot: "Morning",
          centerId: center.id,
        },
        select: { id: true },
      }));

    if (existingUser) {
      return tx.user.update({
        where: { id: existingUser.id },
        data: {
          name: "Demo Patient",
          role: "PATIENT",
          centerId: center.id,
          patientId: patient.id,
        },
      });
    }

    return tx.user.create({
      data: {
        name: "Demo Patient",
        email: DEV_LOGIN_EMAIL,
        supabaseId: "dev-demo-local-account",
        role: "PATIENT",
        centerId: center.id,
        patientId: patient.id,
      },
    });
  });
}

export async function POST(request: Request) {
  if (!isDevLoginEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (email !== DEV_LOGIN_EMAIL || password !== DEV_LOGIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = await ensureDemoUser();
    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: DEV_SESSION_COOKIE,
      value: createDevSessionValue(user.id),
      ...devSessionCookieOptions,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to start the demo session." },
      { status: 500 }
    );
  }
}
