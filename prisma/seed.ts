import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Database...");

  // 1. Create Cities
  const nagpur = await prisma.city.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "Nagpur" }
  });

  const amravati = await prisma.city.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: "Amravati" }
  });

  // 2. Create Centers
  const centersData = [
    { name: "NephroCare Central", address: "Medical Square, Nagpur", centerCode: "NAG-C1", cityId: nagpur.id },
    { name: "NephroCare West", address: "Dharampeth, Nagpur", centerCode: "NAG-C2", cityId: nagpur.id },
    { name: "NephroCare South", address: "Wardha Road, Nagpur", centerCode: "NAG-C3", cityId: nagpur.id },
    { name: "NephroCare Amravati Main", address: "Camp Road, Amravati", centerCode: "AMR-C1", cityId: amravati.id },
    { name: "NephroCare Rajapeth", address: "Rajapeth, Amravati", centerCode: "AMR-C2", cityId: amravati.id }
  ];

  for (const center of centersData) {
    await prisma.center.upsert({
      where: { centerCode: center.centerCode },
      update: {},
      create: center
    });
  }

  console.log("Seeding applied successfully! Database is ready to use.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
