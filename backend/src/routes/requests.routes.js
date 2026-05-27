const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const { createRequest, getRequestById, listRequests } = require("../controllers/requests.controller");

router.post("/", auth, createRequest);
router.get("/", auth, listRequests);           // optional dashboard list
router.get("/:id", auth, getRequestById);      // optional detail

module.exports = router;