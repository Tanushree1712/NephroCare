import type { AppointmentSlot } from "@/lib/appointment-slots";

export type CenterMachineSeedStatus = "available" | "maintenance";

export type CenterMachineSeed = {
  code: string;
  model: string;
  manufacturer: string;
  status: CenterMachineSeedStatus;
  notes: string;
};

export type CenterStaffSeed = {
  code: string;
  name: string;
  role: string;
  specialization: string;
  phone: string;
  shiftLabel: string;
  availableSlots: AppointmentSlot[];
  capacityPerSlot: number;
  isAvailableToday: boolean;
};

const machineCatalog = [
  { model: "Fresenius 4008S", manufacturer: "Fresenius Medical Care" },
  { model: "Dialog+", manufacturer: "B. Braun" },
  { model: "Surdial X", manufacturer: "Nipro" },
  { model: "Artis Physio Plus", manufacturer: "Baxter" },
  { model: "DBB-EXA", manufacturer: "Nikkiso" },
  { model: "W-T6008S", manufacturer: "Wego" },
] as const;

const machineNotes = {
  available: [
    "Ready for scheduled sessions.",
    "Prepared and calibrated for the current queue.",
    "Cleared for patient booking today.",
    "Open for the next confirmed dialysis slot.",
  ],
  maintenance: [
    "Preventive maintenance in progress.",
    "Cleaning and tubing checks underway.",
    "Reserved for service review.",
    "Calibration window before the next release.",
  ],
} as const;

const staffTemplates = [
  {
    role: "Consultant nephrologist",
    specialization: "Dialysis planning",
    shiftLabel: "7:00 AM - 3:00 PM",
    availableSlots: ["MORNING", "AFTERNOON"],
    capacityPerSlot: 2,
    names: ["Dr. Aarav Kulkarni", "Dr. Meera Shah", "Dr. Rohan Joshi", "Dr. Anika Patil"],
  },
  {
    role: "Duty physician",
    specialization: "Renal monitoring",
    shiftLabel: "12:00 PM - 8:00 PM",
    availableSlots: ["AFTERNOON", "EVENING"],
    capacityPerSlot: 2,
    names: ["Dr. Kunal Deshmukh", "Dr. Nisha Menon", "Dr. Vihaan Sinha", "Dr. Aditi Rao"],
  },
  {
    role: "Lead dialysis nurse",
    specialization: "Chairside supervision",
    shiftLabel: "6:30 AM - 2:30 PM",
    availableSlots: ["MORNING", "AFTERNOON"],
    capacityPerSlot: 2,
    names: ["Nurse Sneha Kulkarni", "Nurse Priya Nair", "Nurse Kavya Salvi", "Nurse Ritu Sharma"],
  },
  {
    role: "Dialysis nurse",
    specialization: "Cannulation and observation",
    shiftLabel: "7:00 AM - 3:00 PM",
    availableSlots: ["MORNING", "AFTERNOON"],
    capacityPerSlot: 2,
    names: ["Nurse Sana Sheikh", "Nurse Isha Tiwari", "Nurse Rhea Gupta", "Nurse Tanya Wagh"],
  },
  {
    role: "Dialysis nurse",
    specialization: "Second shift coverage",
    shiftLabel: "1:00 PM - 9:00 PM",
    availableSlots: ["AFTERNOON", "EVENING"],
    capacityPerSlot: 2,
    names: ["Nurse Bhavna More", "Nurse Pooja Kale", "Nurse Reshma Khan", "Nurse Charu Dutta"],
  },
  {
    role: "Biomedical technician",
    specialization: "Machine checks and setup",
    shiftLabel: "8:00 AM - 4:00 PM",
    availableSlots: ["MORNING", "AFTERNOON"],
    capacityPerSlot: 1,
    names: ["Arjun Patil", "Siddharth Jain", "Neel Verma", "Harsh Goyal"],
  },
  {
    role: "Reception coordinator",
    specialization: "Front desk and patient intake",
    shiftLabel: "8:30 AM - 5:30 PM",
    availableSlots: ["MORNING", "AFTERNOON", "EVENING"],
    capacityPerSlot: 1,
    names: ["Mitali Desai", "Ananya Kulshrestha", "Rhea Das", "Pallavi Mhatre"],
  },
  {
    role: "Floor support",
    specialization: "Patient movement and supplies",
    shiftLabel: "9:00 AM - 6:00 PM",
    availableSlots: ["MORNING", "AFTERNOON", "EVENING"],
    capacityPerSlot: 1,
    names: ["Rahul Pawar", "Vikram Sable", "Nitin Bhagat", "Yash Trivedi"],
  },
] as const;

function createSeed(centerCode: string) {
  return centerCode.split("").reduce((total, character, index) => {
    return total + character.charCodeAt(0) * (index + 1);
  }, 0);
}

function pickValue<T>(items: readonly T[], seed: number, index: number) {
  return items[(seed + index) % items.length];
}

function buildContactNumber(seed: number, index: number) {
  const suffix = String((seed * 37 + index * 211) % 1_000_000).padStart(6, "0");
  return `+91 98${String(seed % 100).padStart(2, "0")}${suffix}`;
}

export function generateCenterMachineSeed(centerCode: string) {
  const seed = createSeed(centerCode);
  const totalMachines = 5 + (seed % 3);
  const maintenanceMachines = seed % 2;

  return Array.from({ length: totalMachines }, (_, index) => {
    const machine = pickValue(machineCatalog, seed, index);
    const status: CenterMachineSeedStatus =
      index >= totalMachines - maintenanceMachines ? "maintenance" : "available";

    return {
      code: `${centerCode}-M${String(index + 1).padStart(2, "0")}`,
      model: machine.model,
      manufacturer: machine.manufacturer,
      status,
      notes: pickValue(machineNotes[status], seed, index),
    } satisfies CenterMachineSeed;
  });
}

export function generateCenterStaffSeed(centerCode: string) {
  const seed = createSeed(centerCode);
  const totalStaff = 6 + (seed % 3);
  const availableToday = 4 + (seed % 2);

  return Array.from({ length: totalStaff }, (_, index) => {
    const template = staffTemplates[index];

    return {
      code: `${centerCode}-S${String(index + 1).padStart(2, "0")}`,
      name: pickValue(template.names, seed, index),
      role: template.role,
      specialization: template.specialization,
      phone: buildContactNumber(seed, index),
      shiftLabel: template.shiftLabel,
      availableSlots: [...template.availableSlots],
      capacityPerSlot: template.capacityPerSlot,
      isAvailableToday: index < availableToday,
    } satisfies CenterStaffSeed;
  });
}
