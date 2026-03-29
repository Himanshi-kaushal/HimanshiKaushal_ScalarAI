import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "demo@example.com",
      name: "Demo Host",
    },
  });

  const event = await prisma.eventType.create({
    data: {
      userId: user.id,
      title: "30 Minute Meeting",
      slug: "30min",
      duration: 30,
      description: "Quick sync — powered by cal-clone.",
    },
  });

  for (const dayOfWeek of [1, 2, 3, 4, 5]) {
    await prisma.availability.create({
      data: {
        eventTypeId: event.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
      },
    });
  }

  console.log("Seeded user id (use in dashboard):", user.id);
  console.log("Public booking URL slug:", event.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
