import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioFilePath: string): Promise<{ text: string }> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      response_format: "text",
    });

    return { text: transcription };
  } catch (error) {
    console.error("Whisper transcription error:", error);
    throw new Error("Failed to transcribe audio: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

export async function analyzeInterviewTranscript(transcript: string): Promise<{
  overallScore: number;
  communicationScore: number;
  contentScore: number;
  strengths: string[];
  improvements: string[];
  keyInsights: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert interview coach analyzing interview transcripts. Provide detailed analysis in JSON format with:
          - overallScore: Overall performance score (1-100)
          - communicationScore: Communication clarity and confidence (1-100)
          - contentScore: Content quality and relevance (1-100)
          - strengths: Array of 3-5 specific strengths demonstrated
          - improvements: Array of 3-5 specific areas for improvement
          - keyInsights: Array of 3-5 key insights about interview performance
          
          Focus on concrete, actionable feedback based on communication style, answer structure, confidence, technical knowledge, and overall professionalism.`
        },
        {
          role: "user",
          content: `Analyze this interview transcript and provide detailed feedback:\n\n${transcript}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      overallScore: Math.max(1, Math.min(100, Math.round(analysis.overallScore || 50))),
      communicationScore: Math.max(1, Math.min(100, Math.round(analysis.communicationScore || 50))),
      contentScore: Math.max(1, Math.min(100, Math.round(analysis.contentScore || 50))),
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements : [],
      keyInsights: Array.isArray(analysis.keyInsights) ? analysis.keyInsights : [],
    };
  } catch (error) {
    console.error("Interview analysis error:", error);
    throw new Error("Failed to analyze interview: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}