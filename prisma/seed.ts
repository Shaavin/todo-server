import { getRandomElement } from "../src/utils/getRandomElement";
import { Color, PrismaClient } from "./generated/client";

const prisma = new PrismaClient();

async function main() {
  const existingTaskCount = await prisma.task.count();
  if (existingTaskCount > 0) {
    console.log("Tasks already exist, skipping seed.");
    return;
  }

  const colors = [
    Color.RED,
    Color.ORANGE,
    Color.YELLOW,
    Color.GREEN,
    Color.BLUE,
    Color.INDIGO,
    Color.PURPLE,
    Color.PINK,
    Color.BROWN,
  ];
  await prisma.task.createMany({
    data: Array.from({ length: 20 }, (_, i) => ({
      title: `Task ${i + 1}`,
      color: getRandomElement(colors),
      completed: Math.random() < 0.3 ? new Date() : null,
    })),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
