import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router({ mergeParams: true });

/** GET /api/events/:eventTypeId/availability */
router.get("/:eventTypeId/availability", async (req, res) => {
  try {
    const rows = await prisma.availability.findMany({
      where: { eventTypeId: req.params.eventTypeId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load availability" });
  }
});

/** PUT /api/events/:eventTypeId/availability — replace all windows */
router.put("/:eventTypeId/availability", async (req, res) => {
  try {
    const { windows } = req.body;
    if (!Array.isArray(windows)) {
      return res.status(400).json({ error: "windows must be an array" });
    }
    const eventTypeId = req.params.eventTypeId;
    const event = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
    if (!event) return res.status(404).json({ error: "Event not found" });

    await prisma.$transaction([
      prisma.availability.deleteMany({ where: { eventTypeId } }),
      prisma.availability.createMany({
        data: windows.map((w) => ({
          eventTypeId,
          dayOfWeek: Number(w.dayOfWeek),
          startTime: String(w.startTime),
          endTime: String(w.endTime),
        })),
      }),
    ]);

    const rows = await prisma.availability.findMany({
      where: { eventTypeId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save availability" });
  }
});

export default router;
