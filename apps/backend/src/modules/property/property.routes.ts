import { Router } from "express";
import { createPropertyController } from "./property.controller";
import { requireAuth } from "@flatmate/auth";
import { propertyUpload } from "../../middlewares/upload.middleware";
import { searchPropertiesController } from "./property.search.controller";
import { getPropertyByIdController } from "./property.detail.controller";
import {
    savePropertyController,
    unsavePropertyController,
    getSavedPropertiesController
} from "./property.save.controller";

const router = Router();

router.post("/properties", requireAuth, propertyUpload, createPropertyController);
router.get("/properties/search", requireAuth, searchPropertiesController);
router.get("/properties/:propertyId", getPropertyByIdController);
router.post("/properties/:propertyId/save", requireAuth, savePropertyController);
router.delete("/properties/:propertyId/save", requireAuth, unsavePropertyController);
router.get("/users/me/saved-properties", requireAuth, getSavedPropertiesController);

export default router;