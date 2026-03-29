import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

function parseTimeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function addMinutesToDate(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/** Build slot start times for one calendar day */
function slotsForDay(date, dayWindows, durationMinutes) {
  const dow = date.getDay();
  const windows = dayWindows.filter((w) => w.dayOfWeek === dow);
  const slots = [];
  for (const w of windows) {
    let cur = parseTimeToMinutes(w.startTime);
    const end = parseTimeToMinutes(w.endTime);
    while (cur + durationMinutes <= end) {
      const h = Math.floor(cur / 60);
      const m = cur % 60;
      const start = new Date(date);
      start.setHours(h, m, 0, 0);
      slots.push(start);
      cur += durationMinutes;
    }
  }
  return slots;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/** GET /api/bookings/slots?eventTypeId=&from=&to= ISO dates */
router.get("/slots", async (req, res) => {
  try {
    const { eventTypeId, from, to } = req.query;
    if (!eventTypeId || !from || !to) {
      return res.status(400).json({ error: "eventTypeId, from, and to are required" });
    }
    const event = await prisma.eventType.findUnique({
      where: { id: String(eventTypeId) },
      include: { availabilities: true, bookings: true, dateOverrides: true },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const duration = event.duration;
    const bufferTime = event.bufferTime || 0;
    const windows = event.availabilities;
    const bookings = event.bookings;
    const dateOverrides = event.dateOverrides || [];

    const slotStarts = [];
    const d = new Date(fromDate);
    d.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    while (d <= end) {
      const dStr = d.toISOString().split("T")[0];
      const override = dateOverrides.find((o) => o.date === dStr);
      if (override && override.isBlocked) {
        d.setDate(d.getDate() + 1);
        continue;
      }

      const daySlots = slotsForDay(new Date(d), windows, duration);
      for (const start of daySlots) {
        if (start >= fromDate && start <= end) {
          const slotEnd = addMinutesToDate(start, duration);
          const taken = bookings.some((b) => {
            const bStart = new Date(b.startTime);
            const bEnd = addMinutesToDate(new Date(b.endTime), bufferTime);
            return rangesOverlap(start, slotEnd, bStart, bEnd);
          });
          if (!taken) {
            slotStarts.push(start.toISOString());
          }
        }
      }
      d.setDate(d.getDate() + 1);
    }

    slotStarts.sort();
    res.json({ duration, slots: slotStarts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to compute slots" });
  }
});

/** POST /api/bookings */
router.post("/", async (req, res) => {
  try {
    const { eventTypeId, guestName, guestEmail, startTime, responses } = req.body;
    if (!eventTypeId || !guestName || !guestEmail || !startTime) {
      return res.status(400).json({
        error: "eventTypeId, guestName, guestEmail, and startTime are required",
      });
    }

    const event = await prisma.eventType.findUnique({ where: { id: String(eventTypeId) } });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ error: "Invalid startTime" });
    }
    const end = addMinutesToDate(start, event.duration);

    const conflict = await prisma.booking.findFirst({
      where: {
        eventTypeId: event.id,
        OR: [
          {
            AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
          },
        ],
      },
    });
    if (conflict) {
      return res.status(409).json({ error: "That time was just booked. Pick another slot." });
    }

    const booking = await prisma.booking.create({
      data: {
        eventTypeId: event.id,
        guestName: String(guestName).trim(),
        guestEmail: String(guestEmail).trim().toLowerCase(),
        startTime: start,
        endTime: end,
        responses: responses ? typeof responses === "string" ? responses : JSON.stringify(responses) : null,
      },
      include: { eventType: { select: { title: true, slug: true } } },
    });
    res.status(201).json(booking);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

/** GET /api/bookings?eventTypeId= */
router.get("/", async (req, res) => {
  try {
    const { eventTypeId } = req.query;
    if (!eventTypeId) {
      return res.status(400).json({ error: "eventTypeId is required" });
    }
    const list = await prisma.booking.findMany({
      where: { eventTypeId: String(eventTypeId) },
      orderBy: { startTime: "asc" },
    });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list bookings" });
  }
});

export default router;
