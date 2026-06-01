const bcrypt = require("bcrypt");
const prisma = require("../src/db");

async function upsertUser({ username, name, role, password }) {
  const existing = await prisma.user.findUnique({ where: { username } });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    await prisma.user.update({
      where: { username },
      data: { name, role, passwordHash, active: true }
    });
    console.log("Updated:", username);
  } else {
    await prisma.user.create({
      data: { username, name, role, passwordHash, active: true }
    });
    console.log("Created:", username);
  }
}

async function main() {
  await upsertUser({ username: "Admin", name: "Admin", role: "ADMIN", password: "Admin" });
  await upsertUser({ username: "HR", name: "HR User", role: "HR", password: "Password@123" });
  await upsertUser({ username: "Guest", name: "Guest", role: "GUEST", password: "Guest" });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    if (typeof prisma.$disconnect === "function") await prisma.$disconnect();
  });
