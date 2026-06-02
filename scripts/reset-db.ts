/**
 * 🗑️ Database Reset Script
 *
 * Deletes ALL data from the database including users and all related records.
 * Use this to completely wipe the database for a fresh start.
 *
 * Usage:
 *   npm run db:reset
 *
 * ⚠️ WARNING: This is irreversible! All users and their data will be deleted.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log("\n⚠️  WARNING: You are about to delete ALL data from the database!");
  console.log("   This includes all users, messages, memories, and settings.\n");

  // Double-check with a prompt if running in terminal
  const args = process.argv.slice(2);
  const force = args.includes("--force") || args.includes("-f");
  if (!force) {
    console.log("   To proceed without confirmation, run with --force or -f flag.");
    console.log("   Example: npm run db:reset -- --force\n");

    // Simple confirmation via readline
    const { createInterface } = await import("readline");
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question("   Are you sure you want to delete EVERYTHING? (yes/no): ", resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== "yes") {
      console.log("❌ Operation cancelled.");
      await prisma.$disconnect();
      process.exit(0);
    }
  }

  try {
    console.log("\n🔄 Deleting all data...\n");

    // Delete in reverse dependency order to avoid foreign key conflicts
    console.log("   ✗ Deleting geofence alerts...");
    await prisma.geofenceAlert.deleteMany();

    console.log("   ✗ Deleting geofence zones...");
    await prisma.geofenceZone.deleteMany();

    console.log("   ✗ Deleting location history...");
    await prisma.locationHistory.deleteMany();

    console.log("   ✗ Deleting locations...");
    await prisma.location.deleteMany();

    console.log("   ✗ Deleting love plant achievements...");
    await prisma.lovePlantAchievement.deleteMany();

    console.log("   ✗ Deleting love plant daily snapshots...");
    await prisma.lovePlantDailySnapshot.deleteMany();

    console.log("   ✗ Deleting love plants...");
    await prisma.lovePlant.deleteMany();

    console.log("   ✗ Deleting secret notes...");
    await prisma.secretNote.deleteMany();

    console.log("   ✗ Deleting chat messages...");
    await prisma.chatMessage.deleteMany();

    console.log("   ✗ Deleting memories...");
    await prisma.memory.deleteMany();

    console.log("   ✗ Deleting love notes...");
    await prisma.loveNote.deleteMany();

    console.log("   ✗ Deleting water logs...");
    await prisma.waterLog.deleteMany();

    console.log("   ✗ Deleting user moods...");
    await prisma.userMood.deleteMany();

    console.log("   ✗ Deleting meal logs...");
    await prisma.mealLog.deleteMany();

    console.log("   ✗ Deleting users...");
    await prisma.user.deleteMany();

    console.log("\n✅ All data has been deleted successfully!");
    console.log("   The database is now completely empty.\n");
  } catch (error) {
    console.error("\n❌ Failed to delete data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
