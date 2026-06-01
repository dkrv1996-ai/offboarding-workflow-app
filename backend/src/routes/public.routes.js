const express = require("express");
const router = express.Router();

const { getApproveInfo, submitApproval } = require("../controllers/public.controller");

router.get("/approve/:token", getApproveInfo);
router.post("/approve/:token", submitApproval);

module.exports = router;
