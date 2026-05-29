const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  const users = await prisma.user.findMany({
    where: {
      email: { in: ["bachha@suar.com", "kuchupkuchupdi@suar.com"] },
    },
    select: { id: true, email: true, name: true, partnerId: true },
  });

  console.log("Current users:", JSON.stringify(users, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
