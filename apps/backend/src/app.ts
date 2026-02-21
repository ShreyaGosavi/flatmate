import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./modules/auth/auth.route";
import communityRoutes from "./modules/community/community.route";
import adminRoutes from "./modules/admin/admin.route";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use("/auth", authRoutes);

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/communities", communityRoutes);


app.use("/admin", adminRoutes);
export default app;