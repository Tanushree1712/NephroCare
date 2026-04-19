import { PrismaClient } from "@prisma/client";
import {
  generateCenterMachineSeed,
  generateCenterStaffSeed,
} from "../lib/center-operations";

const prisma = new PrismaClient();

const cityCatalog = [
  {
    name: "Nagpur",
    centers: [
      {
        name: "NephroCare Central",
        address: "Medical Square, Nagpur",
        centerCode: "NAG-C1",
      },
      {
        name: "NephroCare West",
        address: "Dharampeth, Nagpur",
        centerCode: "NAG-C2",
      },
      {
        name: "NephroCare South",
        address: "Wardha Road, Nagpur",
        centerCode: "NAG-C3",
      },
    ],
  },
  {
    name: "Amravati",
    centers: [
      {
        name: "NephroCare Amravati Main",
        address: "Camp Road, Amravati",
        centerCode: "AMR-C1",
      },
      {
        name: "NephroCare Rajapeth",
        address: "Rajapeth, Amravati",
        centerCode: "AMR-C2",
      },
      {
        name: "NephroCare Badnera",
        address: "Badnera Road, Amravati",
        centerCode: "AMR-C3",
      },
    ],
  },
  {
    name: "Chandrapur",
    centers: [
      {
        name: "NephroCare Chandrapur Central",
        address: "Civil Lines, Chandrapur",
        centerCode: "CHD-C1",
      },
      {
        name: "NephroCare Ballarpur Road",
        address: "Ballarpur Road, Chandrapur",
        centerCode: "CHD-C2",
      },
      {
        name: "NephroCare Warora Link",
        address: "Warora Naka, Chandrapur",
        centerCode: "CHD-C3",
      },
    ],
  },
  {
    name: "Pune",
    centers: [
      {
        name: "NephroCare Shivajinagar",
        address: "Shivajinagar, Pune",
        centerCode: "PUN-C1",
      },
      {
        name: "NephroCare Kharadi",
        address: "Kharadi, Pune",
        centerCode: "PUN-C2",
      },
      {
        name: "NephroCare Baner",
        address: "Baner, Pune",
        centerCode: "PUN-C3",
      },
    ],
  },
  {
    name: "Mumbai",
    centers: [
      {
        name: "NephroCare Andheri",
        address: "Andheri East, Mumbai",
        centerCode: "MUM-C1",
      },
      {
        name: "NephroCare Dadar",
        address: "Dadar West, Mumbai",
        centerCode: "MUM-C2",
      },
      {
        name: "NephroCare Navi Mumbai",
        address: "Vashi, Navi Mumbai",
        centerCode: "MUM-C3",
      },
    ],
  },
];

async function findOrCreateCity(name: string) {
  const existingCity = await prisma.city.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (existingCity) {
    return existingCity;
  }

  return prisma.city.create({
    data: { name },
  });
}

async function syncIdSequence(
  tableName: "City" | "Center" | "Machine" | "StaffMember"
) {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"${tableName}"', 'id'),
      GREATEST(COALESCE((SELECT MAX(id) FROM "${tableName}"), 0), 1),
      true
    )
  `);
}

async function seedCenterOperations(centerId: number, centerCode: string) {
  const machineSeed = generateCenterMachineSeed(centerCode);
  const staffSeed = generateCenterStaffSeed(centerCode);

  for (const machine of machineSeed) {
    await prisma.machine.upsert({
      where: {
        centerId_code: {
          centerId,
          code: machine.code,
        },
      },
      update: {
        model: machine.model,
        manufacturer: machine.manufacturer,
        status: machine.status,
        notes: machine.notes,
        isActive: true,
      },
      create: {
        centerId,
        code: machine.code,
        model: machine.model,
        manufacturer: machine.manufacturer,
        status: machine.status,
        notes: machine.notes,
      },
    });
  }

  for (const staffMember of staffSeed) {
    await prisma.staffMember.upsert({
      where: {
        centerId_code: {
          centerId,
          code: staffMember.code,
        },
      },
      update: {
        name: staffMember.name,
        role: staffMember.role,
        specialization: staffMember.specialization,
        phone: staffMember.phone,
        shiftLabel: staffMember.shiftLabel,
        availableSlots: staffMember.availableSlots,
        capacityPerSlot: staffMember.capacityPerSlot,
        isAvailableToday: staffMember.isAvailableToday,
        isActive: true,
      },
      create: {
        centerId,
        code: staffMember.code,
        name: staffMember.name,
        role: staffMember.role,
        specialization: staffMember.specialization,
        phone: staffMember.phone,
        shiftLabel: staffMember.shiftLabel,
        availableSlots: staffMember.availableSlots,
        capacityPerSlot: staffMember.capacityPerSlot,
        isAvailableToday: staffMember.isAvailableToday,
      },
    });
  }
}

async function main() {
  console.log("Seeding Database...");

  await syncIdSequence("City");
  await syncIdSequence("Center");

  for (const cityEntry of cityCatalog) {
    const city = await findOrCreateCity(cityEntry.name);

    for (const centerDefinition of cityEntry.centers) {
      const center = await prisma.center.upsert({
        where: { centerCode: centerDefinition.centerCode },
        update: {
          name: centerDefinition.name,
          address: centerDefinition.address,
          cityId: city.id,
        },
        create: {
          ...centerDefinition,
          cityId: city.id,
        },
      });

      await seedCenterOperations(center.id, center.centerCode);
    }
  }

  await syncIdSequence("Machine");
  await syncIdSequence("StaffMember");

  console.log("Seeding applied successfully! Database is ready to use.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
