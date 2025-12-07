
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

// NOTE: AIzaSyADg0nPhDssRqg1ISEoRYUj1BP6P24ib2M
const apiKey = process.env.API_KEY || ''; 

export const isApiConfigured = () => !!apiKey;

let ai: GoogleGenAI | null = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

// --- Chat with Multimodal + Tools + Modes ---
export interface ChatConfig {
    mode: 'fast' | 'standard' | 'thinking' | 'grounded_search' | 'grounded_maps';
    image?: string; // base64
    video?: string; // base64
}

export const generateChatResponse = async (
    message: string, 
    config: ChatConfig
): Promise<string> => {
    if (!ai) return "Error: API Key missing. Please configure your environment.";

    try {
        let model = 'gemini-2.5-flash';
        let tools: any[] | undefined = undefined;
        let generationConfig: any = {};
        let toolConfig: any = undefined;

        // Model Selection based on Mode
        switch(config.mode) {
            case 'fast':
                model = 'gemini-2.5-flash-lite';
                break;
            case 'thinking':
                model = 'gemini-3-pro-preview';
                generationConfig = {
                    thinkingConfig: { thinkingBudget: 32768 } // Max budget for Gemini 3 Pro
                };
                break;
            case 'grounded_search':
                model = 'gemini-2.5-flash';
                tools = [{ googleSearch: {} }];
                break;
            case 'grounded_maps':
                model = 'gemini-2.5-flash';
                tools = [{ googleMaps: {} }];
                break;
            default:
                // Standard or Video Analysis uses Gemini 3 Pro for best understanding
                if (config.video) {
                    model = 'gemini-3-pro-preview';
                } else {
                    model = 'gemini-2.5-flash';
                }
        }

        const parts: any[] = [];
        
        // Handle Media Inputs
        if (config.image) {
            parts.push({
                inlineData: { mimeType: 'image/jpeg', data: config.image }
            });
        }
        if (config.video) {
             parts.push({
                inlineData: { mimeType: 'video/mp4', data: config.video }
            });
        }
        
        // Add text prompt
        parts.push({ text: message });

        // Maps Grounding requires location (simulated for browser)
        if (config.mode === 'grounded_maps') {
             // Ideally get real location, defaulting for demo
             toolConfig = {
                retrievalConfig: {
                    latLng: { latitude: 40.7128, longitude: -74.0060 } // NYC default
                }
             };
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                tools: tools,
                toolConfig: toolConfig,
                ...generationConfig,
            }
        });

        // Extract Text and Grounding Info
        let text = response.text || "";
        
        // Check for Search Grounding
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
             const chunks = response.candidates[0].groundingMetadata.groundingChunks;
             const links = chunks
                .map((c: any) => c.web?.uri || c.maps?.uri)
                .filter((uri: string) => uri)
                .join('\n');
             
             if (links) {
                 text += `\n\n**Sources & Locations:**\n${links}`;
             }
        }

        return text || "No response generated.";

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "I'm having trouble connecting to the AI core right now. " + (error as any).message;
    }
};

// --- Image Generation (Gemini 3 Pro Image) ---
export const generateImage = async (
    prompt: string, 
    aspectRatio: string = "1:1", 
    imageSize: string = "1K"
): Promise<string | null> => {
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio, // "1:1", "3:4", "4:3", "9:16", "16:9"
                    imageSize: imageSize // "1K", "2K", "4K"
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Image Gen Error:", error);
        throw error;
    }
}

// --- Video Generation (Veo 3.1) ---
export const generateAIVideo = async (
    prompt: string, 
    aspectRatio: '16:9' | '9:16' = '16:9',
    imageBase64?: string
): Promise<string | null> => {
    const currentKey = process.env.API_KEY;
    if (!currentKey) throw new Error("API Key missing");

    const videoAi = new GoogleGenAI({ apiKey: currentKey });

    try {
        const payload: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio 
            }
        };

        if (imageBase64) {
            payload.image = {
                imageBytes: imageBase64,
                mimeType: 'image/png',
            };
        }

        let operation = await videoAi.models.generateVideos(payload);

        console.log("Veo generation started...");
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await videoAi.operations.getVideosOperation({operation: operation});
            console.log("Polling Veo...");
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (!videoUri) throw new Error("No video URI returned");

        const videoResponse = await fetch(`${videoUri}&key=${currentKey}`);
        if (!videoResponse.ok) throw new Error("Failed to download video");

        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error: any) {
        console.error("Video Gen Error:", JSON.stringify(error));
        if (JSON.stringify(error).includes("Requested entity was not found")) {
             throw new Error("KEY_SELECTION_REQUIRED");
        }
        throw error;
    }
};

// --- Translation ---
export const translateText = async (text: string, targetLang: string): Promise<string> => {
    if (!ai) return "Simulated Translation (No API Key)";
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following text to ${targetLang}. Only output the translated text.\n\nText: ${text}`,
        });
        return response.text || "";
    } catch (error) {
        return "Translation failed.";
    }
}

// --- Text to Speech (Gemini 2.5 Flash TTS) ---
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string | null> => {
    if (!ai) throw new Error("API Key missing");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO], 
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return `data:audio/wav;base64,${base64Audio}`;
        }
        return null;
    } catch (error) {
        console.error("TTS Error:", error);
        throw error;
    }
}

// --- Audio Transcription (Gemini 2.5 Flash) ---
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
    if (!ai) return "";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'audio/mp3', data: base64Audio } }, // Assuming MP3/WAV container
                    { text: "Transcribe this audio exactly." }
                ]
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Transcription error", e);
        return "Error transcribing audio.";
    }
};

// --- Document/Image Analysis (Gemini 3 Pro) ---
export const analyzeDocument = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
    if (!ai) throw new Error("API Key missing");

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "Could not analyze document.";
    } catch (error) {
        console.error("DocAI Error:", error);
        throw error;
    }
}
