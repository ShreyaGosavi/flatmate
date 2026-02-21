import { Router } from "express";
import * as adminController from "./admin.controller";
import { requireAuth } from "@flatmate/auth";
import { isAdmin } from "../../middlewares/isAdmin.middleware";

const router = Router();
// both are required on every admin route
router.get("/properties/pending", requireAuth, isAdmin, adminController.getPendingProperties);
router.post("/properties/:propertyId/verify", requireAuth, isAdmin, adminController.verifyProperty);
router.post("/properties/:propertyId/reject", requireAuth, isAdmin, adminController.rejectProperty);

router.get("/community-requests/pending", requireAuth, isAdmin, adminController.getPendingCommunityRequests);
router.post("/community-requests/:id/approve", requireAuth, isAdmin, adminController.approveCommunityRequest);
router.post("/community-requests/:id/reject", requireAuth, isAdmin, adminController.rejectCommunityRequest);

export default router;