const express = require("express");

const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const projectController = require("../controllers/project.controller");
const { uploadProjectImages } = require("../middlewares/upload.middleware");
const { createProjectValidation, updateProjectValidation, idValidation, slugValidation } = require("../validation/project.validate");

// 
router.get("/public", asyncHandler(projectController.getPublicProjects));

router.get("/public/:slug", ...slugValidation, asyncHandler(projectController.getPublicProjectBySlug));

router.get("/", auth, role(["superadmin", "contentManager"]), asyncHandler(projectController.getAllProjects));

router.post("/", auth, role(["superadmin", "contentManager"]), uploadProjectImages(), ...createProjectValidation, asyncHandler(projectController.createProject));

router.get("/:id", auth, role(["superadmin", "contentManager"]), ...idValidation, asyncHandler(projectController.getProjectById));

router.patch("/:id", auth, role(["superadmin", "contentManager"]), uploadProjectImages(), ...updateProjectValidation, asyncHandler(projectController.updateProject));

router.delete("/:id", auth, role(["superadmin", "contentManager"]), ...idValidation, asyncHandler(projectController.deleteProject));

module.exports = router;