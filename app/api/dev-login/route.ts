import { NextResponse } from "next/server";
import {
  createDevSessionValue,
  DEV_LOGIN_EMAIL,
  DEV_LOGIN_PASSWORD,
  DEV_RECEPTION_LOGIN_EMAIL,
  DEV_RECEPTION_LOGIN_PASSWORD,
  DEV_SESSION_COOKIE,
  devSessionCookieOptions,
  isDevLoginEnabled,
} from "@/lib/dev-session";
import { prisma } from "@/lib/prisma";

function normalizeCenterCode(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

function createDemoReceptionEmail(centerCode: string) {
  return `reception.${centerCode.toLowerCase()}@nephrocare.plus`;
}

async function ensureDemoCenter() {
  const existingCenter = await prisma.center.findFirst({
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      centerCode: true,
    },
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
    select: {
      id: true,
      name: true,
      centerCode: true,
    },
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
          phone: "+91 99999 99999",
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
        phone: "+91 99999 99999",
        supabaseId: "dev-demo-local-account",
        role: "PATIENT",
        centerId: center.id,
        patientId: patient.id,
      },
    });
  });
}

async function ensureDemoReceptionUser(centerCode?: string) {
  const normalizedCenterCode = normalizeCenterCode(centerCode);
  const center = normalizedCenterCode
    ? await prisma.center.findUnique({
        where: { centerCode: normalizedCenterCode },
        select: {
          id: true,
          name: true,
          centerCode: true,
        },
      })
    : await ensureDemoCenter();

  if (!center) {
    return null;
  }

  const email =
    normalizedCenterCode && normalizedCenterCode !== "DEM-C1"
      ? createDemoReceptionEmail(normalizedCenterCode)
      : DEV_RECEPTION_LOGIN_EMAIL;

  return prisma.user.upsert({
    where: { email },
    update: {
      name: `${center.name} Reception`,
      phone: "+91 88888 77777",
      supabaseId: `dev-demo-reception-${center.centerCode.toLowerCase()}`,
      role: "RECEPTIONIST",
      centerId: center.id,
      patientId: null,
    },
    create: {
      name: `${center.name} Reception`,
      email,
      phone: "+91 88888 77777",
      supabaseId: `dev-demo-reception-${center.centerCode.toLowerCase()}`,
      role: "RECEPTIONIST",
      centerId: center.id,
    },
  });
}

export async function POST(request: Request) {
  if (!isDevLoginEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      identifier?: string;
      email?: string;
      centerCode?: string;
      password?: string;
    };
    const identifier = body.identifier?.trim().toLowerCase();
    const email = (body.email ?? body.identifier)?.trim().toLowerCase();
    const centerCode = normalizeCenterCode(body.centerCode);
    const password = body.password;
    const matchesDemoIdentity =
      email === DEV_LOGIN_EMAIL || identifier === "demo patient";
    const demoReceptionEmail = centerCode
      ? createDemoReceptionEmail(centerCode)
      : DEV_RECEPTION_LOGIN_EMAIL;
    const matchesReceptionIdentity =
      email === DEV_RECEPTION_LOGIN_EMAIL ||
      identifier === "demo reception" ||
      (Boolean(centerCode) && email === demoReceptionEmail);

    if (
      (!matchesDemoIdentity || password !== DEV_LOGIN_PASSWORD) &&
      (!matchesReceptionIdentity || password !== DEV_RECEPTION_LOGIN_PASSWORD)
    ) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = matchesReceptionIdentity
      ? await ensureDemoReceptionUser(centerCode)
      : await ensureDemoUser();

    if (!user) {
      return NextResponse.json(
        { error: "That center code does not match a known demo center." },
        { status: 404 }
      );
    }
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
