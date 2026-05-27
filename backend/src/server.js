require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");        // (existing)
const requestRoutes = require("./routes/requests.routes"); // ✅ (A) ADD THIS
const publicRoutes = require("./routes/public.routes");
const reportsRoutes = require("./routes/reports.routes");
const testMailRoutes = require("./routes/testmail.routes");



const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Offboarding Backend is running ✅");
});

app.use("/api/auth", authRoutes);          // (existing)
app.use("/api/requests", requestRoutes);   // ✅ (B) ADD THIS
app.use("/api/public", publicRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/testmail", testMailRoutes);
const PORT = process.env.PORT || 4000;
const path = require("path");

// Serve built frontend
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Catch-all middleware for SPA (no path-to-regexp wildcards)
app.use((req, res, next) => {
  // Let API routes pass through
  if (req.path.startsWith("/api")) return next();

  // Serve SPA index.html for everything else
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});
``

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});