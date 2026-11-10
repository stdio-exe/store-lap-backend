import express from "express";

// === 1 - CREATE SERVER ===
const app = express();

// === 5 - START UP SERVER ===
app.listen(8080, () => console.log(`Server running on ${8080}`));
