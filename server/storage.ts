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
    const [result] = await this.db
      .insert(interviewAnalyses)
      .values([insertAnalysis])
      .returning();
    
    return result;
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

// Export storage instance based on environment
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage()
  : new MemStorage();
