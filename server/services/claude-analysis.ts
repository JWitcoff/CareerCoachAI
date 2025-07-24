import { AnalysisResult } from './openai';

// Anthropic Claude API integration as backup for OpenAI
export async function analyzeWithClaude(
  resumeText: string,
  jobDescription?: string
): Promise<AnalysisResult> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key required for Claude analysis");
  }

  const prompt = jobDescription 
    ? `Analyze this resume against the job description and provide detailed feedback:

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide analysis in JSON format with alignmentScore (0-100), strengths array, gaps array, formattingSuggestions array with before/after objects, and interviewQuestions array with question and idealAnswerTraits.`
    : `Analyze this resume for general improvement:

RESUME:
${resumeText}

Provide analysis in JSON format with alignmentScore (0-100), strengths array, gaps array, formattingSuggestions array with before/after objects, and interviewQuestions array with question and idealAnswerTraits.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content[0].text;
    
    // Extract JSON from Claude's response - try multiple approaches
    let analysis;
    try {
      // First try to parse the entire content as JSON
      analysis = JSON.parse(content);
    } catch {
      // If that fails, extract JSON block
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse Claude response: " + content.slice(0, 200));
      }
      
      try {
        analysis = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        // If JSON is malformed, try to fix common issues
        let fixedJson = jsonMatch[0]
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
          .replace(/:\s*'([^']*)'/g, ': "$1"'); // Replace single quotes with double quotes
        
        analysis = JSON.parse(fixedJson);
      }
    }
    
    return {
      alignmentScore: Math.max(0, Math.min(100, analysis.alignmentScore || 0)),
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 5) : [],
      gaps: Array.isArray(analysis.gaps) ? analysis.gaps.slice(0, 5) : [],
      formattingSuggestions: Array.isArray(analysis.formattingSuggestions) 
        ? analysis.formattingSuggestions.slice(0, 3)
        : [],
      interviewQuestions: Array.isArray(analysis.interviewQuestions)
        ? analysis.interviewQuestions.slice(0, 8)
        : []
    };

  } catch (error) {
    console.error("Claude analysis error:", error);
    throw new Error("Failed to analyze with Claude: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}