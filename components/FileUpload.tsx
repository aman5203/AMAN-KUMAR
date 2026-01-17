
import React, { useState } from 'react';
import { Upload, X, FileText, Loader2, FileUp, Info } from 'lucide-react';
import { MangaPage } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

interface FileUploadProps {
  pages: MangaPage[];
  onUpload: (newPages: MangaPage[]) => void;
  onRemove: (index: number) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ pages, onUpload, onRemove }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const convertPdfToImages = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const convertedPages: MangaPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.5 }); // High res for details
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // @ts-ignore - Fixing type mismatch in RenderParameters for PDF.js versions where 'canvas' is required.
        await page.render({ canvasContext: context, viewport, canvas } as any).promise;
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // JPEG for better compression
        convertedPages.push({
          preview: dataUrl,
          name: `${file.name} - P${i}`
        });
        
        setProgress(Math.round((i / pdf.numPages) * 100));
      }
      
      onUpload([...pages, ...convertedPages]);
    } catch (error) {
      console.error("PDF conversion error:", error);
      alert("Error processing PDF. Please check the file format.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const pdfFile = files.find(f => f.type === 'application/pdf');
      
      if (pdfFile) {
        await convertPdfToImages(pdfFile);
      } else {
        const newFiles = await Promise.all(files.filter(f => f.type.startsWith('image/')).map(async file => {
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
    <div className="w-full space-y-8">
      <div className="flex items-center justify-center w-full">
        <label 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const files = Array.from(e.dataTransfer.files);
                const pdfFile = files.find(f => f.type === 'application/pdf');
                if (pdfFile) await convertPdfToImages(pdfFile);
                else {
                    const newFiles = await Promise.all(files.filter(f => f.type.startsWith('image/')).map(async file => {
                        return new Promise<MangaPage>((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve({ preview: reader.result as string, name: file.name });
                            reader.readAsDataURL(file);
                        });
                    }));
                    onUpload([...pages, ...newFiles]);
                }
            }
          }}
          className={`
            flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all duration-500 relative overflow-hidden
            ${isDragging ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' : 'border-slate-800 bg-slate-900/20 hover:border-slate-600 hover:bg-slate-800/40'}
            ${isProcessing ? 'pointer-events-none' : ''}
          `}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-5 animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                <FileText className="w-8 h-8 text-indigo-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-black text-white uppercase tracking-widest">Digitizing PDF</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">{progress}% Processed</p>
              </div>
              <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                 <div className="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-5 shadow-2xl group-hover:bg-indigo-600/20 transition-all duration-500">
                  <FileUp className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Import Story Assets</h4>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-4">
                Drag & drop your <span className="text-indigo-400 font-bold">Manga PDF</span> or collection of JPG/PNG frames to begin production.
              </p>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 border border-white/5 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                <Info className="w-3.5 h-3.5" />
                Max 10 panels per beat analysis
              </div>
            </div>
          )}
          
          <input 
            type="file" 
            className="hidden" 
            accept="application/pdf,image/*" 
            multiple
            onChange={handleFileChange} 
            disabled={isProcessing}
          />
        </label>
      </div>

      {pages.length > 0 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Timeline Repository</h4>
              <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-500/20">
                {pages.length} ASSETS
              </span>
            </div>
            <button 
              onClick={() => onUpload([])}
              className="text-[10px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-all px-4 py-2 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            >
              Flush All
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3 px-2">
            {pages.map((page, idx) => (
              <div key={idx} className="relative group aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-slate-950 shadow-xl transition-all hover:scale-105 hover:z-10 hover:shadow-indigo-500/20">
                <img 
                  src={page.preview} 
                  alt={page.name} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center p-2">
                    <button
                      onClick={(e) => { e.preventDefault(); onRemove(idx); }}
                      className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black/40 to-transparent">
                  <span className="text-[9px] font-black text-white/60 tracking-tighter">BEAT P{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
