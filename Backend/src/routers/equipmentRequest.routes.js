const express = require("express");

const router = express.Router();

const equipmentRequestController = require("../controllers/equipmentRequest.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const asyncHandler = require("../utils/asyncHandler");

const {
  createEquipmentRequestValidation,
  updateEquipmentRequestStatusValidation,
  equipmentRequestIdValidation,
  equipmentRequestQueryValidation,
} = require("../validation/equipmentRequest.validate");

// ==================== Public Routes ====================

router.post("/", [...createEquipmentRequestValidation], asyncHandler(equipmentRequestController.createEquipmentRequest));

// ==================== Dashboard Routes ====================

router.get("/", [auth, role(["superadmin", "manager", "equipmentManager"]), ...equipmentRequestQueryValidation], asyncHandler(equipmentRequestController.getAllEquipmentRequests));

router.get("/statistics", [auth, role(["superadmin", "manager", "equipmentManager"])], asyncHandler(equipmentRequestController.getEquipmentRequestStatistics));

router.get("/:id", [auth, role(["superadmin", "manager", "equipmentManager"]), ...equipmentRequestIdValidation], asyncHandler(equipmentRequestController.getEquipmentRequestById));

router.patch("/:id/status", [auth, role(["superadmin", "manager", "equipmentManager"]), ...equipmentRequestIdValidation, ...updateEquipmentRequestStatusValidation], asyncHandler(equipmentRequestController.updateEquipmentRequestStatus));

router.delete("/:id", [auth, role(["superadmin"]), ...equipmentRequestIdValidation], asyncHandler(equipmentRequestController.deleteEquipmentRequest));

module.exports = router;