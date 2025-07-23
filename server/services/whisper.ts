import OpenAI from "openai";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

// Use system ffmpeg which has all codecs
// ffmpeg.setFfmpegPath() - let it use system ffmpeg

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const WHISPER_MAX_SIZE = 25 * 1024 * 1024; // 25MB limit for Whisper API

async function compressAudioForWhisper(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(path.dirname(inputPath), `compressed_${Date.now()}.mp3`);
    
    ffmpeg(inputPath)
      .audioCodec('libmp3lame') // Use specific MP3 encoder
      .audioBitrate('32k') // Aggressive compression for faster processing
      .audioFrequency(16000) // Lower sample rate suitable for speech
      .audioChannels(1) // Mono audio for speech
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err: any) => {
        reject(new Error(`Audio compression failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

async function splitAudioIntoChunks(inputPath: string, chunkDurationMinutes: number = 10): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(path.dirname(inputPath), `chunks_${Date.now()}`);
    fs.mkdirSync(outputDir, { recursive: true });
    
    const chunkPattern = path.join(outputDir, 'chunk_%03d.mp3');
    
    ffmpeg(inputPath)
      .audioCodec('libmp3lame') // Use specific MP3 encoder
      .audioBitrate('32k') // Aggressive compression
      .audioFrequency(16000)
      .audioChannels(1) // Mono for faster processing
      .outputOptions([
        '-f', 'segment',
        '-segment_time', `${chunkDurationMinutes * 60}`,
        '-reset_timestamps', '1'
      ])
      .on('end', () => {
        // Get all chunk files
        const chunks = fs.readdirSync(outputDir)
          .filter(file => file.startsWith('chunk_') && file.endsWith('.mp3'))
          .sort()
          .map(file => path.join(outputDir, file));
        resolve(chunks);
      })
      .on('error', (err: any) => {
        reject(new Error(`Audio splitting failed: ${err.message}`));
      })
      .save(chunkPattern);
  });
}

export async function transcribeAudio(audioFilePath: string): Promise<{ text: string }> {
  let processedPath = audioFilePath;
  let chunksToCleanup: string[] = [];
  let tempFilesToCleanup: string[] = [];

  try {
    // Check file size first
    const stats = fs.statSync(audioFilePath);
    
    if (stats.size > WHISPER_MAX_SIZE) {
      console.log(`File size ${stats.size} exceeds Whisper limit. Processing...`);
      
      // First try compression
      console.log("Compressing audio...");
      const compressedPath = await compressAudioForWhisper(audioFilePath);
      tempFilesToCleanup.push(compressedPath);
      
      const compressedStats = fs.statSync(compressedPath);
      
      if (compressedStats.size <= WHISPER_MAX_SIZE) {
        // Compression worked, use compressed file
        processedPath = compressedPath;
        console.log(`Compressed file size: ${compressedStats.size}`);
      } else {
        // Still too large, need to split into chunks
        console.log("File still too large after compression. Splitting into chunks...");
        const chunks = await splitAudioIntoChunks(compressedPath, 5); // 5-minute chunks for faster parallel processing
        chunksToCleanup = [...chunks, path.dirname(chunks[0])]; // Include directory for cleanup
        
        // Transcribe each chunk and combine
        const transcriptions: string[] = [];
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`Transcribing chunk ${i + 1}/${chunks.length}...`);
          const chunkStream = fs.createReadStream(chunks[i]);
          
          const chunkTranscription = await openai.audio.transcriptions.create({
            file: chunkStream,
            model: "whisper-1",
            response_format: "text",
          });
          
          transcriptions.push(chunkTranscription);
        }
        
        // Combine all transcriptions
        const fullTranscript = transcriptions.join(' ').trim();
        return { text: fullTranscript };
      }
    }

    // Transcribe the processed file (original or compressed)
    const audioReadStream = fs.createReadStream(processedPath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      response_format: "text",
    });

    return { text: transcription };
  } catch (error) {
    console.error("Whisper transcription error:", error);
    throw new Error("Failed to transcribe audio: " + (error instanceof Error ? error.message : "Unknown error"));
  } finally {
    // Cleanup temporary files
    for (const tempFile of tempFilesToCleanup) {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (err) {
        console.error(`Failed to cleanup temp file ${tempFile}:`, err);
      }
    }
    
    // Cleanup chunks and directory
    for (const chunk of chunksToCleanup) {
      try {
        if (fs.existsSync(chunk)) {
          if (fs.statSync(chunk).isDirectory()) {
            fs.rmSync(chunk, { recursive: true, force: true });
          } else {
            fs.unlinkSync(chunk);
          }
        }
      } catch (err) {
        console.error(`Failed to cleanup chunk ${chunk}:`, err);
      }
    }
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