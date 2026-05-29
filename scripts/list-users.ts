import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, partnerId: true },
  });
  console.log("All users:", JSON.stringify(users, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
