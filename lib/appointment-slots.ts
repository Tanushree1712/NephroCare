export const INDIA_UTC_OFFSET_MINUTES = 330;
const INDIA_OFFSET_MS = INDIA_UTC_OFFSET_MINUTES * 60 * 1000;

export type AppointmentSlot = "MORNING" | "AFTERNOON" | "EVENING";

export const APPOINTMENT_SLOT_OPTIONS: Array<{
  slot: AppointmentSlot;
  label: string;
  description: string;
  timeValue: string;
  startHour: number;
}> = [
  {
    slot: "MORNING",
    label: "Morning",
    description: "8:00 AM to 12:00 PM",
    timeValue: "08:00",
    startHour: 8,
  },
  {
    slot: "AFTERNOON",
    label: "Afternoon",
    description: "12:00 PM to 4:00 PM",
    timeValue: "12:00",
    startHour: 12,
  },
  {
    slot: "EVENING",
    label: "Evening",
    description: "4:00 PM to 8:00 PM",
    timeValue: "16:00",
    startHour: 16,
  },
];

export function isAppointmentSlot(value: string): value is AppointmentSlot {
  return APPOINTMENT_SLOT_OPTIONS.some((option) => option.slot === value);
}

export function getAppointmentSlotOption(slot: AppointmentSlot) {
  return APPOINTMENT_SLOT_OPTIONS.find((option) => option.slot === slot) ?? APPOINTMENT_SLOT_OPTIONS[0];
}

export function getAppointmentSlotLabel(slot: AppointmentSlot) {
  const option = getAppointmentSlotOption(slot);
  return `${option.label}, ${option.description}`;
}

export function getAppointmentSlotFromTimeValue(timeValue: string): AppointmentSlot | null {
  return APPOINTMENT_SLOT_OPTIONS.find((option) => option.timeValue === timeValue)?.slot ?? null;
}

function shiftDateToIndia(date: Date) {
  return new Date(date.getTime() + INDIA_OFFSET_MS);
}

export function getIndiaDateKey(date: Date) {
  const shifted = shiftDateToIndia(date);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getIndiaDayRange(referenceDate: Date) {
  const shifted = shiftDateToIndia(referenceDate);
  const startUtc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  );

  return {
    start: new Date(startUtc - INDIA_OFFSET_MS),
    end: new Date(startUtc + 24 * 60 * 60 * 1000 - INDIA_OFFSET_MS),
  };
}

export function getAppointmentSlotFromDate(date: Date): AppointmentSlot {
  const shifted = shiftDateToIndia(date);
  const hour = shifted.getUTCHours();

  if (hour < 12) {
    return "MORNING";
  }

  if (hour < 16) {
    return "AFTERNOON";
  }

  return "EVENING";
}

export function buildScheduledAppointmentDate(dateKey: string, slot: AppointmentSlot) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const option = getAppointmentSlotOption(slot);
  const utcValue = Date.UTC(year, month - 1, day, option.startHour, 0) - INDIA_OFFSET_MS;

  return new Date(utcValue);
}
