import { NextResponse } from "next/server";
import { getAppointmentSlotLabel, isAppointmentSlot, buildScheduledAppointmentDate } from "@/lib/appointment-slots";
import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { getCenterBookingAvailability } from "@/lib/center-capacity";
import { getCenterScopeId } from "@/lib/user-access";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const centerId = Number(url.searchParams.get("centerId"));
    const dateKey = url.searchParams.get("date")?.trim() ?? "";
    const slotValue = url.searchParams.get("slot")?.trim().toUpperCase() ?? "";
    const centerScopeId = getCenterScopeId(currentUser);

    if (!Number.isInteger(centerId) || centerId < 1 || !dateKey || !isAppointmentSlot(slotValue)) {
      return NextResponse.json(
        { error: "Center, date, and slot are required." },
        { status: 400 }
      );
    }

    if (centerScopeId && centerScopeId !== centerId) {
      return NextResponse.json(
        { error: "You can only review availability for your assigned center." },
        { status: 403 }
      );
    }

    const scheduledAt = buildScheduledAppointmentDate(dateKey, slotValue);

    if (!scheduledAt) {
      return NextResponse.json({ error: "Invalid booking date." }, { status: 400 });
    }

    const center = await prisma.center.findUnique({
      where: { id: centerId },
      include: {
        city: true,
      },
    });

    if (!center) {
      return NextResponse.json({ error: "Center not found." }, { status: 404 });
    }

    const availability = await getCenterBookingAvailability(prisma, {
      centerId,
      scheduledAt,
      slot: slotValue,
    });

    return NextResponse.json({
      center: {
        id: center.id,
        name: center.name,
        city: center.city.name,
        centerCode: center.centerCode,
      },
      date: dateKey,
      slotLabel: getAppointmentSlotLabel(slotValue),
      ...availability,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load center availability." },
      { status: 500 }
    );
  }
}
