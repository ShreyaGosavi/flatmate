import { Router } from "express";
import * as authController from "./auth.controller";
import { requireAuth } from "@flatmate/auth";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many attempts, please try again later" },
});

const router = Router();

router.post("/send-email-verification", authLimiter, authController.sendEmailVerification);
router.get("/check-email-verification", authController.checkEmailVerification);
router.get("/verify-email", authController.verifyEmail);
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);

router.get("/protected-test", requireAuth, (req, res) => {
    res.json({
        message: "Authenticated",
        userId: req.user!.id,
        email: req.user!.email,
    });
});

export default router;