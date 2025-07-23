import { analyses, interviewAnalyses, type Analysis, type InsertAnalysis, type InterviewAnalysis, type InsertInterviewAnalysis } from "@shared/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAllAnalyses(): Promise<Analysis[]>;
  createInterviewAnalysis(analysis: InsertInterviewAnalysis): Promise<InterviewAnalysis>;
  getInterviewAnalysis(id: number): Promise<InterviewAnalysis | undefined>;
  getAllInterviewAnalyses(): Promise<InterviewAnalysis[]>;
}

// Supabase/Neon Database Storage
export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [result] = await this.db
      .insert(analyses)
      .values([insertAnalysis])
      .returning();
    
    return result;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const result = await this.db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id))
      .limit(1);
    
    return result[0];
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return await this.db
      .select()
      .from(analyses)
      .orderBy(desc(analyses.createdAt));
  }

  async createInterviewAnalysis(insertAnalysis: InsertInterviewAnalysis): Promise<InterviewAnalysis> {
    try {
      const [result] = await this.db
        .insert(interviewAnalyses)
        .values([insertAnalysis])
        .returning();
      
      return result;
    } catch (error) {
      console.log("Database save failed, falling back to in-memory storage:", error instanceof Error ? error.message : "Unknown error");
      throw error; // Let the caller handle the fallback
    }
  }

  async getInterviewAnalysis(id: number): Promise<InterviewAnalysis | undefined> {
    const result = await this.db
      .select()
      .from(interviewAnalyses)
      .where(eq(interviewAnalyses.id, id))
      .limit(1);
    
    return result[0];
  }

  async getAllInterviewAnalyses(): Promise<InterviewAnalysis[]> {
    return await this.db
      .select()
      .from(interviewAnalyses)
      .orderBy(desc(interviewAnalyses.createdAt));
  }
}

// Fallback in-memory storage for development
export class MemStorage implements IStorage {
  private analyses: Map<number, Analysis>;
  private interviewAnalyses: Map<number, InterviewAnalysis>;
  private currentId: number;
  private currentInterviewId: number;

  constructor() {
    this.analyses = new Map();
    this.interviewAnalyses = new Map();
    this.currentId = 1;
    this.currentInterviewId = 1;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentId++;
    const analysis: Analysis = {
      resumeText: insertAnalysis.resumeText,
      jobDescription: insertAnalysis.jobDescription,
      additionalContext: insertAnalysis.additionalContext || null,
      alignmentScore: insertAnalysis.alignmentScore,
      strengths: insertAnalysis.strengths as string[],
      gaps: insertAnalysis.gaps as string[],
      formattingSuggestions: insertAnalysis.formattingSuggestions || null,
      interviewQuestions: insertAnalysis.interviewQuestions as { question: string; idealAnswerTraits: string[]; }[],
      id,
      createdAt: new Date(),
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values());
  }

  async createInterviewAnalysis(insertAnalysis: InsertInterviewAnalysis): Promise<InterviewAnalysis> {
    const id = this.currentInterviewId++;
    const analysis: InterviewAnalysis = {
      audioFileName: insertAnalysis.audioFileName,
      transcript: insertAnalysis.transcript,
      overallScore: insertAnalysis.overallScore,
      communicationScore: insertAnalysis.communicationScore,
      contentScore: insertAnalysis.contentScore,
      strengths: insertAnalysis.strengths as string[],
      improvements: insertAnalysis.improvements as string[],
      keyInsights: insertAnalysis.keyInsights as string[],
      id,
      createdAt: new Date(),
    };
    this.interviewAnalyses.set(id, analysis);
    return analysis;
  }

  async getInterviewAnalysis(id: number): Promise<InterviewAnalysis | undefined> {
    return this.interviewAnalyses.get(id);
  }

  async getAllInterviewAnalyses(): Promise<InterviewAnalysis[]> {
    return Array.from(this.interviewAnalyses.values());
  }
}

// Hybrid storage with automatic fallback
class HybridStorage implements IStorage {
  private primaryStorage: DatabaseStorage | null = null;
  private fallbackStorage: MemStorage = new MemStorage();

  constructor() {
    if (process.env.DATABASE_URL) {
      try {
        this.primaryStorage = new DatabaseStorage();
        console.log("Database storage initialized");
      } catch (error) {
        console.log("Database initialization failed, using in-memory storage:", error instanceof Error ? error.message : "Unknown error");
      }
    } else {
      console.log("No DATABASE_URL found, using in-memory storage");
    }
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    if (this.primaryStorage) {
      try {
        return await this.primaryStorage.createAnalysis(insertAnalysis);
      } catch (error) {
        console.log("Database save failed, using fallback storage");
        return await this.fallbackStorage.createAnalysis(insertAnalysis);
      }
    }
    return await this.fallbackStorage.createAnalysis(insertAnalysis);
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    if (this.primaryStorage) {
      try {
        return await this.primaryStorage.getAnalysis(id);
      } catch (error) {
        console.log("Database read failed, using fallback storage");
        return await this.fallbackStorage.getAnalysis(id);
      }
    }
    return await this.fallbackStorage.getAnalysis(id);
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    if (this.primaryStorage) {
      try {
        return await this.primaryStorage.getAllAnalyses();
      } catch (error) {
        console.log("Database read failed, using fallback storage");
        return await this.fallbackStorage.getAllAnalyses();
      }
    }
    return await this.fallbackStorage.getAllAnalyses();
  }

  async createInterviewAnalysis(insertAnalysis: InsertInterviewAnalysis): Promise<InterviewAnalysis> {
    if (this.primaryStorage) {
      try {
        return await this.primaryStorage.createInterviewAnalysis(insertAnalysis);
      } catch (error) {
        console.log("Database save failed, using fallback storage");
        return await this.fallbackStorage.createInterviewAnalysis(insertAnalysis);
      }
    }
    return await this.fallbackStorage.createInterviewAnalysis(insertAnalysis);
  }

  async getInterviewAnalysis(id: number): Promise<InterviewAnalysis | undefined> {
    if (this.primaryStorage) {
      try {
        return await this.primaryStorage.getInterviewAnalysis(id);
      } catch (error) {
        console.log("Database read failed, using fallback storage");
        return await this.fallbackStorage.getInterviewAnalysis(id);
      }
    }
    return await this.fallbackStorage.getInterviewAnalysis(id);
  }

  async getAllInterviewAnalyses(): Promise<InterviewAnalysis[]> {
    if (this.primaryStorage) {
      try {
        return await this.primaryStorage.getAllInterviewAnalyses();
      } catch (error) {
        console.log("Database read failed, using fallback storage");
        return await this.fallbackStorage.getAllInterviewAnalyses();
      }
    }
    return await this.fallbackStorage.getAllInterviewAnalyses();
  }
}

// Initialize hybrid storage with automatic fallback
export const storage = new HybridStorage();
