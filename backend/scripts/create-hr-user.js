const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const bcrypt = require("bcrypt");

function getPrisma() {
  const db = require("../src/db");
  return db?.prisma || db?.default || db;
}

function findUserModel(prisma) {
  // Common user model names
  const candidates = ["user", "users", "hrUser", "account", "appUser", "employee", "loginUser"];

  for (const name of candidates) {
    const m = prisma?.[name];
    if (m && typeof m.findUnique === "function" && typeof m.create === "function") return { model: m, modelName: name };
  }

  // Fallback: search for any prisma model that has findUnique + create
  for (const k of Object.keys(prisma || {})) {
    const m = prisma?.[k];
    if (m && typeof m.findUnique === "function" && typeof m.create === "function") {
      // heuristic: likely user model if it supports findUnique({ where: { email } })
      return { model: m, modelName: k };
    }
  }

  return null;
}

async function main() {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Could not load prisma from ../src/db");

  const found = findUserModel(prisma);
  if (!found) {
    console.log("❌ Could not auto-detect user model.");
    console.log("Available prisma keys:", Object.keys(prisma || {}));
    throw new Error("Please paste your Prisma schema User model or prisma keys.");
  }

  const { model, modelName } = found;
  console.log("✅ Using user model:", modelName);

  // CHANGE THESE
  const email = "";
  const password = "Password@123";
  const roleValue = "HR";

  // Check if exists (email-based)
  let existing = null;
  try {
    existing = await model.findUnique({ where: { email } });
  } catch (e) {
    console.log("⚠️ findUnique({ where: { email } }) failed. Your user model may not use email as unique key.");
    console.log("Error:", e.message);
    throw e;
  }

  if (existing) {
    console.log("User already exists:", email);
    return;
  }

  const hash = await bcrypt.hash(password, 10);

  // Try common password field names
  const dataTry = [
    { email, passwordHash: hash, role: roleValue },
    { email, password: hash, role: roleValue },
    { email, passwordHash: hash },
    { email, password: hash },
  ];

  let created = null;
  let lastErr = null;

  for (const data of dataTry) {
    try {
      created = await model.create({ data });
      break;
    } catch (e) {
      lastErr = e;
    }
  }

  if (!created) {
    console.log("❌ Could not create user with common fields.");
    console.log("Last error:", lastErr?.message);
    console.log("Hint: paste your `model User { ... }` from prisma/schema.prisma.");
    return;
  }

  console.log("✅ Created HR user:", created.email || email);
  console.log("Login with:", email, "/", password);
}

main()
  .catch((e) => {
    console.error("❌ create-hr-user failed:", e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      const prisma = getPrisma();
      if (prisma && typeof prisma.$disconnect === "function") await prisma.$disconnect();
    } catch {}
  });
