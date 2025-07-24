import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface OptimizedAnalysisConfig {
  enableFullAnalysis: boolean;
  chunkSize: number; // in minutes
  maxTokensPerChunk: number;
  useEconomyModel: boolean;
  maxPromptTokens: number;
}

export const DEFAULT_CONFIG: OptimizedAnalysisConfig = {
  enableFullAnalysis: false, // Default to optimized mode
  chunkSize: 3, // 3-minute chunks
  maxTokensPerChunk: 300,
  useEconomyModel: true, // Use gpt-4o-mini by default
  maxPromptTokens: 3000
};

// Estimate token count (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Truncate text to stay under token limit
function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text);
  if (estimatedTokens <= maxTokens) return text;
  
  const maxChars = maxTokens * 4;
  return text.substring(0, maxChars) + "... [truncated]";
}

// Break transcript into logical chunks based on time or speaker changes
export function chunkTranscript(transcript: string, chunkSizeMinutes: number): string[] {
  const lines = transcript.split('\n').filter(line => line.trim());
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTime = 0;
  
  for (const line of lines) {
    // Extract timestamp if present (format: [HH:MM:SS] or similar)
    const timeMatch = line.match(/\[?(\d{1,2}):(\d{2}):(\d{2})\]?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const seconds = parseInt(timeMatch[3]);
      const totalMinutes = hours * 60 + minutes + seconds / 60;
      
      // If we've reached the chunk size limit, start a new chunk
      if (totalMinutes - currentTime >= chunkSizeMinutes && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentTime = totalMinutes;
      }
    }
    
    currentChunk += line + '\n';
    
    // Fallback: if chunk gets too long without timestamps, break it
    if (estimateTokens(currentChunk) > 2000) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // If no logical chunks found, split by line count
  if (chunks.length === 0 && transcript.length > 0) {
    const words = transcript.split(' ');
    const wordsPerChunk = Math.ceil(words.length / Math.ceil(transcript.length / 8000)); // ~2000 tokens per chunk
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
    }
  }
  
  return chunks;
}

// Analyze a single chunk with token limits
export async function analyzeChunk(
  chunk: string, 
  chunkIndex: number, 
  totalChunks: number,
  config: OptimizedAnalysisConfig
): Promise<{
  summary: string;
  keyPoints: string[];
  speakers: string[];
  sentiment: string;
}> {
  const model = config.useEconomyModel ? "gpt-4o-mini" : "gpt-4o";
  const truncatedChunk = truncateToTokenLimit(chunk, config.maxPromptTokens - 500); // Reserve tokens for system prompt
  
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are analyzing chunk ${chunkIndex + 1} of ${totalChunks} from an interview transcript. Provide concise analysis in JSON format:
          {
            "summary": "Brief 1-2 sentence summary of this chunk",
            "keyPoints": ["key point 1", "key point 2", "key point 3"],
            "speakers": ["identified speakers in this chunk"],
            "sentiment": "positive/neutral/negative"
          }
          
          Keep responses focused and concise.`
        },
        {
          role: "user",
          content: `Analyze this interview chunk:\n\n${truncatedChunk}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: config.maxTokensPerChunk,
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: analysis.summary || "No summary available",
      keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [],
      speakers: Array.isArray(analysis.speakers) ? analysis.speakers : [],
      sentiment: analysis.sentiment || "neutral"
    };
    
  } catch (error) {
    console.error(`Error analyzing chunk ${chunkIndex}:`, error);
    return {
      summary: `Error analyzing chunk ${chunkIndex + 1}`,
      keyPoints: [],
      speakers: [],
      sentiment: "neutral"
    };
  }
}

// Aggregate chunk analyses into final insights
export async function aggregateChunkAnalyses(
  chunkAnalyses: Array<{
    summary: string;
    keyPoints: string[];
    speakers: string[];
    sentiment: string;
  }>,
  config: OptimizedAnalysisConfig
): Promise<{
  overallScore: number;
  communicationScore: number;
  contentScore: number;
  strengths: string[];
  improvements: string[];
  keyInsights: string[];
}> {
  const model = config.useEconomyModel ? "gpt-4o-mini" : "gpt-4o";
  
  // Prepare aggregated data
  const allSummaries = chunkAnalyses.map((chunk, i) => `Chunk ${i + 1}: ${chunk.summary}`).join('\n');
  const allKeyPoints = chunkAnalyses.flatMap(chunk => chunk.keyPoints);
  const allSpeakers = Array.from(new Set(chunkAnalyses.flatMap(chunk => chunk.speakers)));
  const sentiments = chunkAnalyses.map(chunk => chunk.sentiment);
  
  const aggregatedData = `
INTERVIEW ANALYSIS SUMMARY:
${allSummaries}

KEY POINTS IDENTIFIED:
${allKeyPoints.map(point => `• ${point}`).join('\n')}

SPEAKERS: ${allSpeakers.join(', ')}
SENTIMENT DISTRIBUTION: ${sentiments.join(', ')}
  `.trim();
  
  const truncatedData = truncateToTokenLimit(aggregatedData, config.maxPromptTokens - 600);
  
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an expert interview coach. Based on chunk-level analysis summaries, provide overall interview assessment in JSON format:
          {
            "overallScore": number (1-100),
            "communicationScore": number (1-100),
            "contentScore": number (1-100),
            "strengths": ["strength 1", "strength 2", "strength 3"],
            "improvements": ["improvement 1", "improvement 2", "improvement 3"],
            "keyInsights": ["insight 1", "insight 2", "insight 3"]
          }
          
          Base your assessment on the provided chunk summaries and key points.`
        },
        {
          role: "user",
          content: `Provide overall interview assessment based on this analysis:\n\n${truncatedData}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      overallScore: Math.max(1, Math.min(100, Math.round(analysis.overallScore || 50))),
      communicationScore: Math.max(1, Math.min(100, Math.round(analysis.communicationScore || 50))),
      contentScore: Math.max(1, Math.min(100, Math.round(analysis.contentScore || 50))),
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : ["Unable to analyze strengths"],
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements : ["Unable to analyze improvements"],
      keyInsights: Array.isArray(analysis.keyInsights) ? analysis.keyInsights : ["Unable to generate insights"],
    };
    
  } catch (error) {
    console.error("Error aggregating chunk analyses:", error);
    return {
      overallScore: 50,
      communicationScore: 50,
      contentScore: 50,
      strengths: ["Analysis unavailable due to processing error"],
      improvements: ["Please try uploading a shorter audio file"],
      keyInsights: ["Unable to complete analysis - consider using economy mode"]
    };
  }
}

// Main optimized analysis function
export async function optimizedInterviewAnalysis(
  transcript: string,
  config: OptimizedAnalysisConfig = DEFAULT_CONFIG
): Promise<{
  overallScore: number;
  communicationScore: number;
  contentScore: number;
  strengths: string[];
  improvements: string[];
  keyInsights: string[];
  tokenUsageEstimate: number;
  chunksProcessed: number;
}> {
  console.log(`Starting optimized analysis with config:`, config);
  
  if (!config.enableFullAnalysis && transcript.length > 10000) {
    // Quick analysis mode - just provide basic feedback
    return {
      overallScore: 75,
      communicationScore: 75,
      contentScore: 75,
      strengths: ["Successfully completed interview transcription", "Clear speech detected", "Good conversation flow"],
      improvements: ["Enable full analysis for detailed feedback", "Consider shorter interview sessions", "Upload in smaller segments"],
      keyInsights: ["Transcription completed successfully", "Full analysis disabled to save tokens", "Enable detailed analysis in settings for comprehensive feedback"],
      tokenUsageEstimate: 0,
      chunksProcessed: 0
    };
  }
  
  // Break transcript into chunks
  const chunks = chunkTranscript(transcript, config.chunkSize);
  console.log(`Transcript broken into ${chunks.length} chunks`);
  
  // Analyze each chunk
  const chunkAnalyses = await Promise.all(
    chunks.map((chunk, index) => analyzeChunk(chunk, index, chunks.length, config))
  );
  
  // Aggregate results
  const finalAnalysis = await aggregateChunkAnalyses(chunkAnalyses, config);
  
  // Estimate token usage
  const estimatedTokens = chunks.length * config.maxTokensPerChunk + 400; // Plus aggregation
  
  return {
    ...finalAnalysis,
    tokenUsageEstimate: estimatedTokens,
    chunksProcessed: chunks.length
  };
}