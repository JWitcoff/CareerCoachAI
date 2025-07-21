import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeRequestSchema } from "@shared/schema";
import { analyzeResumeJobAlignment } from "./services/openai";
import { fetchJobDescriptionFromUrl } from "./services/scraper";
import multer from "multer";
import { z } from "zod";
import type { Request } from "express";
// PDF parsing will be imported dynamically

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only text files and PDFs
    if (file.mimetype === 'text/plain' || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only text files and PDFs are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Analyze resume and job description
  app.post("/api/analyze", async (req, res) => {
    try {
      const validatedData = analyzeRequestSchema.parse(req.body);
      
      const analysisResult = await analyzeResumeJobAlignment(
        validatedData.resumeText,
        validatedData.jobDescription,
        validatedData.additionalContext
      );

      const analysis = await storage.createAnalysis({
        resumeText: validatedData.resumeText,
        jobDescription: validatedData.jobDescription,
        additionalContext: validatedData.additionalContext,
        alignmentScore: analysisResult.alignmentScore,
        strengths: analysisResult.strengths,
        gaps: analysisResult.gaps,
        formattingSuggestions: analysisResult.formattingSuggestions,
        interviewQuestions: analysisResult.interviewQuestions,
      });

      res.json(analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      } else {
        res.status(500).json({ 
          message: error instanceof Error ? error.message : "Failed to analyze resume"
        });
      }
    }
  });

  // Upload resume file
  app.post("/api/upload-resume", upload.single('resume'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let text = '';
      
      if (req.file.mimetype === 'text/plain') {
        text = req.file.buffer.toString('utf-8');
      } else if (req.file.mimetype === 'application/pdf') {
        try {
          const pdfParse = require('pdf-parse');
          const pdfData = await pdfParse(req.file.buffer);
          text = pdfData.text;
        } catch (error) {
          console.error('PDF parsing error:', error);
          return res.status(400).json({ 
            message: "Failed to parse PDF file. Please ensure it's a valid PDF with readable text."
          });
        }
      }

      if (text.length < 50) {
        return res.status(400).json({ message: "Resume text is too short" });
      }

      res.json({ text });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process uploaded file"
      });
    }
  });

  // Fetch job description from URL
  app.post("/api/fetch-job-url", async (req, res) => {
    try {
      const { url } = z.object({ url: z.string().url() }).parse(req.body);
      
      const jobDescription = await fetchJobDescriptionFromUrl(url);
      
      res.json({ jobDescription });
    } catch (error) {
      console.error("URL fetch error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid URL provided" });
      } else {
        res.status(500).json({ 
          message: error instanceof Error ? error.message : "Failed to fetch job description from URL"
        });
      }
    }
  });

  // Get analysis by ID
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }

      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to retrieve analysis"
      });
    }
  });

  // Get all analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Get analyses error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to retrieve analyses"
      });
    }
  });

  // System status endpoint
  app.get("/api/status", async (req, res) => {
    try {
      const hasDatabase = !!process.env.DATABASE_URL;
      let databaseConnected = false;
      
      if (hasDatabase) {
        try {
          // Test database connection by attempting to get analyses
          await storage.getAllAnalyses();
          databaseConnected = true;
        } catch (error) {
          console.log("Database connection test failed, using memory storage");
          databaseConnected = false;
        }
      }

      res.json({
        status: "ok",
        database: databaseConnected,
        storage: databaseConnected ? "database" : "memory",
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        database: false,
        storage: "memory",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
