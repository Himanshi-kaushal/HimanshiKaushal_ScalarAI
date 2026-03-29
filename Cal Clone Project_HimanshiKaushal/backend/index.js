import "dotenv/config";
import express from "express";
import cors from "cors";
import eventRoutes from "./routes/eventRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/events", availabilityRoutes);
app.use("/api/events", eventRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT}`);
});
