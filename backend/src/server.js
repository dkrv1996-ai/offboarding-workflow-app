const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const requestsRoutes = require("./routes/requests.routes");
const reportsRoutes = require("./routes/reports.routes");  // ✅ ADD THIS
const publicRoutes = require("./routes/public.routes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/reports", reportsRoutes);   // ✅ now reportsRoutes is defined
app.use("/api/public", publicRoutes);

// health
app.get("/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server started on http://localhost:${port}`));