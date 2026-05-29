const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log("Deleting location data...");

    const deleteAlerts = await prisma.geofenceAlert.deleteMany({});
    console.log(`Deleted ${deleteAlerts.count} geofence alerts.`);

    const deleteZones = await prisma.geofenceZone.deleteMany({});
    console.log(`Deleted ${deleteZones.count} geofence zones.`);

    const deleteHistory = await prisma.locationHistory.deleteMany({});
    console.log(`Deleted ${deleteHistory.count} location history records.`);

    const deleteLocations = await prisma.location.deleteMany({});
    console.log(`Deleted ${deleteLocations.count} live location records.`);

    console.log("All location data deleted successfully.");
  } catch (error) {
    console.error("Error deleting location data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
