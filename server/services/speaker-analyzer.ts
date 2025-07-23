import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Use GPT-4o to intelligently identify speaker changes in transcript
export async function analyzeAndDiarizeSpeakers(rawTranscript: string): Promise<string> {
  console.log("Using AI to analyze speaker patterns...");
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing interview transcripts and identifying different speakers. 

Your task is to take a raw transcript and format it with proper speaker labels "Justin:" and "Cat:" based on conversation patterns.

Rules:
1. Look for natural conversation flow - responses, questions, agreements
2. Short responses like "Yes", "Right", "Exactly", "No" are usually from the other speaker
3. Questions are often followed by responses from the other speaker
4. Words like "Well", "But", "Actually", "So" often indicate speaker changes
5. Alternate speakers naturally - don't have one person speaking for too long
6. Each speaker should get roughly balanced speaking time
7. Start with "Justin:" for the first statement

Format each speaker's statement on a new line like:
Justin: [statement]

Cat: [response]

Be aggressive about identifying speaker changes - interviews are conversations, not monologues.`
        },
        {
          role: "user",
          content: `Please analyze this interview transcript and properly identify the two speakers (Justin and Cat). Make sure to alternate speakers naturally based on conversation patterns:

${rawTranscript}`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent speaker identification
    });

    const diarizedTranscript = response.choices[0].message.content;
    
    if (!diarizedTranscript) {
      throw new Error("No response from AI speaker analysis");
    }

    console.log("AI speaker diarization completed successfully");
    return diarizedTranscript;
    
  } catch (error) {
    console.error("AI speaker analysis failed:", error);
    // Fallback to simple alternating pattern
    return fallbackSpeakerDiarization(rawTranscript);
  }
}

// Fallback function if AI analysis fails
function fallbackSpeakerDiarization(transcript: string): string {
  console.log("Using fallback speaker diarization...");
  
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const speakerNames = ['Justin', 'Cat'];
  let currentSpeaker = 0;
  let result = '';
  
  sentences.forEach((sentence, index) => {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) return;
    
    // Force speaker changes more frequently
    if (index > 0 && (
      index % 2 === 0 || // Change every 2 sentences
      cleanSentence.toLowerCase().startsWith('yes') ||
      cleanSentence.toLowerCase().startsWith('no') ||
      cleanSentence.toLowerCase().startsWith('right') ||
      cleanSentence.toLowerCase().startsWith('well') ||
      cleanSentence.length < 20 // Short responses
    )) {
      currentSpeaker = (currentSpeaker + 1) % speakerNames.length;
    }
    
    result += `${speakerNames[currentSpeaker]}: ${cleanSentence}.\n\n`;
  });
  
  return result.trim();
}