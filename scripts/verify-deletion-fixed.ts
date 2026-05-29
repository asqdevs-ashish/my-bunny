const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const alerts = await prisma.geofenceAlert.count();
    const zones = await prisma.geofenceZone.count();
    const history = await prisma.locationHistory.count();
    const locations = await prisma.location.count();

    console.log({ alerts, zones, history, locations });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
