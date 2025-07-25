import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class FileCache {
  private cacheDir: string;
  private defaultTTL: number;

  constructor(cacheDir = './cache', defaultTTL = 24 * 60 * 60 * 1000) { // 24 hours default
    this.cacheDir = cacheDir;
    this.defaultTTL = defaultTTL;
    this.ensureCacheDir();
  }

  private async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  private generateKey(input: string, context?: string): string {
    const combined = context ? `${context}:${input}` : input;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  private getFilePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }

  async get<T>(input: string, context?: string): Promise<T | null> {
    try {
      const key = this.generateKey(input, context);
      const filePath = this.getFilePath(key);
      
      const data = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry = JSON.parse(data);
      
      // Check if cache entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.delete(input, context);
        return null;
      }
      
      console.log(`Cache hit for key: ${key.slice(0, 8)}...`);
      return entry.data as T;
    } catch (error) {
      // Cache miss or error reading
      return null;
    }
  }

  async set<T>(input: string, data: T, context?: string, ttl?: number): Promise<void> {
    try {
      const key = this.generateKey(input, context);
      const filePath = this.getFilePath(key);
      
      const entry: CacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL
      };
      
      await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
      console.log(`Cache set for key: ${key.slice(0, 8)}...`);
    } catch (error) {
      console.error('Failed to set cache entry:', error);
    }
  }

  async delete(input: string, context?: string): Promise<void> {
    try {
      const key = this.generateKey(input, context);
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
    } catch (error) {
      // File doesn't exist or other error - ignore
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)))
      );
      console.log('Cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getStats(): Promise<{ count: number; totalSize: number }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;
      
      for (const file of files) {
        const stats = await fs.stat(path.join(this.cacheDir, file));
        totalSize += stats.size;
      }
      
      return { count: files.length, totalSize };
    } catch (error) {
      return { count: 0, totalSize: 0 };
    }
  }
}

// Singleton instance
export const cache = new FileCache();

// Helper function to create cache keys for different types
export const createCacheKey = {
  interview: (transcript: string, promptType: string) => 
    `interview:${promptType}:${transcript}`,
  
  resume: (resumeText: string, jobDescription?: string) =>
    `resume:${resumeText}:${jobDescription || 'general'}`,
    
  speaker: (transcript: string, analysisType: string) =>
    `speaker:${analysisType}:${transcript}`,
    
  chat: (context: string, message: string) =>
    `chat:${context}:${message}`
};