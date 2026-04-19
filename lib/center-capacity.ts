import type { Prisma, PrismaClient } from "@prisma/client";
import { getIndiaDayRange, type AppointmentSlot } from "@/lib/appointment-slots";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type CenterBookingAvailability = {
  slot: AppointmentSlot;
  scheduledCount: number;
  machineCapacity: number;
  staffCapacity: number;
  totalCapacity: number;
  remainingCapacity: number;
  availableStaffCount: number;
  availableMachineCount: number;
  nextMachineId: number | null;
  canBook: boolean;
};

export type CenterOperationsSummary = {
  totalMachines: number;
  readyMachines: number;
  maintenanceMachines: number;
  bookedMachinesToday: number;
  totalAppointmentsToday: number;
  totalStaff: number;
  staffAvailableToday: number;
};

export async function getCenterBookingAvailability(
  db: DbClient,
  {
    centerId,
    scheduledAt,
    slot,
  }: {
    centerId: number;
    scheduledAt: Date;
    slot: AppointmentSlot;
  }
): Promise<CenterBookingAvailability> {
  const { start, end } = getIndiaDayRange(scheduledAt);

  const [machines, staff, scheduledAppointments] = await Promise.all([
    db.machine.findMany({
      where: {
        centerId,
        isActive: true,
        status: "available",
      },
      select: {
        id: true,
      },
      orderBy: {
        code: "asc",
      },
    }),
    db.staffMember.findMany({
      where: {
        centerId,
        isActive: true,
        isAvailableToday: true,
        availableSlots: {
          has: slot,
        },
      },
      select: {
        id: true,
        capacityPerSlot: true,
      },
      orderBy: {
        code: "asc",
      },
    }),
    db.appointment.findMany({
      where: {
        centerId,
        status: "scheduled",
        slot,
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        id: true,
        machineId: true,
      },
    }),
  ]);

  const machineCapacity = machines.length;
  const staffCapacity = staff.reduce((total, member) => total + member.capacityPerSlot, 0);
  const totalCapacity = Math.min(machineCapacity, staffCapacity);
  const scheduledCount = scheduledAppointments.length;
  const remainingCapacity = Math.max(totalCapacity - scheduledCount, 0);
  const bookedMachineIds = new Set(
    scheduledAppointments
      .map((appointment) => appointment.machineId)
      .filter((machineId): machineId is number => typeof machineId === "number")
  );
  const nextMachineId =
    machines.find((machine) => !bookedMachineIds.has(machine.id))?.id ?? null;

  return {
    slot,
    scheduledCount,
    machineCapacity,
    staffCapacity,
    totalCapacity,
    remainingCapacity,
    availableStaffCount: staff.length,
    availableMachineCount: machineCapacity,
    nextMachineId,
    canBook: remainingCapacity > 0,
  };
}

export async function getCenterOperationsSummary(
  db: DbClient,
  {
    centerId,
    referenceDate = new Date(),
  }: {
    centerId: number;
    referenceDate?: Date;
  }
): Promise<CenterOperationsSummary> {
  const { start, end } = getIndiaDayRange(referenceDate);

  const [totalMachines, readyMachines, maintenanceMachines, totalStaff, staffAvailableToday, appointmentsToday] =
    await Promise.all([
      db.machine.count({
        where: {
          centerId,
          isActive: true,
        },
      }),
      db.machine.count({
        where: {
          centerId,
          isActive: true,
          status: "available",
        },
      }),
      db.machine.count({
        where: {
          centerId,
          isActive: true,
          status: "maintenance",
        },
      }),
      db.staffMember.count({
        where: {
          centerId,
          isActive: true,
        },
      }),
      db.staffMember.count({
        where: {
          centerId,
          isActive: true,
          isAvailableToday: true,
        },
      }),
      db.appointment.findMany({
        where: {
          centerId,
          status: "scheduled",
          date: {
            gte: start,
            lt: end,
          },
        },
        select: {
          id: true,
          machineId: true,
        },
      }),
    ]);

  const bookedMachinesToday = Math.min(
    readyMachines,
    new Set(
      appointmentsToday
        .map((appointment) => appointment.machineId)
        .filter((machineId): machineId is number => typeof machineId === "number")
    ).size || appointmentsToday.length
  );

  return {
    totalMachines,
    readyMachines,
    maintenanceMachines,
    bookedMachinesToday,
    totalAppointmentsToday: appointmentsToday.length,
    totalStaff,
    staffAvailableToday,
  };
}
