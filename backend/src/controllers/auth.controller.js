const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ONLY HR USER (as you want)
const users = [
  { id: 1, name: "HR User", email: "hr@local.com", role: "HR", passwordHash: "" }
];

// Create password hash once at server start (Password@123)
(async () => {
  for (const u of users) {
    if (!u.passwordHash) {
      u.passwordHash = await bcrypt.hash("Password@123", 10);
    }
  }
})();

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, user: { email: user.email, role: user.role, name: user.name } });
};

const me = (req, res) => {
  res.json({ user: req.user });
};

// ✅ IMPORTANT: Export as an object
module.exports = { login, me };