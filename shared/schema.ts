import { pgTable, text, serial, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  resumeText: text("resume_text").notNull(),
  jobDescription: text("job_description"),
  additionalContext: text("additional_context"),
  alignmentScore: integer("alignment_score").notNull(),
  strengths: json("strengths").$type<string[]>().notNull(),
  gaps: json("gaps").$type<string[]>().notNull(),
  formattingSuggestions: json("formatting_suggestions").$type<{before: string, after: string}[]>(),
  interviewQuestions: json("interview_questions").$type<{
    question: string;
    idealAnswerTraits: string[];
  }[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

export const interviewAnalyses = pgTable("interview_analyses", {
  id: serial("id").primaryKey(),
  audioFileName: text("audio_file_name").notNull(),
  transcript: text("transcript").notNull(),
  overallScore: integer("overall_score").notNull(),
  communicationScore: integer("communication_score").notNull(),
  contentScore: integer("content_score").notNull(),
  strengths: json("strengths").$type<string[]>().notNull(),
  improvements: json("improvements").$type<string[]>().notNull(),
  keyInsights: json("key_insights").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInterviewAnalysisSchema = createInsertSchema(interviewAnalyses).omit({
  id: true,
  createdAt: true,
});

export type InsertInterviewAnalysis = z.infer<typeof insertInterviewAnalysisSchema>;
export type InterviewAnalysis = typeof interviewAnalyses.$inferSelect;

// Chat messages for follow-up questions about interview analysis
export const interviewChats = pgTable("interview_chats", {
  id: serial("id").primaryKey(),
  interviewAnalysisId: integer("interview_analysis_id").references(() => interviewAnalyses.id).notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInterviewChatSchema = createInsertSchema(interviewChats).omit({
  id: true,
  createdAt: true,
});

export type InsertInterviewChat = z.infer<typeof insertInterviewChatSchema>;
export type InterviewChat = typeof interviewChats.$inferSelect;

export const analyzeRequestSchema = z.object({
  resumeText: z.string().min(50, "Resume text must be at least 50 characters"),
  jobDescription: z.string().optional(),
  additionalContext: z.string().optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
