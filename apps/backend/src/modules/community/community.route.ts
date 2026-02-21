
import { Router } from "express";
import * as communityController from "./community.controller";
//import * as adminController from "./community.admin.controller";
import { requireAuth } from "@flatmate/auth";

const router = Router();

// public
router.get("/search", communityController.searchCommunities);
router.get("/:id/notices", communityController.getCommunityNotices);

// authenticated
router.post("/request", requireAuth, communityController.requestCommunity);
router.post("/:id/join", requireAuth, communityController.joinCommunity);
router.post("/:id/notices", requireAuth, communityController.createNotice);

// // admin
// router.get("/admin/requests", requireAuth, adminController.getPendingRequests);
// router.post("/admin/requests/:id/approve", requireAuth, adminController.approveRequest);
// router.post("/admin/requests/:id/reject", requireAuth, adminController.rejectRequest);

export default router;
