const express = require("express");
const router = express.Router();

const { login, me } = require("../controllers/auth.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/login", login);
router.get("/me", auth, me);

module.exports = router;
