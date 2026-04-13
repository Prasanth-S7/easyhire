import { Router, Request, Response } from "express";
import { prisma } from "../lib/auth";
import { authMiddleware } from "../lib/authMiddleware";

export const organization = Router();

organization.post("/", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { name, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const existingOrg = await prisma.organization.findUnique({
      where: { userId: req.userId },
    });

    if (existingOrg) {
      return res.status(400).json({ error: "Organization already exists for this user" });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        userId: req.userId,
        address: address || null,
      },
    });

    return res.status(201).json(organization);
  } catch (error) {
    console.error("Error creating organization:", error);
    return res.status(500).json({ error: "Failed to create organization" });
  }
});

organization.get("/", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const organization = await prisma.organization.findUnique({
      where: { userId: req.userId },
      include: {
        jobs: true,
      },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    return res.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return res.status(500).json({ error: "Failed to fetch organization" });
  }
});