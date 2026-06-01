const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const { allowViewers } = require("../middlewares/rbac.middleware");
const { printReport, getSummaryJson } = require("../controllers/reports.controller");

router.use(auth);
router.get("/:id/print", allowViewers, printReport);
router.get("/:id/summary", allowViewers, getSummaryJson);

module.exports = router;
