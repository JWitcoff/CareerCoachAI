import OpenAI from "openai";
import type { InterviewAnalysis } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate intelligent responses to user questions about their interview analysis
export async function generateChatResponse(analysis: InterviewAnalysis, userMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert interview coach and career advisor. You have access to a detailed analysis of the user's interview performance and should provide helpful, actionable advice based on this data.

INTERVIEW ANALYSIS CONTEXT:
- Overall Score: ${analysis.overallScore}/100
- Communication Score: ${analysis.communicationScore}/100  
- Content Score: ${analysis.contentScore}/100
- Audio File: ${analysis.audioFileName}

STRENGTHS:
${analysis.strengths.map(s => `• ${s}`).join('\n')}

AREAS FOR IMPROVEMENT:
${analysis.improvements.map(i => `• ${i}`).join('\n')}

KEY INSIGHTS:
${analysis.keyInsights.map(k => `• ${k}`).join('\n')}

TRANSCRIPT EXCERPT (first 500 chars):
${analysis.transcript.substring(0, 500)}...

GUIDELINES FOR RESPONSES:
1. Be supportive but honest about areas needing improvement
2. Provide specific, actionable advice based on the analysis
3. Reference specific examples from their transcript when relevant
4. Keep responses conversational and encouraging
5. If asked about specific behaviors (e.g., "was I too flattering?"), analyze the transcript for those patterns
6. Suggest concrete next steps for improvement
7. If asked about whether to schedule another interview, base recommendations on their performance scores

Answer the user's question thoughtfully using this interview analysis data.`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.7, // Slightly creative but focused responses
      max_tokens: 500, // Keep responses concise but thorough
    });

    const aiResponse = response.choices[0].message.content;
    
    if (!aiResponse) {
      throw new Error("No response generated from AI");
    }

    return aiResponse;
    
  } catch (error) {
    console.error("AI chat response generation failed:", error);
    return "I'm sorry, I'm having trouble generating a response right now. Please try asking your question again in a moment.";
  }
}