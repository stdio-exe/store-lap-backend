import express from "express";
import authRouter from "./routes/auth.route.js";

// === 1 - CREATE SERVER ===
const app = express();
app.use(express.json());

app.use("/api", authRouter);

// === 5 - START UP SERVER ===
app.listen(8080, () => console.log(`Server running on ${8080}`));
