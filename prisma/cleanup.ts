import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Cleaning up testing data...");

  // Order matters due to foreign key relations
  await prisma.chatMessage.deleteMany({});
  console.log("✅ Chat messages deleted");

  await prisma.secretNote.deleteMany({});
  console.log("✅ Secret notes deleted");

  await prisma.memory.deleteMany({});
  console.log("✅ Memories deleted");

  await prisma.mealLog.deleteMany({});
  console.log("✅ Meal logs deleted");

  await prisma.userMood.deleteMany({});
  console.log("✅ Mood logs deleted");

  await prisma.waterLog.deleteMany({});
  console.log("✅ Water logs deleted");

  await prisma.loveNote.deleteMany({});
  console.log("✅ System love notes deleted");

  console.log("\n✨ DATABASE IS NOW CLEAN! Ready for fresh start. 💕");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
