const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const asyncHandler = require("../utils/asyncHandler");
const { uploadSingle } = require("../middlewares/upload.middleware");

const {updateProfileValidation, createUserValidation, userIdValidation, updateUserStatusValidation, updateUserRoleValidation} = require("../validation/user.validate");

// ==================== Current User ====================

router.get("/profile", [auth], asyncHandler(userController.getProfile));

router.patch("/profile", [auth, uploadSingle("avatar"), ...updateProfileValidation], asyncHandler(userController.updateProfile));

router.delete("/profile/image", [auth], asyncHandler(userController.deleteProfileImage));

// ==================== Super Admin ====================

router.get("/", [auth, role(["superadmin"])], asyncHandler(userController.getAllUsers));

router.post("/", [auth, role(["superadmin"]), ...createUserValidation], asyncHandler(userController.createUser));

router.post("/activate-account",asyncHandler(userController.activateAccount));

router.get("/:id", [auth, role(["superadmin"]), ...userIdValidation], asyncHandler(userController.getUserById));

router.patch("/:id/status", [auth, role(["superadmin"]), ...updateUserStatusValidation], asyncHandler(userController.updateUserStatus));

router.patch("/:id/role", [auth, role(["superadmin"]), ...updateUserRoleValidation], asyncHandler(userController.updateUserRole));

router.delete("/:id", [auth, role(["superadmin"]), ...userIdValidation], asyncHandler(userController.deleteUser));

module.exports = router;