const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ✅ Hardcoded users (simple + stable)
// Login uses username + password (email kept only as metadata for notifications)
const users = [
  { id: 1, name: "HR User", username: "HR", email: "hr@local.com", role: "HR", passwordHash: "" },
  { id: 2, name: "Admin", username: "Admin", email: "admin@local.com", role: "ADMIN", passwordHash: "" },
  { id: 3, name: "Guest", username: "Guest", email: "guest@local.com", role: "GUEST", passwordHash: "" },
];

// Hash passwords once at server start
(async () => {
  for (const u of users) {
    if (!u.passwordHash) {
      const plain =
        u.username === "Admin" ? "Admin" :
        u.username === "Guest" ? "Guest" :
        "Password@123";

      u.passwordHash = await bcrypt.hash(plain, 10);
    }
  }
})();

// ✅ login accepts username (preferred). Also supports email field name from old UI.
const login = async (req, res) => {
  const { username, email, password } = req.body;

  const identifier = String(username || email || "").trim();
  if (!identifier || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const user = users.find((u) =>
    u.username.toLowerCase() === identifier.toLowerCase() ||
    (u.email && u.email.toLowerCase() === identifier.toLowerCase())
  );

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.json({
    token,
    user: { username: user.username, role: user.role, name: user.name, email: user.email }
  });
};

const me = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { login, me };
