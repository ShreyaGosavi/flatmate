import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";



const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

export default app;
