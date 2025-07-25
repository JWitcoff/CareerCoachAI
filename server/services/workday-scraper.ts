// Alternative approach for Workday and similar dynamic job boards
import * as cheerio from "cheerio";

export async function extractWorkdayJobContent(url: string, html: string): Promise<string | null> {
  try {
    console.log('🔍 Attempting Workday-specific extraction...');
    
    const $ = cheerio.load(html);
    
    // Try to extract from meta tags which often contain job info
    const metaDescriptions = [
      $('meta[name="description"]').attr('content'),
      $('meta[property="og:description"]').attr('content'),
      $('meta[name="twitter:description"]').attr('content')
    ].filter(Boolean);
    
    console.log(`Found ${metaDescriptions.length} meta descriptions`);
    
    for (const desc of metaDescriptions) {
      if (desc && desc.length > 200) {
        console.log(`✅ Found substantial meta description: ${desc.length} characters`);
        return desc;
      }
    }
    
    // Look for JSON-LD structured data
    const jsonLdScripts = $('script[type="application/ld+json"]').map((i, el) => $(el).html()).get();
    console.log(`Found ${jsonLdScripts.length} JSON-LD scripts`);
    
    for (const script of jsonLdScripts) {
      if (!script) continue;
      try {
        const data = JSON.parse(script);
        const description = data.description || data.jobDescription || 
                          (data.hiringOrganization && data.hiringOrganization.description);
        
        if (description && typeof description === 'string' && description.length > 200) {
          console.log(`✅ Found job description in JSON-LD: ${description.length} characters`);
          return description;
        }
      } catch (e) {
        // Continue to next script
      }
    }
    
    // Try to extract from data attributes
    const dataElements = $('[data-automation-id], [data-testid], [data-test]').map((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const id = $el.attr('data-automation-id') || $el.attr('data-testid') || $el.attr('data-test');
      
      if (id && (id.includes('description') || id.includes('job') || id.includes('posting')) && text.length > 100) {
        return { id, text, length: text.length };
      }
      return null;
    }).get().filter(Boolean);
    
    console.log(`Found ${dataElements.length} data elements with potential job content`);
    
    if (dataElements.length > 0) {
      const best = dataElements.sort((a, b) => b.length - a.length)[0];
      console.log(`✅ Found job content in data element ${best.id}: ${best.length} characters`);
      return best.text;
    }
    
    // Final attempt: look for any substantial text blocks that might be the job description
    const textBlocks = $('*').map((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      // Skip if this element has children with substantial text (to avoid duplicates)
      const childrenText = $el.children().map((j, child) => $(child).text().trim()).get().join('').length;
      if (childrenText > text.length * 0.8) return null;
      
      // Look for job-related keywords
      const lowerText = text.toLowerCase();
      const hasJobKeywords = ['responsibilities', 'requirements', 'qualifications', 'experience', 'skills', 'role', 'position'].some(keyword => lowerText.includes(keyword));
      
      if (hasJobKeywords && text.length > 300 && text.length < 5000) {
        return { text, length: text.length };
      }
      return null;
    }).get().filter(Boolean);
    
    if (textBlocks.length > 0) {
      const best = textBlocks.sort((a, b) => b.length - a.length)[0];
      console.log(`✅ Found job description in text block: ${best.length} characters`);
      return best.text;
    }
    
    return null;
    
  } catch (error) {
    console.error('Workday extraction error:', error);
    return null;
  }
}

export function generateWorkdayInstructions(url: string): string {
  return `This appears to be a Workday job board. These platforms load job descriptions dynamically with JavaScript, making automatic extraction challenging.

To get the job description:
1. Open the job posting in your browser: ${url}
2. Wait for the full page to load
3. Look for sections like "Job Description", "Responsibilities", "Requirements"
4. Copy the complete job description text
5. Paste it into the Job Description field below

This will give you the most complete and accurate job description for analysis.`;
}