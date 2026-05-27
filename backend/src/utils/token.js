const crypto = require("crypto");

function generateToken() {
  return crypto.randomBytes(24).toString("hex"); // long secure token
}

module.exports = { generateToken };