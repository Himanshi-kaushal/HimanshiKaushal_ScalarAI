import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** GET /api/events?userId= — list event types for a user */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const events = await prisma.eventType.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { bookings: true } },
      },
    });
    res.json(events);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list events" });
  }
});

/** GET /api/events/public/:slug — public event for booking page */
router.get("/public/:slug", async (req, res) => {
  try {
    const event = await prisma.eventType.findUnique({
      where: { slug: req.params.slug },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load event" });
  }
});

/** POST /api/events */
router.post("/", async (req, res) => {
  try {
    const { userId, title, slug, duration, description, bufferTime, customQuestions } = req.body;
    if (!userId || !title || !duration) {
      return res.status(400).json({ error: "userId, title, and duration are required" });
    }
    let finalSlug = slug ? slugify(slug) : slugify(title);
    const existing = await prisma.eventType.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }
    const event = await prisma.eventType.create({
      data: {
        userId,
        title: String(title).trim(),
        slug: finalSlug,
        duration: Number(duration),
        description: description ? String(description).trim() : null,
        bufferTime: bufferTime ? Number(bufferTime) : 0,
        customQuestions: typeof customQuestions === "string" ? customQuestions : JSON.stringify(customQuestions || []),
      },
    });

    const defaultDays = [1, 2, 3, 4, 5];
    await prisma.availability.createMany({
      data: defaultDays.map((dayOfWeek) => ({
        eventTypeId: event.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
      })),
    });

    res.status(201).json(event);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create event" });
  }
});

/** PATCH /api/events/:id */
router.patch("/:id", async (req, res) => {
  try {
    const { title, slug, duration, description, bufferTime, customQuestions } = req.body;
    const data = {};
    if (title != null) data.title = String(title).trim();
    if (slug != null) data.slug = slugify(slug);
    if (duration != null) data.duration = Number(duration);
    if (description !== undefined) data.description = description ? String(description).trim() : null;
    if (bufferTime != null) data.bufferTime = Number(bufferTime);
    if (customQuestions !== undefined) data.customQuestions = typeof customQuestions === "string" ? customQuestions : JSON.stringify(customQuestions);

    const event = await prisma.eventType.update({
      where: { id: req.params.id },
      data,
    });
    res.json(event);
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ error: "Event not found" });
    console.error(e);
    res.status(500).json({ error: "Failed to update event" });
  }
});

/** DELETE /api/events/:id */
router.delete("/:id", async (req, res) => {
  try {
    await prisma.eventType.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ error: "Event not found" });
    console.error(e);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
