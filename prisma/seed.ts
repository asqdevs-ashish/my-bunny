import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const myEmail = process.env.MY_EMAIL || process.env.GF_EMAIL;
  const myPassword = process.env.MY_PASSWORD || process.env.GF_PASSWORD;
  const partnerEmail = process.env.PARTNER_EMAIL;
  const partnerPassword = process.env.PARTNER_PASSWORD;

  if (!myEmail || !myPassword || !partnerEmail || !partnerPassword) {
    console.error(
      "❌ Missing environment variables. Set MY_EMAIL (or GF_EMAIL), MY_PASSWORD (or GF_PASSWORD), PARTNER_EMAIL, PARTNER_PASSWORD in .env"
    );
    process.exit(1);
  }

  // Hash passwords
  const myHashed = await bcrypt.hash(myPassword, 10);
  const partnerHashed = await bcrypt.hash(partnerPassword, 10);

  // Upsert users (update name AND password so existing DB records get renamed too)
  const me = await prisma.user.upsert({
    where: { email: myEmail },
    update: { name: "Kuchupuchdi", password: myHashed },
    create: {
      name: "Kuchupuchdi",
      email: myEmail,
      password: myHashed,
    },
  });
  console.log(`✅ User "${me.name}" (${me.email}) ready — id: ${me.id}`);

  const partner = await prisma.user.upsert({
    where: { email: partnerEmail },
    update: { name: "Bachha", password: partnerHashed },
    create: {
      name: "Bachha",
      email: partnerEmail,
      password: partnerHashed,
    },
  });
  console.log(`✅ User "${partner.name}" (${partner.email}) ready — id: ${partner.id}`);

  // If they're not linked yet, link them
  if (!me.partnerId && !partner.partnerId) {
    await prisma.user.update({
      where: { id: me.id },
      data: { partnerId: partner.id, partnerSince: new Date() },
    });
    await prisma.user.update({
      where: { id: partner.id },
      data: { partnerId: me.id, partnerSince: new Date() },
    });
    console.log("🔗 Users linked as partners!");
  } else {
    console.log("🔗 Users already linked.");
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
