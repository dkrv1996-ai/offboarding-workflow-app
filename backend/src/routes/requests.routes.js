const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const { allowHRAdmin, allowViewers } = require("../middlewares/rbac.middleware");

const {
  createRequest,
  listRequests,
  getRequestById,
  hrFinalDecision,
  resendCurrentApprovalLink,
  deleteRequest,
} = require("../controllers/requests.controller");

router.use(auth);

// view-only
router.get("/", allowViewers, listRequests);
router.get("/:id", allowViewers, getRequestById);

// full access
router.post("/", allowHRAdmin, createRequest);
router.post("/:id/hr-final", allowHRAdmin, hrFinalDecision);
router.post("/:id/resend", allowHRAdmin, resendCurrentApprovalLink);
router.delete("/:id", allowHRAdmin, deleteRequest);

module.exports = router;
