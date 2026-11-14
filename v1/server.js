import express from "express";
import authRouter from "./routes/auth.route.js";
import { FRONTEND_DEV_URL, FRONTEND_PROD_URL, NODE_ENV } from "./config/index.js";

const app = express();
app.use(
  cors({
    origin: `${NODE_ENV === "development" ? FRONTEND_DEV_URL : FRONTEND_PROD_URL}`,
    credentials: true,
  }),
);
app.disable("x-powered-by");
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/api", authRouter);

// === 5 - START UP SERVER ===
app.listen(8080, () => console.log(`Server running on ${8080}`));
