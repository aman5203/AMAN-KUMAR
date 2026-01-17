
import { GoogleGenAI } from "@google/genai";
import { Scene, AspectRatio } from "../types";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const explainManga = async (images: string[]): Promise<Scene[]> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const imageParts = images.map((base64Data, index) => ({
        inlineData: {
          mimeType: "image/png",
          data: base64Data.split(',')[1] 
        }
      }));

      const systemInstruction = `
        You are a world-class professional Manga Storyboard Producer and Script Writer.
        The user has uploaded multiple manga panels (Refer to them as "Panel 1", "Panel 2", etc. in order).

        TASK: Break the story into "Production Beats". Each beat must be tied to specific panels.
        
        REQUIREMENTS:
        1. **Granular Beats**: Every scene (beat) should ideally focus on 1-2 specific panels.
        2. **Precise Mapping**: Clearly state which panel indices are active during this narration beat.
        3. **Extremely Detailed Script**: For each beat, write a long, cinematic narration in Hindi. 
        4. **Deep Description**: Describe the character's gaze, the background details, the tension in the lines, and the overall atmosphere.
        5. **Timing**: Provide a realistic duration (seconds) for how long it takes to read that specific Hindi script slowly and emotionally.
        6. **Hindi Style**: Use a deep, calm, male narrator tone. Cinematic and emotional.

        Output format STRICTLY like this for EACH beat:
        
        Scene [Number]: [Action-Oriented Title]
        Panels: [List the panel numbers, e.g., 1 or 2, 3]
        Duration: [Seconds] sec
        Voice:
        "[EXTREMELY DETAILED HINDI SCRIPT - LONG FORM WORLD BUILDING]"
        ---
      `;

      const prompt = `Analyze these manga panels beat by beat. Create a professional production script where each narration segment is perfectly matched to the panel it describes. 
      I want the narration to be long, descriptive, and deeply atmospheric. Explain the emotions, the hidden details in the background, and the flow of the scene in cinematic Hindi.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { 
          parts: [
            ...imageParts,
            { text: prompt }
          ] 
        },
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });

      const text = response.text || "";
      return parseScenes(text);
    } catch (error: any) {
      lastError = error;
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }
      
      if (attempt < MAX_RETRIES - 1) {
        await delay(INITIAL_DELAY * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
};

const parseScenes = (text: string): Scene[] => {
  const sceneBlocks = text.split('---').filter(b => b.trim().length > 0);
  return sceneBlocks.map((block, index) => {
    const lines = block.trim().split('\n');
    const titleMatch = lines[0].match(/Scene \d+: (.*)/);
    const panelsMatch = lines[1]?.match(/Panels: (.*)/);
    const durationMatch = lines[2]?.match(/Duration: (.*)/);
    
    const voiceStartIndex = lines.findIndex(l => l.toLowerCase().startsWith('voice:'));
    const voiceOver = lines.slice(voiceStartIndex + 1).join('\n').replace(/"/g, '').trim();

    const panelIndices: number[] = [];
    if (panelsMatch) {
      const numbers = panelsMatch[1].match(/\d+/g);
      if (numbers) {
        numbers.forEach(num => {
          const n = parseInt(num);
          if (!isNaN(n)) panelIndices.push(n - 1);
        });
      }
    }

    return {
      id: index + 1,
      title: titleMatch ? titleMatch[1] : `Production Beat ${index + 1}`,
      pages: panelsMatch ? `Panels ${panelsMatch[1]}` : "Active Panels",
      panelIndices: panelIndices,
      duration: durationMatch ? durationMatch[1] : "15 sec",
      voiceOver: voiceOver
    };
  });
};

export const generateMangaImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `High quality manga art illustration, professional line art, cinematic lighting, ${prompt}` }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K"
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model");
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_EXPIRED");
    }
    throw error;
  }
};
