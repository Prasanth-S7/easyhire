import { Router, Request, Response } from "express";
import { searchJobsInQdrant, JobPayload, SearchFilters } from "../lib/qdrant";
import { searchJobsInFaiss } from "../lib/faiss";
import { authMiddleware } from "../lib/authMiddleware";

const router = Router();

interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  engine?: "qdrant" | "faiss" | "both";
}

interface SearchResult extends JobPayload {
  source?: "qdrant" | "faiss";
}

router.post("/jobs", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, filters = {}, limit = 5, engine = "both" }: SearchRequest = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const searchLimit = Math.min(Math.max(1, limit), 20); 
    let results: SearchResult[] = [];

    if (engine === "qdrant" || engine === "both") {
      try {
        const qdrantResults = await searchJobsInQdrant(query, filters, 1);
        const qdrantMapped: SearchResult[] = qdrantResults.map((job) => ({
          ...job,
          source: "qdrant" as const,
        }));
        results = [...results, ...qdrantMapped];
      } catch (error) {
        console.error("Qdrant search error:", error);
      }
    }

    if (engine === "faiss" || engine === "both") {
      try {
        const faissResults = await searchJobsInFaiss(query, filters, searchLimit);
        const faissMapped: SearchResult[] = faissResults.map((job) => ({
          ...job,
          source: "faiss" as const,
        }));
        results = [...results, ...faissMapped];
      } catch (error) {
        console.error("FAISS search error:", error);
      }
    }

    if (engine === "both") {
      const seenIds = new Set<string>();
      const uniqueResults: SearchResult[] = [];
      
      for (const result of results) {
        if (!seenIds.has(result.id)) {
          seenIds.add(result.id);
          uniqueResults.push(result);
        }
      }
      
      results = uniqueResults.slice(0, searchLimit);
    }

    res.json({
      query,
      filters,
      engine,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search jobs" });
  }
});

router.get("/health", async (_req: Request, res: Response): Promise<void> => {
  const health = {
    qdrant: false,
    faiss: false,
  };

  try {
    const { qdrantClient } = await import("../lib/qdrant");
    await qdrantClient.getCollections();
    health.qdrant = true;
  } catch (error) {
    console.error("Qdrant health check failed:", error);
  }

  try {
    const { getFaissIndexCount } = await import("../lib/faiss");
    getFaissIndexCount(); 
    health.faiss = true;
  } catch (error) {
    console.error("FAISS health check failed:", error);
  }

  res.json({
    status: health.qdrant || health.faiss ? "ok" : "degraded",
    engines: health,
  });
});

export default router;
