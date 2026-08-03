const express = require("express");

const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const projectController = require("../controllers/project.controller");

const { uploadProjectImages } = require("../middlewares/upload.middleware");

const { createProjectValidation, updateProjectValidation, projectIdValidation, projectSlugValidation,publicProjectQueryValidation} = require("../validation/project.validate");

// ==================== Public Routes ====================

router.get("/public", [...publicProjectQueryValidation], asyncHandler(projectController.getPublicProjects));

router.get("/public/:slug", [...projectSlugValidation], asyncHandler(projectController.getPublicProjectBySlug));

// ==================== Dashboard Routes ====================

router.get("/", [auth, role(["superadmin", "manager", "contentManager"])], asyncHandler(projectController.getAllProjects));

router.post("/", [auth, role(["superadmin", "manager", "contentManager"]), uploadProjectImages(), ...createProjectValidation], asyncHandler(projectController.createProject));

router.get("/:id", [auth, role(["superadmin", "manager", "contentManager"]), ...projectIdValidation], asyncHandler(projectController.getProjectById));

router.patch("/:id", [auth, role(["superadmin", "manager", "contentManager"]), uploadProjectImages(), ...projectIdValidation, ...updateProjectValidation], asyncHandler(projectController.updateProject));

router.delete("/:id", [auth, role(["superadmin", "manager", "contentManager"]), ...projectIdValidation], asyncHandler(projectController.deleteProject));

module.exports = router;