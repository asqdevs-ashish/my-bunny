import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  const users = await prisma.user.findMany({
    where: { email: { in: ["bachha@suar.com", "kuchupuchdi@suar.com"] } },
    select: { id: true, email: true, name: true },
  });
  console.log("Before:", JSON.stringify(users, null, 2));

  // Update bachha@suar.com → name "bachha"
  await prisma.user.update({
    where: { email: "bachha@suar.com" },
    data: { name: "bachha" },
  });

  // Update kuchupuchdi@suar.com → name "kuchpuchdi"
  await prisma.user.update({
    where: { email: "kuchupuchdi@suar.com" },
    data: { name: "kuchpuchdi" },
  });

  const updated = await prisma.user.findMany({
    where: { email: { in: ["bachha@suar.com", "kuchupuchdi@suar.com"] } },
    select: { id: true, email: true, name: true },
  });
  console.log("After:", JSON.stringify(updated, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
