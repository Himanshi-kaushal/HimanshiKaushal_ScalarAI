import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/** GET /api/users/demo — first user with demo@example.com (dev convenience) */
router.get("/demo", async (_req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "demo@example.com" },
      select: { id: true, email: true, name: true },
    });
    if (!user) return res.status(404).json({ error: "Run npm run db:seed in backend first" });
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load demo user" });
  }
});

export default router;
