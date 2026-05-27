const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { sendMail } = require("../services/email.service");
console.log("typeof sendMail =", typeof sendMail);


// HR only test endpoint
router.post("/", auth, async (req, res) => {
  const { to } = req.body;

  try {
    const info = await sendMail({
      to,
      subject: "SMTP Test - Offboarding App",
      html: "<b>If you received this, SMTP is working ✅</b>"
    });

    res.json({ ok: true, messageId: info.messageId || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;