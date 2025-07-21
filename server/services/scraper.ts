import * as cheerio from "cheerio";

export async function fetchJobDescriptionFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, nav, header, footer').remove();

    // Try common job description selectors
    const selectors = [
      '[data-testid="jobDescription"]',
      '.job-description',
      '.jobDescription',
      '[id*="description"]',
      '[class*="description"]',
      '.content',
      'main',
      'article'
    ];

    let jobDescription = '';
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 100) {
        jobDescription = element.text().trim();
        break;
      }
    }

    // Fallback: get text from body but filter out navigation and other noise
    if (!jobDescription) {
      jobDescription = $('body').text()
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (jobDescription.length < 50) {
      throw new Error('Could not extract sufficient job description content from the URL');
    }

    return jobDescription;
  } catch (error) {
    console.error("URL scraping error:", error);
    throw new Error(`Failed to fetch job description from URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
