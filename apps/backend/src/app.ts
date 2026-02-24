import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./modules/auth/auth.route";
import communityRoutes from "./modules/community/community.route";
import adminRoutes from "./modules/admin/admin.route";
import {configureEmail} from "@flatmate/email";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is missing");
}

configureEmail(apiKey);

app.use("/auth", authRoutes);
app.use("/communities", communityRoutes);
app.use("/admin", adminRoutes);
export default app;