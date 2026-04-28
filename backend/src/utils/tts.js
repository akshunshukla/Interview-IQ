import { AppError } from "./AppError.js";

export const generateSpeech = async (text) => {
  try {
    const response = await fetch(
      "https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=linear16&container=wav",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Deepgram TTS HTTP Error:", response.status, errText);
      throw new Error(`Deepgram TTS failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("TTS Error:", error);
    throw new AppError("Failed to generate speech", 500);
  }
};
