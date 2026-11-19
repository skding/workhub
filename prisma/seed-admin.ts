import { db as prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Setting up Admin User...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash,
      role: "ADMIN",
    },
    create: {
      username: "admin",
      name: "Administrator (SK)",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin account is ready!`);
  console.log(`   Username: ${admin.username}`);
  console.log(`   Password: admin123`);
}

main()
  .catch((e) => {
    console.error("Error setting up admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
