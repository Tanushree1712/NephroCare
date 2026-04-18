import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cities = ["Nagpur", "Amravati", "Chandrapur", "Akola"];

  for (const cityName of cities) {
    const city = await prisma.city.upsert({
      where: { name: cityName },
      update: {},
      create: { name: cityName },
    });

    for (let i = 1; i <= 3; i++) {
      await prisma.center.upsert({
        where: { centerCode: `${cityName.slice(0, 3).toUpperCase()}-C${i}` },
        update: {},
        create: {
          name: `NephroCare+ ${cityName} Center ${i}`,
          centerCode: `${cityName.slice(0, 3).toUpperCase()}-C${i}`,
          cityId: city.id,
        },
      });
    }
  }
}

main()
  .then(() => console.log("Seeded 🌱"))
  .catch(console.error)
  .finally(() => prisma.$disconnect());