
export interface Scene {
  id: number;
  title: string;
  pages: string;
  panelIndices: number[]; // Array of 0-based indices corresponding to the uploaded images
  duration: string;
  voiceOver: string;
}

export interface MangaPage {
  preview: string; // The image data URL (from PDF or Direct Upload)
  name: string;
}

export interface ExplainerResponse {
  scenes: Scene[];
  summary: string;
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export interface GeneratedImage {
  url: string;
  prompt: string;
  aspectRatio: AspectRatio;
  timestamp: number;
}
