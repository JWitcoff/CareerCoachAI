import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeRequestSchema, insertInterviewAnalysisSchema, insertInterviewChatSchema } from "@shared/schema";
import { analyzeResumeJobAlignment } from "./services/openai";
import { fetchJobDescriptionFromUrl } from "./services/scraper";
import { transcribeAudio, analyzeInterviewTranscript } from "./services/whisper";
import { generateChatResponse } from "./services/interview-chat";
import multer from "multer";
import { z } from "zod";
import type { Request } from "express";
import fs from "fs";
import path from "path";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Configure multer for file uploads (resume files)
const resumeUpload = multer({
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

// Configure multer for audio uploads
const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `interview_${timestamp}${ext}`);
    }
  }),
  limits: {
    fileSize: 60 * 1024 * 1024, // 60MB limit for audio files (with buffer)
    fieldSize: 60 * 1024 * 1024, // Field size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files: .wav, .m4a, .mp3
    const allowedMimeTypes = ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a'];
    const allowedExtensions = ['.wav', '.mp3', '.m4a'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (.wav, .mp3, .m4a) are allowed'));
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
  app.post("/api/upload-resume", resumeUpload.single('resume'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let text = '';
      
      if (req.file.mimetype === 'text/plain') {
        text = req.file.buffer.toString('utf-8');
      } else if (req.file.mimetype === 'application/pdf') {
        try {
          // Lazy load pdf-parse only when needed to avoid import issues
          let pdfParse;
          try {
            pdfParse = require('pdf-parse');
          } catch (requireError) {
            // If require fails, try dynamic import
            const pdfModule = await import('pdf-parse');
            pdfParse = pdfModule.default;
          }
          
          const pdfData = await pdfParse(req.file.buffer);
          text = pdfData.text.trim();
          
          if (!text || text.length < 10) {
            return res.status(400).json({ 
              message: "The PDF appears to be empty or contains no readable text. Please try a different PDF or paste your resume text manually."
            });
          }
        } catch (error) {
          console.error('PDF parsing error:', error);
          // For now, provide helpful message and suggest text paste
          return res.status(400).json({ 
            message: "Unable to extract text from PDF. Please copy and paste your resume text directly into the text field instead."
          });
        }
      } else {
        return res.status(400).json({ 
          message: "Unsupported file type. Please upload a .txt or .pdf file."
        });
      }

      if (text.length < 50) {
        return res.status(400).json({ 
          message: "The extracted text is too short to analyze. Please ensure your resume contains sufficient content."
        });
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

  // Upload and analyze interview audio
  app.post("/api/analyze-interview", audioUpload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }

      const audioPath = req.file.path;
      const fileName = req.file.filename;

      // Transcribe audio using Whisper
      const { text: transcript } = await transcribeAudio(audioPath);
      
      if (!transcript || transcript.trim().length < 10) {
        // Clean up the uploaded file
        fs.unlink(audioPath, () => {});
        return res.status(400).json({ 
          message: "Unable to transcribe audio or transcript is too short. Please ensure the audio is clear and contains speech." 
        });
      }

      // Analyze the transcript using GPT-4o
      const analysisResult = await analyzeInterviewTranscript(transcript);

      // Store the analysis in database
      const analysis = await storage.createInterviewAnalysis({
        audioFileName: fileName,
        transcript,
        overallScore: analysisResult.overallScore,
        communicationScore: analysisResult.communicationScore,
        contentScore: analysisResult.contentScore,
        strengths: analysisResult.strengths,
        improvements: analysisResult.improvements,
        keyInsights: analysisResult.keyInsights,
      });

      // Clean up the uploaded file after processing
      fs.unlink(audioPath, (err) => {
        if (err) console.error('Error deleting audio file:', err);
      });

      res.json(analysis);
    } catch (error) {
      console.error("Interview analysis error:", error);
      
      // Clean up the uploaded file on error
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze interview audio"
      });
    }
  });

  // Download transcript
  app.get("/api/interview/:id/transcript", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getInterviewAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Interview analysis not found" });
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="interview_transcript_${analysis.id}.txt"`);
      res.send(analysis.transcript);
    } catch (error) {
      console.error("Failed to download transcript:", error);
      res.status(500).json({ message: "Failed to download transcript" });
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

  // Chat with AI about interview analysis
  app.post("/api/interview/:id/chat", async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);
      if (isNaN(interviewId)) {
        return res.status(400).json({ message: "Invalid interview ID" });
      }

      const { message } = z.object({ message: z.string().min(1) }).parse(req.body);
      
      // Get the interview analysis for context
      const analysis = await storage.getInterviewAnalysis(interviewId);
      if (!analysis) {
        return res.status(404).json({ message: "Interview analysis not found" });
      }

      // Generate AI response based on the analysis and user question
      const aiResponse = await generateChatResponse(analysis, message);

      // Store the chat message and response
      const chat = await storage.createInterviewChat({
        interviewAnalysisId: interviewId,
        message,
        response: aiResponse,
      });

      res.json(chat);
    } catch (error) {
      console.error("Interview chat error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process chat message"
      });
    }
  });

  // Get chat history for an interview
  app.get("/api/interview/:id/chat", async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);
      if (isNaN(interviewId)) {
        return res.status(400).json({ message: "Invalid interview ID" });
      }

      const chats = await storage.getInterviewChats(interviewId);
      res.json(chats);
    } catch (error) {
      console.error("Get chat history error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get chat history"
      });
    }
  });

  // Get all interview analyses
  app.get("/api/interview-analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllInterviewAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Failed to fetch interview analyses:", error);
      res.status(500).json({ message: "Failed to fetch interview analyses" });
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
