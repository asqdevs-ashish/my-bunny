const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

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
  }
}

main().catch(console.error);
