import OpenAI from "openai";

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface BatchChunk {
  id: string;
  content: string;
  type: 'question' | 'answer' | 'general';
  startTime?: number;
  endTime?: number;
}

interface BatchAnalysisResult {
  chunkId: string;
  analysis: any;
}

export class BatchProcessor {
  private maxTokensPerBatch: number;
  private maxChunksPerBatch: number;

  constructor(maxTokensPerBatch = 10000, maxChunksPerBatch = 4) {
    this.maxTokensPerBatch = maxTokensPerBatch;
    this.maxChunksPerBatch = maxChunksPerBatch;
  }

  // Estimate token count (rough approximation: 4 chars = 1 token)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Group chunks into batches based on token limits
  public createBatches(chunks: BatchChunk[]): BatchChunk[][] {
    const batches: BatchChunk[][] = [];
    let currentBatch: BatchChunk[] = [];
    let currentTokenCount = 0;

    for (const chunk of chunks) {
      const chunkTokens = this.estimateTokens(chunk.content);
      
      // If adding this chunk would exceed limits, start a new batch
      if (
        (currentTokenCount + chunkTokens > this.maxTokensPerBatch) ||
        (currentBatch.length >= this.maxChunksPerBatch)
      ) {
        if (currentBatch.length > 0) {
          batches.push(currentBatch);
          currentBatch = [];
          currentTokenCount = 0;
        }
      }
      
      currentBatch.push(chunk);
      currentTokenCount += chunkTokens;
    }
    
    // Add the last batch if it has content
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }
    
    return batches;
  }

  // Process a batch of interview chunks
  public async processBatchedInterviewAnalysis(
    batch: BatchChunk[], 
    analysisType: 'interview' | 'speaker' = 'interview'
  ): Promise<BatchAnalysisResult[]> {
    const prompt = this.createBatchPrompt(batch, analysisType);
    
    try {
      console.log(`Processing batch of ${batch.length} chunks (${this.estimateTokens(prompt)} estimated tokens)`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use economy model for batching
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 3000,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Map results back to chunk IDs
      return batch.map((chunk, index) => ({
        chunkId: chunk.id,
        analysis: result.analyses?.[index] || result[`chunk_${index}`] || {}
      }));
      
    } catch (error) {
      console.error('Batch processing error:', error);
      // Return empty analysis for each chunk on error
      return batch.map(chunk => ({
        chunkId: chunk.id,
        analysis: { error: "Batch processing failed" }
      }));
    }
  }

  private createBatchPrompt(batch: BatchChunk[], analysisType: string): string {
    if (analysisType === 'interview') {
      return this.createInterviewBatchPrompt(batch);
    } else {
      return this.createSpeakerBatchPrompt(batch);
    }
  }

  private createInterviewBatchPrompt(batch: BatchChunk[]): string {
    const chunksText = batch.map((chunk, index) => 
      `## Chunk ${index} (ID: ${chunk.id})
Type: ${chunk.type}
Content: ${chunk.content}
${chunk.startTime ? `Time: ${chunk.startTime}s - ${chunk.endTime}s` : ''}`
    ).join('\n\n');

    return `Analyze the following interview chunks and provide structured feedback for each. Return JSON format:

${chunksText}

Return JSON with this structure:
{
  "analyses": [
    {
      "chunkId": "${batch[0]?.id}",
      "score": 1-10,
      "strengths": ["strength 1", "strength 2"],
      "improvements": ["improvement 1", "improvement 2"],
      "keyPoints": ["point 1", "point 2"]
    }
    // ... one object per chunk
  ]
}

Focus on communication clarity, content relevance, and professional presentation.`;
  }

  private createSpeakerBatchPrompt(batch: BatchChunk[]): string {
    const chunksText = batch.map((chunk, index) => 
      `## Segment ${index} (ID: ${chunk.id})
${chunk.content}`
    ).join('\n\n');

    return `Analyze the following conversation segments for speaker characteristics. Return JSON format:

${chunksText}

Return JSON with this structure:
{
  "analyses": [
    {
      "chunkId": "${batch[0]?.id}",
      "speakerCount": 2,
      "dominantSpeaker": "Speaker 1",
      "characteristics": {
        "Speaker 1": ["confident", "detailed"],
        "Speaker 2": ["inquisitive", "professional"]
      },
      "interactionQuality": "good"
    }
    // ... one object per chunk
  ]
}`;
  }

  // Merge batch results into a single analysis
  public mergeBatchResults(results: BatchAnalysisResult[]): any {
    const merged = {
      overallScore: 0,
      strengths: [] as string[],
      improvements: [] as string[],
      keyInsights: [] as string[],
      communicationScore: 0,
      contentScore: 0,
      chunkAnalyses: results
    };

    let totalScore = 0;
    let scoreCount = 0;

    for (const result of results) {
      if (result.analysis.score) {
        totalScore += result.analysis.score;
        scoreCount++;
      }
      
      if (result.analysis.strengths) {
        merged.strengths.push(...result.analysis.strengths);
      }
      
      if (result.analysis.improvements) {
        merged.improvements.push(...result.analysis.improvements);
      }
      
      if (result.analysis.keyPoints) {
        merged.keyInsights.push(...result.analysis.keyPoints);
      }
    }

    // Calculate average scores
    merged.overallScore = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) : 75;
    merged.communicationScore = merged.overallScore;
    merged.contentScore = merged.overallScore;

    // Remove duplicates and limit arrays
    merged.strengths = Array.from(new Set(merged.strengths)).slice(0, 6);
    merged.improvements = Array.from(new Set(merged.improvements)).slice(0, 6);
    merged.keyInsights = Array.from(new Set(merged.keyInsights)).slice(0, 8);

    return merged;
  }
}

export const batchProcessor = new BatchProcessor();