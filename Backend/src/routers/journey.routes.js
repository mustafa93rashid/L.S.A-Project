const express = require("express");

const journeyController = require("../controllers/journey.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const { uploadJourneyImage } = require("../middlewares/upload.middleware");

const asyncHandler = require("../utils/asyncHandler");

const { createJourneyValidation, updateJourneyValidation, journeyIdValidation } = require("../validation/journey.validate");

const router = express.Router();

// ==================== Public ====================

router.get("/public", asyncHandler(journeyController.getPublicJourneys));

// ==================== Dashboard ====================

router.get("/", [auth, role(["superadmin", "manager", "contentManager"])], asyncHandler(journeyController.getAllJourneys));

router.post("/", [auth, role(["superadmin", "manager", "contentManager"]), uploadJourneyImage(), ...createJourneyValidation], asyncHandler(journeyController.createJourney));

router.patch("/:id", [auth, role(["superadmin", "manager", "contentManager"]), uploadJourneyImage(), ...journeyIdValidation, ...updateJourneyValidation], asyncHandler(journeyController.updateJourney));

router.delete("/:id", [auth, role(["superadmin", "manager", "contentManager"]), ...journeyIdValidation], asyncHandler(journeyController.deleteJourney));

module.exports = router;