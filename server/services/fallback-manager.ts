import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  fallbackModel: string;
  primaryModel: string;
}

interface FallbackStats {
  totalRequests: number;
  fallbacksUsed: number;
  quotaErrors: number;
  rateLimitErrors: number;
  lastFallback: Date | null;
}

export class FallbackManager {
  private config: RetryConfig;
  private stats: FallbackStats;

  constructor() {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      fallbackModel: "gpt-3.5-turbo",
      primaryModel: "gpt-4o-mini"
    };

    this.stats = {
      totalRequests: 0,
      fallbacksUsed: 0,
      quotaErrors: 0,
      rateLimitErrors: 0,
      lastFallback: null
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number): number {
    const delay = Math.min(
      this.config.baseDelay * Math.pow(2, attempt),
      this.config.maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  private shouldUseFallback(error: any): boolean {
    if (error?.status === 429) return true; // Rate limit
    if (error?.code === 'insufficient_quota') return true; // Quota exceeded
    if (error?.message?.includes('quota')) return true;
    if (error?.message?.includes('rate limit')) return true;
    return false;
  }

  private logFallback(error: any, attempt: number, usingFallback: boolean): void {
    const errorType = error?.status === 429 ? 'rate_limit' : 'quota';
    console.log(`🔄 API Error (attempt ${attempt}): ${errorType} - ${usingFallback ? 'using fallback model' : 'retrying primary'}`);
    
    if (errorType === 'quota') this.stats.quotaErrors++;
    if (errorType === 'rate_limit') this.stats.rateLimitErrors++;
    
    if (usingFallback) {
      this.stats.fallbacksUsed++;
      this.stats.lastFallback = new Date();
    }
  }

  public async executeWithFallback<T>(
    apiCall: (model: string) => Promise<T>,
    enableFallback: boolean = true
  ): Promise<T> {
    this.stats.totalRequests++;
    let lastError: any;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        // First attempt: use primary model
        // Subsequent attempts: use fallback if enabled and error is quota/rate-limit related
        const shouldUseFallbackModel = 
          attempt > 0 && 
          enableFallback && 
          lastError && 
          this.shouldUseFallback(lastError);

        const model = shouldUseFallbackModel ? this.config.fallbackModel : this.config.primaryModel;
        
        if (shouldUseFallbackModel) {
          this.logFallback(lastError, attempt + 1, true);
        }

        const result = await apiCall(model);
        
        // Log successful recovery
        if (attempt > 0) {
          console.log(`✅ API call succeeded on attempt ${attempt + 1} using ${model}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // If this is not a quota/rate-limit error, don't retry
        if (!this.shouldUseFallback(error)) {
          console.log(`❌ Non-retryable error: ${error}`);
          throw error;
        }

        this.logFallback(error, attempt + 1, false);

        // If this is the last attempt, throw the error
        if (attempt === this.config.maxRetries - 1) {
          console.log(`❌ All retry attempts exhausted`);
          throw error;
        }

        // Wait before retrying
        const delayMs = this.calculateDelay(attempt);
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await this.delay(delayMs);
      }
    }

    throw lastError;
  }

  // Wrapper methods for common OpenAI operations
  public async chatCompletion(params: {
    messages: any[];
    model?: string;
    response_format?: any;
    max_tokens?: number;
    temperature?: number;
  }): Promise<any> {
    return this.executeWithFallback(async (model) => {
      return await openai.chat.completions.create({
        ...params,
        model
      });
    });
  }

  public getStats(): FallbackStats & { fallbackRate: number } {
    const fallbackRate = this.stats.totalRequests > 0 
      ? (this.stats.fallbacksUsed / this.stats.totalRequests) * 100 
      : 0;

    return {
      ...this.stats,
      fallbackRate: Math.round(fallbackRate * 100) / 100
    };
  }

  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      fallbacksUsed: 0,
      quotaErrors: 0,
      rateLimitErrors: 0,
      lastFallback: null
    };
  }

  public updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const fallbackManager = new FallbackManager();