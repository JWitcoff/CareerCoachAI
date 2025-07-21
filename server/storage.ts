import { analyses, type Analysis, type InsertAnalysis } from "@shared/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAllAnalyses(): Promise<Analysis[]>;
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
      .values(insertAnalysis)
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
}

// Fallback in-memory storage for development
export class MemStorage implements IStorage {
  private analyses: Map<number, Analysis>;
  private currentId: number;

  constructor() {
    this.analyses = new Map();
    this.currentId = 1;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentId++;
    const analysis: Analysis = {
      resumeText: insertAnalysis.resumeText,
      jobDescription: insertAnalysis.jobDescription,
      additionalContext: insertAnalysis.additionalContext || null,
      alignmentScore: insertAnalysis.alignmentScore,
      strengths: insertAnalysis.strengths,
      gaps: insertAnalysis.gaps,
      formattingSuggestions: insertAnalysis.formattingSuggestions || null,
      interviewQuestions: insertAnalysis.interviewQuestions,
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
}

// Export storage instance based on environment
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage()
  : new MemStorage();
