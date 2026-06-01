function generateRequestId() {
  return `REQ-${Date.now()}`;
}

module.exports = { generateRequestId };
