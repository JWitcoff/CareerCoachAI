import * as cheerio from "cheerio";

export async function fetchJobDescriptionFromUrl(url: string): Promise<string> {
  try {
    console.log(`Attempting to scrape job description from: ${url}`);
    
    // Validate URL format first
    try {
      new URL(url);
    } catch (error) {
      throw new Error('Invalid URL format provided');
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      },
      // timeout: 10000 // 10 second timeout - removed as not supported in all environments
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(`Access denied (${response.status}). The website may be blocking automated requests. Try copying the job description directly instead.`);
      } else if (response.status === 404) {
        throw new Error(`Job posting not found (${response.status}). Please verify the URL is correct and the posting is still active.`);
      } else if (response.status === 429) {
        throw new Error(`Rate limited (${response.status}). Please wait a moment and try again.`);
      } else {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    console.log(`Loaded HTML content, length: ${html.length} characters`);

    // Remove unwanted elements
    $('script, style, nav, header, footer, .nav, .header, .footer, .sidebar, .ads, .advertisement, .cookie-banner, .login, .signup, .newsletter').remove();
    
    console.log(`Processing HTML content for selectors, page title: ${$('title').text().trim()}`);
    console.log(`Total text content available: ${$.text().length} characters`);

    // Enhanced job description selectors (site-specific + updated)
    const specificSelectors = [
      // LinkedIn - updated selectors
      '.jobs-description__content .jobs-description-content__text',
      '.jobs-description-content__text',
      '.job-details-jobs-unified-top-card__job-description',
      '.jobs-unified-top-card__job-description',
      
      // Indeed - multiple selector variations
      '#jobDescriptionText',
      '.jobsearch-jobDescriptionText',
      '.jobsearch-JobComponent-description',
      '.icl-u-xs-mt--xs',
      
      // AngelList/Wellfound
      '[data-test="JobDescription"]',
      '[data-testid="job-description"]',
      
      // Greenhouse
      '.job-post-description',
      '.content',
      
      // Lever
      '.posting-description',
      '.posting-requirements',
      '.section-wrapper',
      
      // Remote.co, RemoteOK, etc.
      '.job_description',
      '.job-description',
      '.job-board-description',
      
      // Stack Overflow Jobs
      '.js-description',
      '.job-description--wrapper',
      
      // Glassdoor
      '.jobDescriptionContent',
      '.desc',
      
      // General modern patterns
      '[data-testid="jobDescription"]',
      '[data-testid="job-description"]',
      '[data-test-id="job-description"]',
      '.job-description-content',
      '.jobDescription',
      '.description-content',
      '.posting-content',
      '.job-content',
      '[id*="job-description"]',
      '[id*="description"]',
      '[class*="job-description"]',
      '[class*="description"]',
      '.job-posting-description',
      '.job-details-description',
      '.position-description',
      '.role-description'
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

    // Fallback: Search for content containing job-related keywords
    if (!jobDescription) {
      console.log("No content found with specific selectors, trying keyword-based extraction...");
      
      const allText = $('body').text().trim();
      const jobKeywords = ['responsibilities', 'requirements', 'qualifications', 'experience', 'skills', 'role', 'position', 'job description', 'about the role', 'what you will do'];
      
      // Split content into paragraphs and find job-related sections
      const paragraphs = allText.split('\n').filter(p => p.trim().length > 50);
      const relevantParagraphs = paragraphs.filter(p => 
        jobKeywords.some(keyword => p.toLowerCase().includes(keyword))
      );
      
      if (relevantParagraphs.length > 0) {
        jobDescription = relevantParagraphs.slice(0, 10).join('\n\n').trim();
        console.log(`Found job content using keyword matching: ${relevantParagraphs.length} relevant paragraphs`);
      } else {
        // Last resort: try broader selectors
        const broadSelectors = [
          'main',
          'article', 
          '.content',
          '.main-content',
          '#content',
          '.container',
          '.wrapper'
        ];

        for (const selector of broadSelectors) {
          const element = $(selector);
          if (element.length) {
            const text = element.text().trim();
            if (text.length > 300) {
              jobDescription = text;
              matchedSelector = selector;
              console.log(`Found content using broad selector: ${selector}, length: ${text.length}`);
              break;
            }
          }
        }
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
