const express = require("express");

const equipmentController = require("../controllers/equipment.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

const { uploadEquipmentImage } = require("../middlewares/upload.middleware");

const {
  createCategoryValidation,
  updateCategoryValidation,
  createEquipmentValidation,
  updateEquipmentValidation,
  equipmentIdValidation,
  categoryIdValidation,
  equipmentSlugValidation,
  equipmentPublicQueryValidation,
  equipmentDashboardQueryValidation,
} = require("../validation/equipment.validate");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Category Routes
|--------------------------------------------------------------------------
*/

router.get("/categories/public", asyncHandler(equipmentController.getPublicCategories));

/*
|--------------------------------------------------------------------------
| Dashboard Category Routes
|--------------------------------------------------------------------------
*/

router.get("/categories/options", auth, role(["superadmin", "contentManager"]), asyncHandler(equipmentController.getCategoryOptions));

router.get("/categories", auth, role(["superadmin", "contentManager"]), asyncHandler(equipmentController.getAllCategories));

router.post("/categories", auth, role(["superadmin", "contentManager"]), ...createCategoryValidation, asyncHandler(equipmentController.createCategory));

router.get("/categories/:id", auth, role(["superadmin", "contentManager"]), ...categoryIdValidation, asyncHandler(equipmentController.getCategoryById));

router.patch("/categories/:id", auth, role(["superadmin", "contentManager"]), ...categoryIdValidation, ...updateCategoryValidation, asyncHandler(equipmentController.updateCategory));

router.delete("/categories/:id", auth, role(["superadmin", "contentManager"]), ...categoryIdValidation, asyncHandler(equipmentController.deleteCategory));

/*
|--------------------------------------------------------------------------
| Public Equipment Routes
|--------------------------------------------------------------------------
*/

router.get("/public", ...equipmentPublicQueryValidation, asyncHandler(equipmentController.getPublicEquipment));

router.get("/public/:slug", ...equipmentSlugValidation, asyncHandler(equipmentController.getPublicEquipmentBySlug));

/*
|--------------------------------------------------------------------------
| Dashboard Equipment Routes
|--------------------------------------------------------------------------
*/

router.get("/", auth, role(["superadmin", "contentManager"]), ...equipmentDashboardQueryValidation, asyncHandler(equipmentController.getAllEquipment));

router.post("/", auth, role(["superadmin", "contentManager"]), uploadEquipmentImage(), ...createEquipmentValidation, asyncHandler(equipmentController.createEquipment));

router.get("/:id", auth, role(["superadmin", "contentManager"]), ...equipmentIdValidation, asyncHandler(equipmentController.getEquipmentById));

router.patch("/:id", auth, role(["superadmin", "contentManager"]), uploadEquipmentImage(), ...equipmentIdValidation, ...updateEquipmentValidation, asyncHandler(equipmentController.updateEquipment));

router.delete("/:id", auth, role(["superadmin", "contentManager"]), ...equipmentIdValidation, asyncHandler(equipmentController.deleteEquipment));

module.exports = router;