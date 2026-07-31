const express = require("express");

const teamMemberController = require("../controllers/teamMember.controller");

const asyncHandler = require("../utils/asyncHandler");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const { uploadSingle } = require("../middlewares/upload.middleware");

const {
  createTeamMemberValidation,
  updateTeamMemberValidation,
  teamMemberIdValidation,
} = require("../validation/teamMember.validate");

const router = express.Router();

// ==================================================
// Public Routes
// ==================================================

router.get("/public", asyncHandler(teamMemberController.getPublicTeamMembers));

// ==================================================
// Dashboard Routes
// ==================================================

router.get("/", auth, role(["superadmin", "contentManager"]), asyncHandler(teamMemberController.getAllTeamMembers));

router.post("/", auth, role(["superadmin", "contentManager"]), uploadSingle("image"), ...createTeamMemberValidation, asyncHandler(teamMemberController.createTeamMember));

router.patch("/:id", auth, role(["superadmin", "contentManager"]), uploadSingle("image"), ...updateTeamMemberValidation, asyncHandler(teamMemberController.updateTeamMember));

router.delete("/:id", auth, role(["superadmin", "contentManager"]), ...teamMemberIdValidation, asyncHandler(teamMemberController.deleteTeamMember));

module.exports = router;