// URL Tester for debugging job scraper
import { fetchJobDescriptionFromUrl } from './scraper';

interface TestResult {
  url: string;
  success: boolean;
  contentLength: number;
  error?: string;
  contentPreview?: string;
}

const testUrls = [
  'https://jobs.lever.co/replit',
  'https://greenhouse.io/careers',
  'https://wellfound.com/jobs', 
  'https://remote.co/remote-jobs/',
  'https://stackoverflow.com/jobs'
];

export async function testJobScraper(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log("🧪 Testing job URL scraper with various sites...");
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const content = await fetchJobDescriptionFromUrl(url);
      
      results.push({
        url,
        success: true,
        contentLength: content.length,
        contentPreview: content.slice(0, 200) + '...'
      });
      
    } catch (error) {
      results.push({
        url,
        success: false,
        contentLength: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}

export async function testSingleUrl(url: string): Promise<TestResult> {
  try {
    console.log(`🔍 Testing single URL: ${url}`);
    const content = await fetchJobDescriptionFromUrl(url);
    
    return {
      url,
      success: true,
      contentLength: content.length,
      contentPreview: content.slice(0, 300) + '...'
    };
    
  } catch (error) {
    return {
      url,
      success: false,
      contentLength: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}