const express = require("express");

const teamMemberController = require("../controllers/teamMember.controller");

const asyncHandler = require("../utils/asyncHandler");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const { uploadTeamMemberImage } = require("../middlewares/upload.middleware");

const {createTeamMemberValidation, updateTeamMemberValidation, teamMemberIdValidation } = require("../validation/teamMember.validate");

const router = express.Router();

// ==================== Public Routes ====================

router.get("/public", asyncHandler(teamMemberController.getPublicTeamMembers));

// ==================== Dashboard Routes ====================

router.get("/", [auth, role(["superadmin", "manager", "contentManager"])], asyncHandler(teamMemberController.getAllTeamMembers));

router.post("/", [auth, role(["superadmin", "manager", "contentManager"]), uploadTeamMemberImage(), ...createTeamMemberValidation], asyncHandler(teamMemberController.createTeamMember));

router.patch("/:id", [auth, role(["superadmin", "manager", "contentManager"]), uploadTeamMemberImage(), ...teamMemberIdValidation, ...updateTeamMemberValidation], asyncHandler(teamMemberController.updateTeamMember));

router.delete("/:id", [auth, role(["superadmin", "manager", "contentManager"]), ...teamMemberIdValidation], asyncHandler(teamMemberController.deleteTeamMember));

module.exports = router;