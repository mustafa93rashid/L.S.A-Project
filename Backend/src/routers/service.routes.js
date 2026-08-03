const express = require("express");
const router = express.Router();

const serviceController = require("../controllers/service.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const asyncHandler = require("../utils/asyncHandler");

const { uploadServiceImages } = require("../middlewares/upload.middleware");

const {createServiceValidation, updateServiceValidation, idValidation, slugValidation } = require("../validation/service.validate");

// ==================== Public Routes ====================

router.get("/public", asyncHandler(serviceController.getPublicServiceCards));

router.get("/public/home-capabilities", asyncHandler(serviceController.getHomeCapabilities));

router.get("/public/:slug", [...slugValidation], asyncHandler(serviceController.getPublicServiceBySlug));

// ==================== Dashboard Routes ====================

router.get("/", [auth, role(["superadmin", "manager", "contentManager"])], asyncHandler(serviceController.getAllServices));

router.post("/", [auth, role(["superadmin", "manager", "contentManager"]), uploadServiceImages(), ...createServiceValidation], asyncHandler(serviceController.createService));

router.get("/:id", [auth, role(["superadmin", "manager", "contentManager"]), ...idValidation], asyncHandler(serviceController.getServiceById));

router.patch("/:id", [auth, role(["superadmin", "manager", "contentManager"]), uploadServiceImages(), ...idValidation, ...updateServiceValidation], asyncHandler(serviceController.updateService));

router.delete("/:id", [auth, role(["superadmin", "manager", "contentManager"]), ...idValidation], asyncHandler(serviceController.deleteService));

module.exports = router;