import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "" 
});

export interface AnalysisResult {
  alignmentScore: number;
  strengths: string[];
  gaps: string[];
  formattingSuggestions: {
    before: string;
    after: string;
  }[];
  interviewQuestions: {
    question: string;
    idealAnswerTraits: string[];
  }[];
}

export async function analyzeResumeJobAlignment(
  resumeText: string,
  jobDescription: string,
  additionalContext?: string
): Promise<AnalysisResult> {
  try {
    const prompt = `You are an advanced AI career assistant trained to provide professional-grade resume evaluations and interview coaching. Your role is to help users improve their job applications by carefully comparing their resume to a provided job description and offering constructive, high-level feedback.

Maintain a formal, clear, and concise tone. Avoid generic advice. Focus instead on nuanced, role-specific insights that improve the candidate's alignment with the opportunity. Do not invent qualifications that are not present in the resume.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}\n` : ''}

Analyze the resume against the job description and provide your response in JSON format with the following structure:

{
  "alignmentScore": number (0-100),
  "strengths": ["specific strength 1", "specific strength 2", ...],
  "gaps": ["specific gap 1", "specific gap 2", ...],
  "formattingSuggestions": [
    {"before": "original text example", "after": "improved text example"},
    ...
  ],
  "interviewQuestions": [
    {
      "question": "role-specific interview question",
      "idealAnswerTraits": ["trait 1", "trait 2", "trait 3"]
    },
    ...
  ]
}

Guidelines:
- Generate 3-5 strengths that specifically align with the job requirements
- Identify 3-5 gaps or areas for improvement
- Provide 2-3 formatting suggestions with before/after examples
- Generate 5-8 role-specific interview questions derived from the job description
- For each interview question, provide 3-4 ideal answer traits
- Be direct and honest - the goal is to help the user get hired`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional career coach specializing in resume analysis and interview preparation. Provide detailed, actionable feedback in the requested JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and sanitize the response
    return {
      alignmentScore: Math.max(0, Math.min(100, result.alignmentScore || 0)),
      strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 5) : [],
      gaps: Array.isArray(result.gaps) ? result.gaps.slice(0, 5) : [],
      formattingSuggestions: Array.isArray(result.formattingSuggestions) 
        ? result.formattingSuggestions.slice(0, 3).map((item: any) => ({
            before: item.before || "",
            after: item.after || ""
          }))
        : [],
      interviewQuestions: Array.isArray(result.interviewQuestions)
        ? result.interviewQuestions.slice(0, 8).map((item: any) => ({
            question: item.question || "",
            idealAnswerTraits: Array.isArray(item.idealAnswerTraits) 
              ? item.idealAnswerTraits.slice(0, 4)
              : []
          }))
        : []
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error(`Failed to analyze resume: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
