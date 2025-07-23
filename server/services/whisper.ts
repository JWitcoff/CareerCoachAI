import OpenAI from "openai";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { analyzeAndDiarizeSpeakers } from "./speaker-analyzer";

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

// Advanced speaker diarization function
function performSpeakerDiarization(transcript: string): string {
  console.log("Performing speaker diarization...");
  
  // Clean up the transcript first
  const cleanedTranscript = transcript
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*([A-Z])/g, '$1\n$2')
    .trim();

  // Split into sentences and analyze patterns
  const sentences = cleanedTranscript.split(/\n+/).filter(s => s.trim().length > 10);
  
  if (sentences.length === 0) {
    return "Justin: " + transcript;
  }

  let result = '';
  let currentSpeaker = 0;
  const speakerNames = ['Justin', 'Cat'];
  let consecutiveSentences = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    // Detect conversation patterns that suggest speaker changes
    const isQuestionResponse = sentence.toLowerCase().match(/^(yes|no|right|exactly|sure|well|but|however|i think|actually|definitely)/);
    const isDirectResponse = i > 0 && sentences[i-1].includes('?');
    const hasConversationalMarkers = sentence.toLowerCase().match(/\b(you|your|me|my|i|we)\b/);
    
    // More aggressive switch speaker logic
    const shouldSwitch = 
      (consecutiveSentences >= 2) || // Switch every 2 sentences
      (isQuestionResponse && consecutiveSentences > 0) ||
      (isDirectResponse && consecutiveSentences > 0) ||
      (i > 0 && sentence.toLowerCase().startsWith('well')) ||
      (i > 0 && sentence.toLowerCase().startsWith('but')) ||
      (i > 0 && sentence.toLowerCase().startsWith('so')) ||
      (i > 0 && sentence.toLowerCase().startsWith('yeah')) ||
      (i > 0 && sentence.toLowerCase().startsWith('yes')) ||
      (i > 0 && sentence.toLowerCase().startsWith('no')) ||
      (i > 0 && sentence.toLowerCase().startsWith('right')) ||
      (i > 0 && sentence.toLowerCase().startsWith('exactly')) ||
      (i > 0 && sentence.toLowerCase().startsWith('actually')) ||
      (consecutiveSentences >= 1 && sentence.length < 30); // Short responses likely from other speaker

    if (shouldSwitch) {
      currentSpeaker = (currentSpeaker + 1) % speakerNames.length;
      consecutiveSentences = 0;
    }

    result += `${speakerNames[currentSpeaker]}: ${sentence}\n\n`;
    consecutiveSentences++;
  }

  return result.trim();
}

// Enhanced transcription with detailed timestamps for better speaker identification
async function transcribeWithTimestamps(audioPath: string): Promise<string> {
  console.log("Transcribing with detailed analysis for speaker identification...");
  
  const audioReadStream = fs.createReadStream(audioPath);

  try {
    // Get verbose transcription with timestamps
    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      response_format: "verbose_json",
      language: "en"
    });

    console.log("Processing transcript segments for speaker identification...");

    // If we have segments with timestamps, use them for better speaker detection
    if (response.segments && response.segments.length > 0) {
      let result = '';
      let currentSpeaker = 0;
      const speakerNames = ['Justin', 'Cat'];
      let lastEndTime = 0;

      for (let i = 0; i < response.segments.length; i++) {
        const segment = response.segments[i];
        const pauseDuration = segment.start - lastEndTime;
        
        // More aggressive speaker change detection
        const longPause = pauseDuration > 0.8; // Reduced threshold for faster speaker switching
        const mediumPause = pauseDuration > 0.4;
        const shortUtterance = segment.text.trim().length < 30;
        const veryShortUtterance = segment.text.trim().length < 15;
        
        // Enhanced conversational markers
        const conversationalMarker = segment.text.toLowerCase().match(/^(yes|no|right|okay|sure|well|but|so|i think|actually|definitely|exactly|absolutely|totally|yeah|yep|uh|um|oh|ah)/);
        const questionResponse = segment.text.toLowerCase().match(/^(yes|no|right|exactly|sure|absolutely|definitely|of course|not really|maybe|probably)/);
        const interruptionMarker = segment.text.toLowerCase().match(/^(but|however|actually|wait|hold on|sorry|excuse me)/);
        
        // Force speaker changes more frequently
        const shouldSwitch = i > 0 && (
          longPause || 
          (mediumPause && (conversationalMarker || shortUtterance)) ||
          (questionResponse && veryShortUtterance) ||
          interruptionMarker ||
          (i % 3 === 0 && mediumPause) // Force switch every 3 segments with medium pause
        );
        
        if (shouldSwitch) {
          currentSpeaker = (currentSpeaker + 1) % speakerNames.length;
        }

        const cleanText = segment.text.trim();
        if (cleanText) {
          result += `${speakerNames[currentSpeaker]}: ${cleanText}\n\n`;
        }
        
        lastEndTime = segment.end;
      }

      return result.trim();
    }

    // Fallback to basic text processing if no segments available
    return performSpeakerDiarization(response.text || '');
    
  } catch (error) {
    console.warn("Verbose transcription failed, falling back to basic transcription:", error);
    
    // Fallback to simple transcription
    const audioReadStreamFallback = fs.createReadStream(audioPath);
    const simpleResponse = await openai.audio.transcriptions.create({
      file: audioReadStreamFallback,
      model: "whisper-1",
      response_format: "text",
    });

    return performSpeakerDiarization(simpleResponse);
  }
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
        const chunks = await splitAudioIntoChunks(compressedPath, 5);
        chunksToCleanup = [...chunks, path.dirname(chunks[0])];
        
        // Transcribe each chunk with speaker identification
        const transcriptions: string[] = [];
        let globalSpeakerState = 0; // Track speaker across chunks
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`Transcribing chunk ${i + 1}/${chunks.length} with speaker identification...`);
          
          const chunkTranscript = await transcribeWithTimestamps(chunks[i]);
          
          // Adjust speaker continuity across chunks
          if (i > 0) {
            // Ensure speaker continuity from previous chunk
            const lines = chunkTranscript.split('\n').filter(line => line.trim());
            const adjustedLines = lines.map(line => {
              if (line.startsWith('Justin:')) {
                return globalSpeakerState === 0 ? line : line.replace('Justin:', 'Cat:');
              } else if (line.startsWith('Cat:')) {
                return globalSpeakerState === 1 ? line : line.replace('Cat:', 'Justin:');
              }
              return line;
            });
            
            transcriptions.push(adjustedLines.join('\n'));
            
            // Update global speaker state
            const lastLine = adjustedLines[adjustedLines.length - 1];
            globalSpeakerState = lastLine?.startsWith('Justin:') ? 0 : 1;
          } else {
            transcriptions.push(chunkTranscript);
            
            // Set initial speaker state
            const lastLine = chunkTranscript.split('\n').filter(line => line.trim()).pop();
            globalSpeakerState = lastLine?.startsWith('Justin:') ? 0 : 1;
          }
        }
        
        const fullTranscript = transcriptions.join('\n\n').trim();
        
        // Apply AI speaker analysis to the combined transcript
        const aiDiarizedTranscript = await analyzeAndDiarizeSpeakers(fullTranscript);
        return { text: aiDiarizedTranscript };
      }
    }

    // Transcribe the processed file with AI-powered speaker identification
    const rawTranscript = await transcribeWithTimestamps(processedPath);
    
    // Use AI to intelligently identify speakers
    const aiDiarizedTranscript = await analyzeAndDiarizeSpeakers(rawTranscript);
    return { text: aiDiarizedTranscript };
    
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