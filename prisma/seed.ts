import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Seeding is now optional. Users can register through the app.
  // If you want to create a demo user, uncomment and configure below:
  //
  // const demoHashed = await bcrypt.hash("password123", 10);
  // await prisma.user.upsert({
  //   where: { email: "demo@example.com" },
  //   update: {},
  //   create: {
  //     name: "Demo User",
  //     email: "demo@example.com",
  //     password: demoHashed,
  //   },
  // });
  // console.log(`✅ Demo user created`);

  console.log("🎉 Seeding complete! Users can register through the app.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
