import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./modules/auth/auth.route";

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

export default app;