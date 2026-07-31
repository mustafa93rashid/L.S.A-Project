const express = require("express");

const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const serviceController = require("../controllers/service.controller");

const { uploadServiceImages } = require("../middlewares/upload.middleware");

const { createServiceValidation, updateServiceValidation, idValidation, slugValidation } = require("../validation/service.validate");

// ==================================================
// Public Routes
// ==================================================

router.get("/public", asyncHandler(serviceController.getPublicServices));

router.get("/public/:slug", ...slugValidation, asyncHandler(serviceController.getPublicServiceBySlug));

// ==================================================
// Dashboard Routes
// ==================================================

router.get("/", auth, role(["superadmin", "contentManager"]), asyncHandler(serviceController.getAllServices));

router.get("/:id", auth, role(["superadmin", "contentManager"]), ...idValidation, asyncHandler(serviceController.getServiceById));

router.post("/", auth, role(["superadmin", "contentManager"]), uploadServiceImages(), ...createServiceValidation, asyncHandler(serviceController.createService));

router.patch("/:id", auth, role(["superadmin", "contentManager"]), uploadServiceImages(), ...updateServiceValidation, asyncHandler(serviceController.updateService));

router.delete("/:id", auth, role(["superadmin", "contentManager"]), ...idValidation, asyncHandler(serviceController.deleteService));

module.exports = router;