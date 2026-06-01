const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/rbac.middleware");
const ctrl = require("../controllers/users.controller");

router.use(auth);
router.use(allowRoles("ADMIN")); // âœ… Admin-only

router.get("/", ctrl.listUsers);
router.post("/", ctrl.createUser);
router.patch("/:id/active", ctrl.setActive);
router.patch("/:id/role", ctrl.updateRole);
router.post("/:id/reset-password", ctrl.resetPassword);

module.exports = router;
