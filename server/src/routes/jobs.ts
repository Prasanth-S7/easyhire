import { Router, Request, Response } from "express";
import { prisma } from "../lib/auth";
import { authMiddleware } from "../lib/authMiddleware";
import { upsertJobToQdrant, deleteJobFromQdrant, JobPayload } from "../lib/qdrant";
import { indexJobInFaiss, removeJobFromFaiss } from "../lib/faiss";

export const jobs = Router();

// Helper to convert Prisma job to JobPayload for indexing
function toJobPayload(job: any, orgName: string): JobPayload {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    location: job.location,
    orgId: job.orgId,
    orgName: orgName,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    workMode: job.workMode,
    tags: job.tags,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

// Index job to both vector stores (non-blocking)
async function indexJobToVectorStores(jobPayload: JobPayload): Promise<void> {
  try {
    await Promise.all([
      upsertJobToQdrant(jobPayload).catch((err) => console.error("Qdrant indexing failed:", err)),
      indexJobInFaiss(jobPayload).catch((err) => console.error("FAISS indexing failed:", err)),
    ]);
    console.log(`Job "${jobPayload.title}" indexed to vector stores`);
  } catch (error) {
    console.error("Error indexing job to vector stores:", error);
  }
}

// Remove job from both vector stores (non-blocking)
async function removeJobFromVectorStores(jobId: string): Promise<void> {
  try {
    await Promise.all([
      deleteJobFromQdrant(jobId).catch((err) => console.error("Qdrant deletion failed:", err)),
      removeJobFromFaiss(jobId).catch((err) => console.error("FAISS deletion failed:", err)),
    ]);
    console.log(`Job ${jobId} removed from vector stores`);
  } catch (error) {
    console.error("Error removing job from vector stores:", error);
  }
}

jobs.get("/", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

jobs.get("/:id", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return res.status(500).json({ error: "Failed to fetch job" });
  }
});

jobs.post("/", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { title, description, location, salaryMin, salaryMax, workMode, tags } = req.body;

    if (!title || !description || !location || salaryMin === undefined || salaryMax === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const organization = await prisma.organization.findUnique({
      where: { userId: req.userId },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found. Create an organization first." });
    }

    const job = await prisma.job.create({
      data: {
        title,
        orgId: organization.id,
        description,
        location,
        salaryMin,
        salaryMax,
        workMode: workMode || [],
        tags: tags || [],
      },
    });

    // Index job to vector stores (non-blocking)
    indexJobToVectorStores(toJobPayload(job, organization.name));

    return res.status(201).json(job);
  } catch (error) {
    console.error("Error creating job:", error);
    return res.status(500).json({ error: "Failed to create job" });
  }
});

jobs.delete("/:id", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.organization.userId !== req.userId) {
      return res.status(403).json({ error: "Not authorized to delete this job" });
    }

    await prisma.job.delete({
      where: { id },
    });

    // Remove job from vector stores (non-blocking)
    removeJobFromVectorStores(id);

    return res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    return res.status(500).json({ error: "Failed to delete job" });
  }
});

// Apply for a job
jobs.post("/:id/apply", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;
    const { coverLetter, resume } = req.body;

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if user owns this organization (can't apply to own jobs)
    if (job.organization.userId === req.userId) {
      return res.status(400).json({ error: "You cannot apply to your own job posting" });
    }

    // Check if already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_userId: {
          jobId: id,
          userId: req.userId,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json({ error: "You have already applied for this job" });
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId: id,
        userId: req.userId,
        coverLetter: coverLetter || null,
        resume: resume || null,
      },
    });

    // Increment applicants count
    await prisma.job.update({
      where: { id },
      data: { applicants: { increment: 1 } },
    });

    return res.status(201).json(application);
  } catch (error) {
    console.error("Error applying for job:", error);
    return res.status(500).json({ error: "Failed to apply for job" });
  }
});

// Get user's applications
jobs.get("/applications/me", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { userId: req.userId },
      include: {
        job: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// Check if user has applied to a specific job
jobs.get("/:id/application-status", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    const application = await prisma.jobApplication.findUnique({
      where: {
        jobId_userId: {
          jobId: id,
          userId: req.userId,
        },
      },
    });

    return res.json({ applied: !!application, application });
  } catch (error) {
    console.error("Error checking application status:", error);
    return res.status(500).json({ error: "Failed to check application status" });
  }
});

// Get applicants for a job (organization only)
jobs.get("/:id/applicants", authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.organization.userId !== req.userId) {
      return res.status(403).json({ error: "Not authorized to view applicants" });
    }

    const applicants = await prisma.jobApplication.findMany({
      where: { jobId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(applicants);
  } catch (error) {
    console.error("Error fetching applicants:", error);
    return res.status(500).json({ error: "Failed to fetch applicants" });
  }
});