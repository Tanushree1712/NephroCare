import { PrismaClient } from "@prisma/client";

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

async function syncIdSequence(tableName: "City" | "Center") {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"${tableName}"', 'id'),
      GREATEST(COALESCE((SELECT MAX(id) FROM "${tableName}"), 0), 1),
      true
    )
  `);
}

async function main() {
  console.log("Seeding Database...");

  await syncIdSequence("City");
  await syncIdSequence("Center");

  for (const cityEntry of cityCatalog) {
    const city = await findOrCreateCity(cityEntry.name);

    for (const center of cityEntry.centers) {
      await prisma.center.upsert({
        where: { centerCode: center.centerCode },
        update: {
          name: center.name,
          address: center.address,
          cityId: city.id,
        },
        create: {
          ...center,
          cityId: city.id,
        },
      });
    }
  }

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
