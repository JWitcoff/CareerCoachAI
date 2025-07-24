import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const SCRIBE_API_URL = "https://api.elevenlabs.io/v1/speech-to-text";

export interface ScribeTranscriptionResult {
  text: string;
  duration: number;
  speakers?: Array<{
    id: string;
    name: string;
    segments: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  }>;
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

async function compressAudioForScribe(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(path.dirname(inputPath), `scribe_compressed_${Date.now()}.mp3`);
    
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate('128k') // Higher quality for better transcription
      .audioFrequency(44100) // Standard sample rate
      .audioChannels(2) // Stereo can help with speaker separation
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err: any) => {
        reject(new Error(`Audio compression failed: ${err.message}`));
      })
      .save(outputPath);
  });
}

export async function transcribeWithElevenLabsScribe(audioFilePath: string): Promise<ScribeTranscriptionResult> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is required for Scribe transcription");
  }

  let processedPath = audioFilePath;
  let tempFilesToCleanup: string[] = [];

  try {
    const stats = fs.statSync(audioFilePath);
    console.log(`Processing file size: ${stats.size} bytes with ElevenLabs Scribe`);

    // Compress audio for better quality
    console.log("Compressing audio for ElevenLabs Scribe...");
    processedPath = await compressAudioForScribe(audioFilePath);
    tempFilesToCleanup.push(processedPath);

    // Prepare form data for ElevenLabs Scribe API
    const formData = new FormData();
    const audioBuffer = fs.readFileSync(processedPath);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    
    formData.append('file', audioBlob, path.basename(processedPath));
    formData.append('model_id', 'eleven_multilingual_v2');
    formData.append('diarize', 'true'); // Enable speaker diarization
    formData.append('tag_audio_events', 'true'); // Tag audio events like laughter
    formData.append('timestamps_granularity', 'word'); // Word-level timestamps

    console.log("Sending audio to ElevenLabs Scribe API...");
    
    const response = await fetch(SCRIBE_API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs Scribe API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("ElevenLabs Scribe transcription completed successfully");

    // Process the response to match our expected format
    return processScribeResponse(result);

  } catch (error) {
    console.error("ElevenLabs Scribe transcription error:", error);
    throw new Error("Failed to transcribe with ElevenLabs Scribe: " + (error instanceof Error ? error.message : "Unknown error"));
  } finally {
    // Cleanup temporary files
    for (const tempFile of tempFilesToCleanup) {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (err) {
        console.error(`Failed to cleanup temp file ${tempFile}:`, err);
      }
    }
  }
}

function processScribeResponse(scribeResult: any): ScribeTranscriptionResult {
  // Process ElevenLabs Scribe response format
  const text = scribeResult.text || scribeResult.transcript || '';
  const duration = scribeResult.duration || 0;
  
  let speakers: ScribeTranscriptionResult['speakers'];
  
  // If speaker diarization is available
  if (scribeResult.speakers && Array.isArray(scribeResult.speakers)) {
    speakers = scribeResult.speakers.map((speaker: any, index: number) => ({
      id: speaker.id || `speaker_${index + 1}`,
      name: speaker.name || `Speaker ${index + 1}`,
      segments: speaker.segments || []
    }));
  } else if (scribeResult.segments && Array.isArray(scribeResult.segments)) {
    // If we have segments but not speaker info, create basic speaker structure
    speakers = [{
      id: 'speaker_1',
      name: 'Speaker 1',
      segments: scribeResult.segments
    }];
  }

  return {
    text,
    duration,
    speakers
  };
}

// Format transcript with speaker diarization from ElevenLabs
export function formatScribeTranscript(result: ScribeTranscriptionResult): string {
  if (!result.speakers || result.speakers.length === 0) {
    return result.text;
  }

  let formattedTranscript = '';
  
  // Add speaker summary header
  formattedTranscript += '=== SPEAKERS IDENTIFIED BY ELEVENLABS SCRIBE ===\n';
  result.speakers.forEach(speaker => {
    formattedTranscript += `${speaker.name}: ${speaker.segments.length} segments\n`;
  });
  formattedTranscript += '\n=== CONVERSATION ===\n';

  // Collect all segments with speaker info and sort by timestamp
  const allSegments: Array<{
    start: number;
    end: number;
    text: string;
    speakerName: string;
  }> = [];

  result.speakers.forEach(speaker => {
    speaker.segments.forEach(segment => {
      allSegments.push({
        start: segment.start,
        end: segment.end,
        text: segment.text,
        speakerName: speaker.name
      });
    });
  });

  // Sort by start time
  allSegments.sort((a, b) => a.start - b.start);

  // Format transcript
  let currentSpeaker = '';
  allSegments.forEach(segment => {
    if (currentSpeaker !== segment.speakerName) {
      currentSpeaker = segment.speakerName;
      formattedTranscript += `\n${currentSpeaker}: `;
    }
    formattedTranscript += segment.text + ' ';
  });

  return formattedTranscript.trim();
}

// Fallback to OpenAI Whisper if ElevenLabs fails
export async function transcribeWithFallback(audioFilePath: string): Promise<{ text: string; duration: number }> {
  try {
    // Try ElevenLabs Scribe first
    console.log("Attempting transcription with ElevenLabs Scribe...");
    const scribeResult = await transcribeWithElevenLabsScribe(audioFilePath);
    const formattedText = formatScribeTranscript(scribeResult);
    
    return {
      text: formattedText,
      duration: scribeResult.duration
    };
  } catch (scribeError) {
    console.error("ElevenLabs Scribe failed:", scribeError);
    
    // If OpenAI quota is exceeded, return a helpful error message
    const errorMessage = scribeError instanceof Error ? scribeError.message : "Unknown error";
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      throw new Error("Both ElevenLabs Scribe and OpenAI Whisper are currently unavailable. Please check your API keys and quotas.");
    }
    
    // Try fallback to our existing Whisper implementation
    try {
      console.warn("Attempting fallback to OpenAI Whisper...");
      const { transcribeAudio } = await import('./whisper');
      const whisperResult = await transcribeAudio(audioFilePath);
      return {
        text: whisperResult.text,
        duration: 0 // Whisper doesn't return duration in our implementation
      };
    } catch (whisperError) {
      const whisperMsg = whisperError instanceof Error ? whisperError.message : "Unknown error";
      if (whisperMsg.includes('quota') || whisperMsg.includes('429')) {
        throw new Error("OpenAI API quota exceeded. The ElevenLabs Scribe service also failed. Please check your OpenAI billing or wait for quota reset.");
      }
      throw new Error(`Both transcription services failed. ElevenLabs: ${errorMessage}, Whisper: ${whisperMsg}`);
    }
  }
}