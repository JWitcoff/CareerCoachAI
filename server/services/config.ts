// Token optimization configuration
export interface TokenConfig {
  enableFullAnalysis: boolean;
  useEconomyModel: boolean;
  maxChunkSize: number;
}

export const getTokenConfig = (): TokenConfig => ({
  enableFullAnalysis: true, // OpenAI quota restored - enable real AI analysis
  useEconomyModel: process.env.USE_ECONOMY_MODEL !== 'false', // Default to economy mode
  maxChunkSize: parseInt(process.env.MAX_CHUNK_SIZE || '3000')
});

// Debug logging for token usage
export const logTokenUsage = (operation: string, inputLength: number, model: string, chunksProcessed?: number) => {
  console.log(`=== TOKEN USAGE: ${operation} ===`);
  console.log(`Input length: ${inputLength} characters`);
  console.log(`Model: ${model}`);
  if (chunksProcessed) {
    console.log(`Chunks processed: ${chunksProcessed}`);
  }
  console.log(`Estimated tokens: ~${Math.ceil(inputLength / 4)}`);
};