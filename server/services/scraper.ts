import * as cheerio from "cheerio";

export async function fetchJobDescriptionFromUrl(url: string): Promise<string> {
  try {
    console.log(`Attempting to scrape job description from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    console.log(`Loaded HTML content, length: ${html.length} characters`);

    // Remove unwanted elements
    $('script, style, nav, header, footer, .nav, .header, .footer, .sidebar, .ads, .advertisement, .cookie-banner').remove();

    // Enhanced job description selectors (site-specific)
    const specificSelectors = [
      // LinkedIn
      '.jobs-description__content .jobs-description-content__text',
      '.jobs-description-content__text',
      // Indeed
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
      // AngelList/Wellfound
      '[data-test="JobDescription"]',
      // Greenhouse
      '.job-post-description',
      // Lever
      '.posting-description',
      // General patterns
      '[data-testid="jobDescription"]',
      '[data-testid="job-description"]',
      '.job-description-content',
      '.job-description',
      '.jobDescription',
      '.description-content',
      '[id*="job-description"]',
      '[id*="description"]',
      '[class*="job-description"]',
      '[class*="description"]',
      '.job-posting-description',
      '.job-details-description',
      '.position-description'
    ];

    let jobDescription = '';
    let matchedSelector = '';
    
    // Try specific selectors first
    for (const selector of specificSelectors) {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text.length > 100) {
          jobDescription = text;
          matchedSelector = selector;
          console.log(`Found content using selector: ${selector}, length: ${text.length}`);
          break;
        }
      }
    }

    // Fallback to broader selectors
    if (!jobDescription) {
      const broadSelectors = [
        'main',
        'article',
        '.content',
        '.main-content',
        '#content',
        '.job-post',
        '.job-posting',
        '.posting'
      ];

      for (const selector of broadSelectors) {
        const element = $(selector);
        if (element.length) {
          const text = element.text().trim();
          if (text.length > 200) {
            jobDescription = text;
            matchedSelector = selector;
            console.log(`Found content using broad selector: ${selector}, length: ${text.length}`);
            break;
          }
        }
      }
    }

    // Last resort: extract meaningful content from body
    if (!jobDescription) {
      const bodyText = $('body').text()
        .replace(/\s+/g, ' ')
        .trim();
      
      // Look for job-related keywords to extract relevant sections
      const jobKeywords = ['responsibilities', 'requirements', 'qualifications', 'experience', 'skills', 'role', 'position', 'duties', 'about the job', 'job description'];
      const sentences = bodyText.split(/[.!?]+/);
      const relevantSentences = sentences.filter(sentence => {
        const lowerSentence = sentence.toLowerCase();
        return jobKeywords.some(keyword => lowerSentence.includes(keyword)) && sentence.length > 30;
      });

      if (relevantSentences.length > 3) {
        jobDescription = relevantSentences.slice(0, 20).join('. ').trim();
        console.log(`Extracted relevant content from body, sentences: ${relevantSentences.length}`);
      } else {
        // Take first portion of body text as last resort
        jobDescription = bodyText.slice(0, 2000);
        console.log(`Using body text fallback, length: ${jobDescription.length}`);
      }
    }

    // Clean up the extracted content
    jobDescription = jobDescription
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    console.log(`Final extracted content length: ${jobDescription.length}`);

    if (jobDescription.length < 50) {
      throw new Error(`Insufficient content extracted. Length: ${jobDescription.length}, Selector used: ${matchedSelector || 'fallback'}`);
    }

    // Truncate if too long (keep reasonable size for API)
    if (jobDescription.length > 4000) {
      jobDescription = jobDescription.slice(0, 4000) + '...';
      console.log(`Truncated content to 4000 characters`);
    }

    return jobDescription;
  } catch (error) {
    console.error("URL scraping error:", error);
    throw new Error(`Failed to fetch job description from URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
