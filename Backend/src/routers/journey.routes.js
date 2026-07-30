const express = require("express");

const journeyController = require("../controllers/journey.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

const { uploadSingle } = require("../middlewares/upload.middleware");

const { createJourneyValidation, updateJourneyValidation, journeyIdValidation } = require("../validation/journey.validate");

const router = express.Router();

// ==================== Public ====================

router.get("/public", asyncHandler(journeyController.getPublicJourneys));

// ==================== Dashboard ====================

router.get("/", [auth, role(["superadmin", "contentManager"])], asyncHandler(journeyController.getAllJourneys));

router.post("/", [auth, role(["superadmin", "contentManager"]), uploadSingle("image"), ...createJourneyValidation], asyncHandler(journeyController.createJourney));

router.patch("/:id", [auth, role(["superadmin", "contentManager"]), uploadSingle("image"), ...updateJourneyValidation], asyncHandler(journeyController.updateJourney));

router.delete("/:id", [auth, role(["superadmin", "contentManager"]), ...journeyIdValidation], asyncHandler(journeyController.deleteJourney));

module.exports = router;