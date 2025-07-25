import puppeteer from 'puppeteer';

export async function fetchJobDescriptionWithBrowser(url: string): Promise<string> {
  let browser;
  try {
    console.log(`🚀 Starting browser for dynamic content: ${url}`);
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log(`📄 Loading page...`);
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`🔍 Extracting job description...`);
    
    // Try multiple extraction strategies
    const jobDescription = await page.evaluate(() => {
      // Workday-specific selectors
      const workdaySelectors = [
        '[data-automation-id="jobPostingDescription"]',
        '[data-automation-id="jobDetails"]',
        '.jobDetails',
        '.jobDescription',
        '.wd-popup-content'
      ];

      // General job description selectors
      const generalSelectors = [
        '.job-description',
        '.job_description',
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText',
        '.posting-description',
        '.job-post-description',
        '[data-testid="job-description"]',
        '[data-test="JobDescription"]'
      ];

      // Try all selectors
      for (const selector of [...workdaySelectors, ...generalSelectors]) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim();
          if (text && text.length > 100) {
            console.log(`Found content with selector: ${selector}`);
            return text;
          }
        }
      }

      // Fallback: Look for keywords in all text
      const allText = document.body.textContent || '';
      const jobKeywords = [
        'responsibilities', 'requirements', 'qualifications', 'experience', 
        'skills', 'duties', 'role', 'position', 'job description'
      ];

      const sentences = allText.split(/[.!?]+/);
      const relevantSentences = sentences.filter(sentence => {
        const lower = sentence.toLowerCase();
        return jobKeywords.some(keyword => lower.includes(keyword)) && sentence.length > 50;
      });

      if (relevantSentences.length > 3) {
        return relevantSentences.slice(0, 20).join('. ').trim();
      }

      // Last resort: return substantial content
      if (allText.length > 500) {
        return allText.slice(0, 3000);
      }

      return '';
    });

    if (!jobDescription || jobDescription.length < 50) {
      throw new Error('No substantial job description content found on the page');
    }

    console.log(`✅ Successfully extracted ${jobDescription.length} characters`);
    return jobDescription;

  } catch (error) {
    console.error('Browser scraping error:', error);
    throw new Error(`Failed to extract job description: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}