import fs from 'fs';

async function testElevenLabsDirectly() {
  const ELEVENLABS_API_KEY = 'sk_b58d7504529734b1e620eaabc097240e7edf441ae66af1be';
  const SCRIBE_API_URL = "https://api.elevenlabs.io/v1/speech-to-text";
  
  // Read file as buffer and create proper FormData
  const audioBuffer = fs.readFileSync('test_short.m4a');
  const boundary = '----formdata-node-' + Math.random().toString(36);
  
  let formBody = `--${boundary}\r\n`;
  formBody += `Content-Disposition: form-data; name="file"; filename="test_short.m4a"\r\n`;
  formBody += `Content-Type: audio/mpeg\r\n\r\n`;
  
  const formData = Buffer.concat([
    Buffer.from(formBody, 'utf8'),
    audioBuffer,
    Buffer.from(`\r\n--${boundary}\r\n`, 'utf8'),
    Buffer.from(`Content-Disposition: form-data; name="model_id"\r\n\r\nscribe_v1\r\n`, 'utf8'),
    Buffer.from(`--${boundary}\r\n`, 'utf8'),
    Buffer.from(`Content-Disposition: form-data; name="diarize"\r\n\r\ntrue\r\n`, 'utf8'),
    Buffer.from(`--${boundary}--\r\n`, 'utf8')
  ]);

  try {
    const response = await fetch(SCRIBE_API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formData.length.toString(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs Scribe API error: ${response.status} - ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log("SUCCESS! ElevenLabs Scribe result:", JSON.stringify(result, null, 2));
    
    // Create a simple successful transcription response
    const successResponse = {
      text: result.text || "Test transcription successful",
      duration: 30
    };
    
    console.log("Final response would be:", successResponse);
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testElevenLabsDirectly();