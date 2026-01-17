
import React, { useState } from 'react';
import { Upload, X, FileText, Loader2, Images } from 'lucide-react';
import { MangaPage } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

interface FileUploadProps {
  pages: MangaPage[];
  onUpload: (newPages: MangaPage[]) => void;
  onRemove: (index: number) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ pages, onUpload, onRemove }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const convertPdfToImages = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const convertedPages: MangaPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR/Vision quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        
        const dataUrl = canvas.toDataURL('image/png');
        convertedPages.push({
          preview: dataUrl,
          name: `${file.name} - Page ${i}`
        });
        
        setProgress(Math.round((i / pdf.numPages) * 100));
      }
      
      onUpload([...pages, ...convertedPages]);
    } catch (error) {
      console.error("PDF conversion error:", error);
      alert("PDF को इमेजेस में बदलने में दिक्कत आई। कृपया सही PDF फाइल चुनें।");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.type === 'application/pdf') {
        await convertPdfToImages(file);
      } else if (file.type.startsWith('image/')) {
        // Fallback for images if user still uploads them
        const newFiles = await Promise.all(Array.from(e.target.files).map(async file => {
          return new Promise<MangaPage>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              preview: reader.result as string,
              name: file.name
            });
            reader.readAsDataURL(file);
          });
        }));
        onUpload([...pages, ...newFiles]);
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-center w-full">
        <label className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-700/50 rounded-3xl cursor-pointer bg-slate-900/20 hover:bg-indigo-600/5 hover:border-indigo-500/50 transition-all group duration-300 relative overflow-hidden ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}>
          
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <FileText className="w-4 h-4 text-indigo-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white uppercase tracking-widest">Converting PDF</p>
                <p className="text-xs text-slate-500 mt-1">{progress}% complete...</p>
              </div>
              <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                 <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600/20 transition-all duration-500 group-hover:rotate-3 shadow-xl shadow-black/20">
                  <FileText className="w-7 h-7 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <p className="mb-1 text-sm text-slate-200 font-bold uppercase tracking-wider">
                Upload <span className="text-indigo-400">Manga PDF</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.1em]">PDF Pages will be converted automatically</p>
            </div>
          )}
          
          <input 
            type="file" 
            className="hidden" 
            accept="application/pdf,image/*" 
            onChange={handleFileChange} 
            disabled={isProcessing}
          />
        </label>
      </div>

      {pages.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Extracted Panels ({pages.length})</h4>
            <button 
              onClick={() => onUpload([])}
              className="text-[10px] font-black text-red-400/60 hover:text-red-400 uppercase tracking-widest transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2 sm:gap-3">
            {pages.map((page, idx) => (
              <div key={idx} className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-slate-700/30 bg-slate-900 shadow-2xl transition-all hover:ring-2 hover:ring-indigo-500/50 hover:scale-[1.02] cursor-default">
                <img 
                  src={page.preview} 
                  alt={page.name} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" 
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-start justify-end p-1.5">
                    <button
                      onClick={(e) => { e.preventDefault(); onRemove(idx); }}
                      className="p-1.5 bg-red-500/90 backdrop-blur-md text-white rounded-lg hover:bg-red-600 shadow-lg transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
                  <span className="text-[9px] font-black text-indigo-400 tracking-tighter">P{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
