import { QdrantClient } from "@qdrant/js-client-rest";
import { generateEmbedding, EMBEDDING_DIMENSION } from "./embeddings";

const COLLECTION_NAME = "jobs";

// Initialize Qdrant client - uses local instance by default
// For cloud, set QDRANT_URL and QDRANT_API_KEY in .env
const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
console.log("Connecting to Qdrant at:", qdrantUrl);

// For Qdrant Cloud, use the host without protocol
const isCloud = qdrantUrl.includes("cloud.qdrant.io");
const qdrantClient = isCloud
  ? new QdrantClient({
      url: qdrantUrl,
      apiKey: process.env.QDRANT_API_KEY,
    })
  : new QdrantClient({
      url: qdrantUrl,
    });

export interface JobPayload {
  id: string;
  title: string;
  description: string;
  location: string;
  orgName: string;
  orgId: string;
  salaryMin: number;
  salaryMax: number;
  workMode: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  location?: string;
  workMode?: string;
  organizationId?: string;
  minSalary?: number;
  maxSalary?: number;
  tags?: string[];
}

export async function initQdrantCollection(): Promise<void> {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

    if (!exists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: EMBEDDING_DIMENSION,
          distance: "Cosine",
        },
      });
      console.log(`Qdrant collection '${COLLECTION_NAME}' created`);
    } else {
      console.log(`Qdrant collection '${COLLECTION_NAME}' already exists`);
    }
  } catch (error) {
    console.error("Error initializing Qdrant collection:", error);
    throw error;
  }
}

export async function upsertJobToQdrant(job: JobPayload): Promise<void> {
  try {
    const text = `${job.title} ${job.description} ${job.location} ${job.tags.join(" ")} ${job.workMode.join(" ")}`;
    const embedding = await generateEmbedding(text);

    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: job.id,
          vector: embedding,
          payload: job as unknown as Record<string, unknown>,
        },
      ],
    });
  } catch (error) {
    console.error("Error upserting job to Qdrant:", error);
    throw error;
  }
}

export async function deleteJobFromQdrant(jobId: string): Promise<void> {
  try {
    await qdrantClient.delete(COLLECTION_NAME, {
      wait: true,
      points: [jobId],
    });
  } catch (error) {
    console.error("Error deleting job from Qdrant:", error);
    throw error;
  }
}

export async function searchJobsInQdrant(
  query: string,
  filters: SearchFilters = {},
  limit: number = 5
): Promise<JobPayload[]> {
  try {
    const embedding = await generateEmbedding(query);

    // Build filter conditions
    const mustConditions: any[] = [];

    if (filters.workMode) {
      mustConditions.push({
        key: "workMode",
        match: { any: [filters.workMode] },
      });
    }

    if (filters.location) {
      mustConditions.push({
        key: "location",
        match: { text: filters.location },
      });
    }

    if (filters.organizationId) {
      mustConditions.push({
        key: "orgId",
        match: { value: filters.organizationId },
      });
    }

    if (filters.minSalary !== undefined) {
      mustConditions.push({
        key: "salaryMin",
        range: { gte: filters.minSalary },
      });
    }

    if (filters.maxSalary !== undefined) {
      mustConditions.push({
        key: "salaryMax",
        range: { lte: filters.maxSalary },
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      mustConditions.push({
        key: "tags",
        match: { any: filters.tags },
      });
    }

    const searchParams: any = {
      vector: embedding,
      limit,
      with_payload: true,
    };

    if (mustConditions.length > 0) {
      searchParams.filter = { must: mustConditions };
    }

    const results = await qdrantClient.search(COLLECTION_NAME, searchParams);

    return results.map((result) => result.payload as unknown as JobPayload);
  } catch (error) {
    console.error("Error searching jobs in Qdrant:", error);
    return [];
  }
}

export { qdrantClient };
