import { IndexFlatIP, IndexFlatL2 } from "faiss-node";
import { generateEmbedding, EMBEDDING_DIMENSION } from "./embeddings";

export interface JobPayload {
  id: string;
  title: string;
  description: string;
  location: string;
  orgId: string;
  orgName: string;
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

// In-memory storage for FAISS
let faissIndex: IndexFlatIP | null = null;
const jobsMap: Map<number, JobPayload> = new Map(); // Maps FAISS index to job data
const jobIdToIndex: Map<string, number> = new Map(); // Maps job ID to FAISS index
let nextIndex = 0;

// Initialize FAISS index
function initializeFaissIndex(): void {
  if (!faissIndex) {
    // Using Inner Product (cosine similarity when vectors are normalized)
    faissIndex = new IndexFlatIP(EMBEDDING_DIMENSION);
    console.log("FAISS index initialized with dimension:", EMBEDDING_DIMENSION);
  }
}

// Index a job in FAISS
export async function indexJobInFaiss(job: JobPayload): Promise<void> {
  try {
    initializeFaissIndex();
    
    if (!faissIndex) {
      throw new Error("FAISS index not initialized");
    }

    // If job already exists, remove it first
    if (jobIdToIndex.has(job.id)) {
      await removeJobFromFaiss(job.id);
    }

    // Create text for embedding
    const textToEmbed = `${job.title} ${job.description} ${job.location} ${job.workMode.join(" ")} ${job.orgName} ${job.tags.join(" ")}`;
    
    // Generate embedding
    const embedding = await generateEmbedding(textToEmbed);
    
    // Normalize embedding for cosine similarity
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => val / norm);
    
    // Add to FAISS index
    faissIndex.add(normalizedEmbedding);
    
    // Store mapping
    const currentIndex = nextIndex;
    jobsMap.set(currentIndex, job);
    jobIdToIndex.set(job.id, currentIndex);
    nextIndex++;

    console.log(`Indexed job "${job.title}" in FAISS at index ${currentIndex}`);
  } catch (error) {
    console.error("Error indexing job in FAISS:", error);
    throw error;
  }
}

// Remove a job from FAISS (mark as removed - FAISS doesn't support true deletion)
export async function removeJobFromFaiss(jobId: string): Promise<void> {
  try {
    const index = jobIdToIndex.get(jobId);
    if (index !== undefined) {
      jobsMap.delete(index);
      jobIdToIndex.delete(jobId);
      console.log(`Marked job ${jobId} as removed from FAISS index`);
    }
  } catch (error) {
    console.error("Error removing job from FAISS:", error);
    throw error;
  }
}

// Search jobs in FAISS with optional filters
export async function searchJobsInFaiss(
  query: string,
  filters: SearchFilters = {},
  limit: number = 5
): Promise<JobPayload[]> {
  try {
    initializeFaissIndex();
    
    if (!faissIndex || faissIndex.ntotal() === 0) {
      console.log("FAISS index is empty");
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    
    // Normalize query embedding
    const norm = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedQuery = queryEmbedding.map(val => val / norm);
    
    // Search in FAISS (get more results to filter later)
    const searchLimit = Math.min(limit * 3, faissIndex.ntotal());
    const searchResult = faissIndex.search(normalizedQuery, searchLimit);
    
    const results: JobPayload[] = [];
    
    for (let i = 0; i < searchResult.labels.length; i++) {
      const faissIdx = searchResult.labels[i];
      
      // Skip if index is -1 (not found) or job was removed
      if (faissIdx === -1) continue;
      
      const job = jobsMap.get(faissIdx);
      if (!job) continue;
      
      // Apply filters
      if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
        continue;
      }
      
      if (filters.workMode && !job.workMode.some(wm => wm.toLowerCase() === filters.workMode!.toLowerCase())) {
        continue;
      }
      
      if (filters.organizationId && job.orgId !== filters.organizationId) {
        continue;
      }
      
      // Salary filtering
      if (filters.minSalary && job.salaryMax < filters.minSalary) {
        continue;
      }
      if (filters.maxSalary && job.salaryMin > filters.maxSalary) {
        continue;
      }
      
      // Tags filtering
      if (filters.tags && filters.tags.length > 0) {
        const jobTagsLower = job.tags.map(t => t.toLowerCase());
        const hasMatchingTag = filters.tags.some(t => jobTagsLower.includes(t.toLowerCase()));
        if (!hasMatchingTag) continue;
      }
      
      results.push(job);
      
      if (results.length >= limit) break;
    }

    return results;
  } catch (error) {
    console.error("Error searching jobs in FAISS:", error);
    return [];
  }
}

// Get total indexed jobs count
export function getFaissIndexCount(): number {
  return faissIndex ? faissIndex.ntotal() : 0;
}

// Rebuild FAISS index from scratch (useful after many deletions)
export async function rebuildFaissIndex(jobs: JobPayload[]): Promise<void> {
  try {
    // Reset everything
    faissIndex = new IndexFlatIP(EMBEDDING_DIMENSION);
    jobsMap.clear();
    jobIdToIndex.clear();
    nextIndex = 0;

    // Re-index all jobs
    for (const job of jobs) {
      await indexJobInFaiss(job);
    }

    console.log(`Rebuilt FAISS index with ${jobs.length} jobs`);
  } catch (error) {
    console.error("Error rebuilding FAISS index:", error);
    throw error;
  }
}
