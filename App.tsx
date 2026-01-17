
import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { SceneCard } from './components/SceneCard';
import { MangaPage, Scene, AspectRatio, GeneratedImage } from './types';
import { explainManga, generateMangaImage } from './services/geminiService';
import { Sparkles, Loader2, Play, BookOpen, Film, AlertCircle, Download, RotateCcw, Image as ImageIcon, Layout, Key, ExternalLink, ChevronRight, Share2, FileText, ListMusic } from 'lucide-react';

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '1:1', label: 'Square', icon: '▢' },
  { value: '4:3', label: 'Classic', icon: '▭' },
  { value: '3:4', label: 'Poster', icon: '▯' },
  { value: '16:9', label: 'Video', icon: '▬' },
  { value: '9:16', label: 'Reels', icon: '▮' },
  { value: '3:2', label: 'Photo', icon: '▭' },
  { value: '2:3', label: 'Book', icon: '▯' },
  { value: '21:9', label: 'Cinema', icon: '▬▬' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'explainer' | 'visualizer'>('explainer');
  const [pages, setPages] = useState<MangaPage[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visualizer state
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('1:1');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      setIsApiKeySelected(hasKey);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setIsApiKeySelected(true);
  };

  const handleUpload = (newPages: MangaPage[]) => {
    setPages(newPages);
    setError(null);
  };

  const handleRemove = (index: number) => {
    setPages(prev => prev.filter((_, i) => i !== index));
  };

  const generateExplanation = async () => {
    if (pages.length === 0) {
      setError("Please upload a manga PDF or some panels first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setScenes([]);

    try {
      const base64Images = pages.map(p => p.preview);
      const result = await explainManga(base64Images);
      setScenes(result);
      
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      setError(err.message || "Something went wrong while generating the story.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const imageUrl = await generateMangaImage(prompt, selectedRatio);
      setGeneratedImages(prev => [{
        url: imageUrl,
        prompt: prompt,
        aspectRatio: selectedRatio,
        timestamp: Date.now()
      }, ...prev]);
    } catch (err: any) {
      if (err.message === "API_KEY_EXPIRED") {
        setIsApiKeySelected(false);
        setError("Your session has expired. Please re-select your API key.");
      } else {
        setError(err.message || "Failed to generate image.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToText = () => {
    if (scenes.length === 0) return;

    const header = `MANGA KATHA - PRODUCTION SCRIPT\nGenerated with AI Studio\n${"=".repeat(40)}\n\n`;
    const body = scenes.map(scene => (
      `BEAT ${scene.id}: ${scene.title}\n` +
      `ACTIVE PANELS: ${scene.pages} | ESTIMATED DURATION: ${scene.duration}\n\n` +
      `HINDI VOICE SCRIPT:\n"${scene.voiceOver}"\n` +
      `${"-".repeat(40)}`
    )).join('\n\n');

    const blob = new Blob([header + body], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `manga_production_script_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyAllToClipboard = () => {
    const text = scenes.map(scene => (
      `BEAT ${scene.id}: ${scene.title}\nPANELS: ${scene.pages}\nDURATION: ${scene.duration}\nSCRIPT: ${scene.voiceOver}`
    )).join('\n\n');
    navigator.clipboard.writeText(text);
    alert("Full production script copied! Ready for voiceover. ✨");
  };

  return (
    <div className="min-h-screen pb-32 selection:bg-indigo-500/40">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/20 group-hover:rotate-6 transition-all duration-500">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Manga Katha <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-white/5">Studio</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">The Creator's Cinematic Engine</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <button 
              onClick={() => setActiveTab('explainer')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'explainer' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <BookOpen className="w-4 h-4" />
              Script Explainer
            </button>
            <button 
              onClick={() => setActiveTab('visualizer')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'visualizer' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <ImageIcon className="w-4 h-4" />
              Art Visualizer
            </button>
          </div>

          <button className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800/30 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Studio View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 sm:mt-20">
        {activeTab === 'explainer' ? (
          <div className="space-y-16 sm:space-y-24 animate-in fade-in duration-1000">
            {/* Explainer Hero */}
            <section className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] animate-bounce-subtle">
                <Sparkles className="w-4 h-4" />
                AI-Driven Production
              </div>
              <h2 className="text-5xl sm:text-7xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter">
                Your Manga, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400">Cinematically Narrated.</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg sm:text-xl hindi-text leading-relaxed font-light opacity-80">
                पैनल-बाय-पैनल कहानी का विश्लेषण करें और एक प्रोफेशनल यूट्यूब वीडियो के लिए विस्तृत हिंदी स्क्रिप्ट तैयार करें।
              </p>
            </section>

            {/* Production Phase 1: Upload */}
            <div className="space-y-12">
              <div className="glass-panel rounded-[3rem] p-8 sm:p-14 shadow-3xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-125 transition-transform duration-1000 rotate-12">
                    <Film className="w-48 h-48 text-indigo-500" />
                </div>
                
                <div className="relative space-y-10">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shadow-xl shadow-indigo-600/20">1</div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white uppercase tracking-wider">Source Material</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Upload your manga PDF to begin the analysis</p>
                    </div>
                  </div>
                  
                  <FileUpload pages={pages} onUpload={handleUpload} onRemove={handleRemove} />
                  
                  <div className="flex flex-col items-center pt-12 border-t border-white/5">
                    <button
                      onClick={generateExplanation}
                      disabled={isGenerating || pages.length === 0}
                      className={`
                        group relative flex items-center gap-5 px-14 py-6 rounded-3xl font-black text-2xl transition-all w-full sm:w-auto justify-center
                        ${isGenerating || pages.length === 0 
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(79,70,229,0.3)]'}
                      `}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-7 h-7 animate-spin" />
                          Studio Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                          Generate Master Script
                        </>
                      )}
                    </button>
                    
                    {error && (
                      <div className="mt-8 w-full max-w-lg">
                        <div className="flex items-center gap-4 text-red-400 bg-red-400/10 px-6 py-5 rounded-[2rem] border border-red-400/20 backdrop-blur-md">
                          <AlertCircle className="w-6 h-6 shrink-0" />
                          <span className="font-bold text-sm leading-relaxed">{error}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Production Phase 2: Results */}
              {scenes.length > 0 && (
                <div id="results-section" className="space-y-12 py-16 animate-in slide-in-from-bottom-20 duration-1000">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                        <ListMusic className="w-6 h-6 text-indigo-500" />
                        <h3 className="text-3xl font-black text-white tracking-tight">Production Beats</h3>
                      </div>
                      <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Granular scene-by-scene script breakdown</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={copyAllToClipboard}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900/80 border border-white/5 text-white rounded-2xl text-sm font-black hover:bg-slate-800 hover:border-white/10 transition-all shadow-xl"
                      >
                        Copy Script
                      </button>
                      <button 
                        onClick={exportToText}
                        className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-500 hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
                      >
                        <Download className="w-4 h-4" />
                        Export .txt
                      </button>
                    </div>
                  </div>

                  {/* The Timeline / Storyboard List */}
                  <div className="grid gap-12 relative">
                    <div className="absolute left-[30px] md:left-[40%] lg:left-[33%] top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/20 via-slate-800 to-transparent z-0 hidden md:block"></div>
                    {scenes.map((scene) => (
                      <SceneCard key={scene.id} scene={scene} allPages={pages} />
                    ))}
                  </div>

                  <div className="glass-panel bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-slate-950 rounded-[3.5rem] p-12 sm:p-24 border border-indigo-500/10 text-center shadow-3xl">
                    <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-600/40">
                        <Film className="w-12 h-12 text-white" />
                    </div>
                    <h4 className="text-4xl sm:text-5xl font-black text-white mb-6">Master Script Ready!</h4>
                    <p className="text-slate-400 mb-12 max-w-2xl mx-auto text-lg leading-relaxed font-light">
                      The story has been meticulously mapped to your manga panels. You can now use this script for your next viral video production.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                      <button 
                        onClick={() => { setPages([]); setScenes([]); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                        className="px-12 py-5 bg-white/5 text-white border border-white/10 rounded-2xl transition-all font-black text-lg hover:bg-white/10 hover:scale-105"
                      >
                        New Production
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-1000 space-y-20">
            {/* Visualizer Content remains similar but with updated styling for consistency */}
            <section className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">
                <ImageIcon className="w-4 h-4" />
                Artist Workflow
              </div>
              <h2 className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter">
                Dream in <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Manga Style.</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed font-light opacity-80">
                AI की मदद से अपनी कल्पना को मंगा चित्रों में बदलें। एक प्रो-लेवल आर्टिस्ट की तरह विजुअल्स तैयार करें।
              </p>
            </section>

            {!isApiKeySelected ? (
              <div className="glass-panel rounded-[3.5rem] p-12 sm:p-20 max-w-2xl mx-auto text-center shadow-3xl border border-indigo-500/10 bg-slate-950/40">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
                  <Key className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-4xl font-black text-white mb-6">Unlock Studio Pro</h3>
                <p className="text-slate-400 mb-12 text-lg leading-relaxed font-light">
                  To access High-Fidelity Gemini 3 Pro image generation, please connect your professional API key.
                </p>
                <div className="space-y-6">
                  <button 
                    onClick={handleSelectKey}
                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-2xl rounded-3xl transition-all shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4"
                  >
                    Select Key
                    <ChevronRight className="w-7 h-7" />
                  </button>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors font-bold uppercase tracking-widest"
                  >
                    Setup Billing & Limits <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-5 gap-12 items-start">
                {/* Visualizer Controls */}
                <div className="lg:col-span-2 space-y-10 sticky top-32">
                  <div className="glass-panel rounded-[2.5rem] p-10 space-y-10 border border-white/5">
                    <div className="space-y-5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] block">Prompt Architecture</label>
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. A legendary samurai walking through a futuristic shibuya under neon rain, dramatic shadows, extreme detail."
                        className="w-full bg-slate-950 border border-white/5 rounded-3xl p-6 text-white placeholder:text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all min-h-[200px] text-lg font-light leading-relaxed shadow-inner"
                      />
                    </div>

                    <div className="space-y-5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] block">Canvas Format</label>
                      <div className="grid grid-cols-4 gap-3">
                        {ASPECT_RATIOS.map((ratio) => (
                          <button
                            key={ratio.value}
                            onClick={() => setSelectedRatio(ratio.value)}
                            title={ratio.label}
                            className={`
                              flex flex-col items-center justify-center py-4 px-2 rounded-2xl border transition-all duration-300
                              ${selectedRatio === ratio.value 
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/20 scale-105' 
                                : 'bg-slate-950 border-white/5 text-slate-600 hover:border-slate-700 hover:text-slate-300'}
                            `}
                          >
                            <span className="text-2xl mb-1">{ratio.icon}</span>
                            <span className="text-[9px] font-black tracking-widest uppercase">{ratio.value}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateImage}
                      disabled={isGenerating || !prompt.trim()}
                      className={`
                        w-full flex items-center justify-center gap-5 py-6 rounded-3xl font-black text-2xl transition-all
                        ${isGenerating || !prompt.trim()
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 shadow-2xl shadow-indigo-600/30'}
                      `}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-7 h-7 animate-spin" />
                          Rendering...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-7 h-7" />
                          Generate Art
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Feed */}
                <div className="lg:col-span-3 space-y-12">
                   {isGenerating && (
                      <div className="glass-panel rounded-[3rem] overflow-hidden animate-pulse border-2 border-indigo-500/20 shadow-3xl">
                        <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center gap-8 relative">
                           <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent"></div>
                           <div className="relative">
                             <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                             <ImageIcon className="w-8 h-8 text-indigo-500 absolute inset-0 m-auto" />
                           </div>
                           <div className="text-center space-y-2">
                             <p className="text-indigo-400 font-black tracking-[0.4em] text-xs uppercase">Rendering Masterpiece</p>
                             <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">Optimizing for high-resolution...</p>
                           </div>
                        </div>
                        <div className="p-10 space-y-4 bg-slate-950/60">
                           <div className="h-4 w-32 bg-slate-800 rounded-full"></div>
                           <div className="h-4 w-full bg-slate-800 rounded-full opacity-50"></div>
                        </div>
                      </div>
                    )}

                  {generatedImages.length === 0 && !isGenerating && (
                    <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] text-slate-800 space-y-8 bg-slate-950/20">
                        <div className="w-32 h-32 rounded-full border-4 border-slate-900 flex items-center justify-center opacity-50">
                            <ImageIcon className="w-12 h-12" />
                        </div>
                        <p className="text-2xl font-black uppercase tracking-[0.2em] opacity-30">Production Gallery Empty</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-12">
                    {generatedImages.map((img) => (
                      <div key={img.timestamp} className="glass-panel rounded-[3.5rem] overflow-hidden group shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-700 hover:scale-[1.02] border border-white/5 bg-slate-950">
                        <div className="relative flex items-center justify-center overflow-hidden">
                           <img 
                            src={img.url} 
                            alt={img.prompt} 
                            className="w-full h-auto object-cover transition-transform group-hover:scale-[1.05] duration-1000" 
                           />
                           <div className="absolute top-8 right-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                              <a 
                                href={img.url} 
                                download={`studio-art-${img.timestamp}.png`}
                                className="p-4 bg-white text-slate-950 rounded-[1.5rem] hover:scale-110 active:scale-90 transition-all shadow-2xl flex items-center gap-2 font-black text-sm"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                           </div>
                           <div className="absolute bottom-8 left-8 flex items-center gap-3 bg-black/80 backdrop-blur-3xl px-6 py-3 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-4 group-hover:translate-y-0 shadow-2xl">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">{img.aspectRatio} Cinema Format</span>
                           </div>
                        </div>
                        <div className="p-10 sm:p-14 space-y-6">
                          <p className="text-slate-100 text-2xl leading-relaxed font-light italic">
                            "{img.prompt}"
                          </p>
                          <div className="flex items-center gap-6 text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
                             <span className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                               Gemini 3 Pro Engine
                             </span>
                             <span>{new Date(img.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
