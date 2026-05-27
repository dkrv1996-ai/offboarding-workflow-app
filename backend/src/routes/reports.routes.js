const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const { printReport, getSummaryJson } = require("../controllers/reports.controller");

router.get("/:id/print", auth, printReport);
router.get("/:id/summary", auth, getSummaryJson); // ✅ add this

module.exports = router;