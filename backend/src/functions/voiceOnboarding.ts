import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

// Response type for extracted profile data
interface ExtractedProfile {
  fullName: string | null;
  age: number | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  searchLocation: string | null;
  mode: 'looking' | 'offering' | null;
  bio: string;
  lifestyleTags: string[];
}

interface VoiceOnboardingResponse {
  success: boolean;
  transcription?: string;
  profile?: ExtractedProfile;
  error?: string;
}

const SYSTEM_INSTRUCTION = `Extract profile information from this transcription. Return ONLY valid JSON:
{
  "fullName": "extracted name or null",
  "age": extracted_number_or_null,
  "gender": "Male" or "Female" or "Other" or null,
  "searchLocation": "City, XX format (e.g. Oshawa, ON or Austin, TX) or null",
  "mode": "looking" or "offering" or null,
  "bio": "2-3 sentence summary",
  "lifestyleTags": ["matched tags from list"]
}

IMPORTANT: 
- searchLocation must ALWAYS be formatted as "City, XX" where XX is the 2-letter state/province code (e.g. "Toronto, ON", "New York, NY", "Vancouver, BC").
- gender should be inferred from context clues, name, or pronouns used. If unclear, set to null.

Available lifestyle tags: Non-Smoker, Very Clean, Social Drinker, Dog Lover, Cat Lover, 
Pet Friendly, Early Bird, Night Owl, Works from Home, Quiet, Social, Student, Professional

Bio is first-person perspective.`;

async function transcribeWithElevenLabs(audioBuffer: ArrayBuffer, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'recording.webm');
  formData.append('model_id', 'scribe_v1');

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Eleven Labs API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.text;
}

async function extractProfileWithGemini(transcription: string, apiKey: string): Promise<ExtractedProfile> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    config: {
      responseMimeType: 'application/json',
      systemInstruction: [{
        text: SYSTEM_INSTRUCTION,
      }],
    },
    contents: [{
      role: 'user',
      parts: [{ text: `Transcription: "${transcription}"` }],
    }],
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  // Parse the JSON response
  const profile = JSON.parse(text) as ExtractedProfile;
  
  // Ensure lifestyleTags is always an array
  if (!Array.isArray(profile.lifestyleTags)) {
    profile.lifestyleTags = [];
  }

  // Ensure bio is always a string
  if (typeof profile.bio !== 'string') {
    profile.bio = '';
  }

  return profile;
}

export async function voiceOnboarding(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Voice onboarding request received for url "${request.url}"`);

  // Check for required API keys
  const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!elevenLabsApiKey) {
    context.error("Missing ELEVEN_LABS_API_KEY");
    return {
      status: 500,
      jsonBody: { success: false, error: "Server misconfiguration: ELEVEN_LABS_API_KEY is missing" } as VoiceOnboardingResponse,
    };
  }

  if (!geminiApiKey) {
    context.error("Missing GEMINI_API_KEY");
    return {
      status: 500,
      jsonBody: { success: false, error: "Server misconfiguration: GEMINI_API_KEY is missing" } as VoiceOnboardingResponse,
    };
  }

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof Blob)) {
      return {
        status: 400,
        jsonBody: { success: false, error: "Missing required field: audio" } as VoiceOnboardingResponse,
      };
    }

    context.log(`Received audio file: ${audioFile.size} bytes`);

    // Get ArrayBuffer from the uploaded audio file
    const arrayBuffer = await audioFile.arrayBuffer();

    // Step 1: Transcribe with Eleven Labs
    context.log("Transcribing audio with Eleven Labs...");
    const transcription = await transcribeWithElevenLabs(arrayBuffer, elevenLabsApiKey);
    context.log(`Transcription received: ${transcription.substring(0, 100)}...`);

    if (!transcription || transcription.trim().length === 0) {
      return {
        status: 400,
        jsonBody: { success: false, error: "Could not transcribe audio. Please try again with clearer speech." } as VoiceOnboardingResponse,
      };
    }

    // Step 2: Extract profile with Gemini
    context.log("Extracting profile with Gemini...");
    const profile = await extractProfileWithGemini(transcription, geminiApiKey);
    context.log(`Profile extracted: ${JSON.stringify(profile)}`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        transcription,
        profile,
      } as VoiceOnboardingResponse,
    };

  } catch (error) {
    context.error("Voice onboarding error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return {
      status: 500,
      jsonBody: { success: false, error: errorMessage } as VoiceOnboardingResponse,
    };
  }
}

app.http("voice-onboarding", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: voiceOnboarding,
});
