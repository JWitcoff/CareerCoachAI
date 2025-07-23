import OpenAI from "openai";
import type { TranscriptionSegment } from "./whisper";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SpeakerInfo {
  id: string;
  name: string;
  gender?: 'male' | 'female' | 'unknown';
  characteristics: string[];
  confidence: number;
}

export interface EnhancedSegment extends TranscriptionSegment {
  speakerId: string;
  speakerName: string;
  confidence: number;
}

export async function enhancedSpeakerAnalysis(
  segments: TranscriptionSegment[],
  fullTranscript: string
): Promise<{
  segments: EnhancedSegment[];
  speakers: SpeakerInfo[];
  summary: string;
}> {
  try {
    // First, analyze the overall conversation to identify speakers
    const speakerAnalysis = await analyzeSpeakerCharacteristics(fullTranscript);
    
    // Then assign segments to speakers using multiple techniques
    const enhancedSegments = await assignSpeakersToSegments(segments, speakerAnalysis, fullTranscript);
    
    return {
      segments: enhancedSegments,
      speakers: speakerAnalysis.speakers,
      summary: speakerAnalysis.summary
    };

  } catch (error) {
    console.error("Enhanced speaker analysis failed:", error);
    // Fallback to basic alternating pattern with better naming
    return fallbackSpeakerAssignment(segments);
  }
}

async function analyzeSpeakerCharacteristics(transcript: string): Promise<{
  speakers: SpeakerInfo[];
  summary: string;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: `You are an expert in conversation analysis and speaker identification. Analyze this interview transcript to identify distinct speakers based on:

1. **Speech patterns and style** (formal vs casual, question types, response patterns)
2. **Content roles** (interviewer asking questions vs interviewee answering)
3. **Language characteristics** (vocabulary, sentence structure, tone indicators)
4. **Gender indicators** (linguistic patterns, names mentioned, pronoun usage)
5. **Conversational dynamics** (who leads, who responds, power dynamics)

Provide detailed analysis in JSON format.`
      },
      {
        role: "user",
        content: `Analyze this interview transcript and identify the speakers:

${transcript}

Respond with JSON in this exact format:
{
  "speakers": [
    {
      "id": "speaker_1",
      "name": "Interviewer",
      "gender": "male|female|unknown",
      "characteristics": ["asks questions", "professional tone", "uses industry terms"],
      "confidence": 0.85
    },
    {
      "id": "speaker_2", 
      "name": "Candidate",
      "gender": "male|female|unknown",
      "characteristics": ["answers questions", "describes experience", "uses first person"],
      "confidence": 0.90
    }
  ],
  "summary": "Brief analysis of the conversation dynamics and speaker identification rationale"
}`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3, // Lower temperature for more consistent analysis
    max_tokens: 1000,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  
  return {
    speakers: Array.isArray(result.speakers) ? result.speakers.map((speaker: any) => ({
      id: speaker.id || `speaker_${Math.random().toString(36).substr(2, 9)}`,
      name: speaker.name || "Unknown Speaker",
      gender: ['male', 'female', 'unknown'].includes(speaker.gender) ? speaker.gender : 'unknown',
      characteristics: Array.isArray(speaker.characteristics) ? speaker.characteristics : [],
      confidence: typeof speaker.confidence === 'number' ? Math.max(0, Math.min(1, speaker.confidence)) : 0.5
    })) : [],
    summary: result.summary || "Unable to analyze speaker characteristics"
  };
}

async function assignSpeakersToSegments(
  segments: TranscriptionSegment[],
  speakerAnalysis: { speakers: SpeakerInfo[]; summary: string },
  fullTranscript: string
): Promise<EnhancedSegment[]> {
  
  if (speakerAnalysis.speakers.length === 0) {
    return fallbackSpeakerAssignment(segments).segments;
  }

  // Use AI to assign each segment to a speaker
  const segmentTexts = segments.map((seg, idx) => `${idx}: "${seg.text}"`).join('\n');
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are analyzing an interview transcript to assign each segment to the correct speaker. 

Available speakers:
${speakerAnalysis.speakers.map(s => `- ${s.id} (${s.name}): ${s.characteristics.join(', ')}`).join('\n')}

Instructions:
1. Analyze each segment's content, tone, and role in the conversation
2. Consider who is asking questions vs answering
3. Look for pronouns, names, and contextual clues
4. Maintain conversation flow consistency
5. Use speaker characteristics to guide decisions

Respond with JSON mapping each segment index to a speaker ID and confidence score.`
      },
      {
        role: "user", 
        content: `Assign these transcript segments to speakers:

${segmentTexts}

Respond with JSON in this format:
{
  "assignments": [
    {"segment": 0, "speakerId": "speaker_1", "confidence": 0.85},
    {"segment": 1, "speakerId": "speaker_2", "confidence": 0.90}
  ]
}`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 2000,
  });

  const assignments = JSON.parse(response.choices[0].message.content || "{}");
  
  // Apply assignments to segments
  const enhancedSegments: EnhancedSegment[] = segments.map((segment, index) => {
    const assignment = Array.isArray(assignments.assignments) 
      ? assignments.assignments.find((a: any) => a.segment === index)
      : null;
    
    let speakerId = assignment?.speakerId || speakerAnalysis.speakers[0]?.id || 'speaker_1';
    let confidence = assignment?.confidence || 0.5;
    
    // Validate speaker ID exists
    const speaker = speakerAnalysis.speakers.find(s => s.id === speakerId);
    if (!speaker) {
      speakerId = speakerAnalysis.speakers[0]?.id || 'speaker_1';
      confidence = 0.3;
    }
    
    return {
      ...segment,
      speakerId,
      speakerName: speaker?.name || 'Unknown Speaker',
      confidence: Math.max(0, Math.min(1, confidence))
    };
  });

  return enhancedSegments;
}

function fallbackSpeakerAssignment(segments: TranscriptionSegment[]): {
  segments: EnhancedSegment[];
  speakers: SpeakerInfo[];
  summary: string;
} {
  // Improved fallback that considers content patterns rather than just alternating
  const speakers: SpeakerInfo[] = [
    {
      id: 'interviewer',
      name: 'Interviewer',
      gender: 'unknown',
      characteristics: ['Asks questions', 'Professional tone'],
      confidence: 0.6
    },
    {
      id: 'candidate', 
      name: 'Candidate',
      gender: 'unknown',
      characteristics: ['Answers questions', 'Describes experience'],
      confidence: 0.6
    }
  ];

  const enhancedSegments: EnhancedSegment[] = segments.map((segment, index) => {
    // Basic heuristics for speaker assignment
    const text = segment.text.toLowerCase();
    let speakerId = 'candidate';
    let confidence = 0.5;
    
    // Question indicators suggest interviewer
    if (text.includes('?') || 
        text.startsWith('what ') || 
        text.startsWith('how ') || 
        text.startsWith('why ') ||
        text.startsWith('tell me ') ||
        text.startsWith('can you ')) {
      speakerId = 'interviewer';
      confidence = 0.7;
    }
    
    // Experience/personal indicators suggest candidate
    if (text.includes('i worked ') ||
        text.includes('my experience ') ||
        text.includes('i have ') ||
        text.includes('in my previous role')) {
      speakerId = 'candidate';
      confidence = 0.8;
    }

    const speaker = speakers.find(s => s.id === speakerId)!;
    
    return {
      ...segment,
      speakerId,
      speakerName: speaker.name,
      confidence
    };
  });

  return {
    segments: enhancedSegments,
    speakers,
    summary: "Fallback speaker assignment using content-based heuristics"
  };
}

// Format transcript with enhanced speaker information
export function formatEnhancedTranscript(
  segments: EnhancedSegment[],
  speakers: SpeakerInfo[]
): string {
  let currentSpeaker = '';
  let formattedTranscript = '';
  
  // Add speaker summary header
  if (speakers.length > 0) {
    formattedTranscript += '=== SPEAKERS IDENTIFIED ===\n';
    speakers.forEach(speaker => {
      const genderInfo = speaker.gender !== 'unknown' ? ` (${speaker.gender})` : '';
      formattedTranscript += `${speaker.name}${genderInfo}: ${speaker.characteristics.join(', ')}\n`;
    });
    formattedTranscript += '\n=== CONVERSATION ===\n';
  }

  segments.forEach(segment => {
    if (currentSpeaker !== segment.speakerName) {
      currentSpeaker = segment.speakerName;
      formattedTranscript += `\n${currentSpeaker}: `;
    }
    
    formattedTranscript += segment.text + ' ';
  });

  return formattedTranscript.trim();
}