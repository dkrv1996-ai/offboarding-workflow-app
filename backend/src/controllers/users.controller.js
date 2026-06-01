const bcrypt = require("bcrypt");
const prisma = require("../db");

// list users (no passwordHash)
exports.listUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
      createdAt: true
    }
  });
  res.json(users);
};

// create user
exports.createUser = async (req, res) => {
  const username = String(req.body.username || "").trim();
  const name = String(req.body.name || "").trim();
  const role = String(req.body.role || "").trim(); // ADMIN | HR | GUEST
  const password = String(req.body.password || "");

  if (!username || !name || !role || !password) {
    return res.status(400).json({ message: "username, name, role, password are required" });
  }

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return res.status(409).json({ message: "Username already exists" });

  const passwordHash = await bcrypt.hash(password, 10); // bcrypt hash [1](https://github.com/prisma/prisma/issues/28118)[2](https://www.w3tutorials.net/blog/prisma-nodejs/)

  const created = await prisma.user.create({
    data: { username, name, role, passwordHash, active: true }
  });

  res.status(201).json({
    id: created.id,
    username: created.username,
    name: created.name,
    role: created.role,
    active: created.active
  });
};

// enable/disable user
exports.setActive = async (req, res) => {
  const id = Number(req.params.id);
  const active = Boolean(req.body.active);

  const updated = await prisma.user.update({
    where: { id },
    data: { active }
  });

  res.json({ id: updated.id, active: updated.active });
};

// reset password
exports.resetPassword = async (req, res) => {
  const id = Number(req.params.id);
  const password = String(req.body.password || "");

  if (!password) return res.status(400).json({ message: "password is required" });

  const passwordHash = await bcrypt.hash(password, 10); // bcrypt hash [1](https://github.com/prisma/prisma/issues/28118)[2](https://www.w3tutorials.net/blog/prisma-nodejs/)

  await prisma.user.update({
    where: { id },
    data: { passwordHash }
  });

  res.json({ message: "Password reset" });
};

// change role
exports.updateRole = async (req, res) => {
  const id = Number(req.params.id);
  const role = String(req.body.role || "").trim();

  if (!role) return res.status(400).json({ message: "role is required" });

  const updated = await prisma.user.update({
    where: { id },
    data: { role }
  });

  res.json({ id: updated.id, role: updated.role });
};
``
