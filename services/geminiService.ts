
import { GoogleGenAI } from "@google/genai";
import { Scene, AspectRatio } from "../types";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ChunkResult {
  scenes: Scene[];
  currentStoryContext: string;
}

export const explainMangaChunk = async (
  images: string[], 
  startIdx: number, 
  previousStoryContext: string = ""
): Promise<ChunkResult> => {
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
        You are analyzing a specific segment of a manga (Panels ${startIdx + 1} to ${startIdx + images.length}).
        
        ${previousStoryContext ? `CONTEXT SO FAR: ${previousStoryContext}` : ""}

        TASK: Break this segment into "Production Beats". 
        
        REQUIREMENTS:
        1. **Granular Beats**: Focus on the details of these specific panels.
        2. **Precise Mapping**: Use the absolute panel numbers (starting from ${startIdx + 1}).
        3. **Maximum Verbosity**: Write an EXTREMELY LONG, poetic, and cinematic narration in Hindi for every beat. 
        4. **Visual Description**: Describe facial nuances, artistic strokes, background atmosphere, and emotional weight.
        5. **Continuity**: Ensure the tone matches the previous context if provided.
        6. **Story Update**: At the end of your response, provide a brief summary of what happened in this segment in English, wrapped in [SUMMARY]...[/SUMMARY] tags.

        Output format STRICTLY like this for EACH beat:
        
        Scene [Number]: [Title]
        Panels: [Absolute Panel Numbers]
        Duration: [Seconds] sec
        Voice:
        "[EXTREMELY DETAILED HINDI SCRIPT]"
        ---
      `;

      const prompt = `Analyze panels ${startIdx + 1} to ${startIdx + images.length}. Provide a deep, long-form Hindi narration script for this segment. Describe the art and emotion in immense detail.`;

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
      const scenes = parseScenes(text, startIdx);
      
      // Extract the story context for the next chunk
      const summaryMatch = text.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
      const currentStoryContext = summaryMatch ? summaryMatch[1].trim() : "Continuing the story...";

      return { scenes, currentStoryContext };
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

const parseScenes = (text: string, globalStartIdx: number): Scene[] => {
  // Remove the summary block before parsing scenes
  const cleanText = text.replace(/\[SUMMARY\][\s\S]*?\[\/SUMMARY\]/, "");
  const sceneBlocks = cleanText.split('---').filter(b => b.trim().length > 0);
  
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
          if (!isNaN(n)) panelIndices.push(n - 1); // Panels in prompt are 1-based, we store 0-based
        });
      }
    }

    return {
      id: index + 1, // This will be adjusted in the App component to be global
      title: titleMatch ? titleMatch[1] : `Beat`,
      pages: panelsMatch ? `Panels ${panelsMatch[1]}` : "Active Panels",
      panelIndices: panelIndices,
      duration: durationMatch ? durationMatch[1] : "20 sec",
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
