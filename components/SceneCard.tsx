
import React, { useState } from 'react';
import { Clock, Volume2, LayoutPanelLeft, PlayCircle, Copy, Check, Info } from 'lucide-react';
import { Scene, MangaPage } from '../types';

interface SceneCardProps {
  scene: Scene;
  allPages: MangaPage[];
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene, allPages }) => {
  const [copied, setCopied] = useState(false);
  
  const durationValue = parseInt(scene.duration) || 15;
  const durationPercent = Math.min((durationValue / 60) * 100, 100);

  const copySceneText = () => {
    const text = `BEAT ${scene.id}: ${scene.title}\nPANELS: ${scene.pages}\nDURATION: ${scene.duration}\n\nSCRIPT:\n${scene.voiceOver}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      {/* Beat Connector Line */}
      <div className="absolute -left-[31px] md:-left-[41px] lg:-left-[34px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500 via-indigo-500/50 to-transparent z-0 hidden md:block opacity-30 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Beat Marker Dot */}
      <div className="absolute -left-[35px] md:-left-[45px] lg:-left-[38px] top-10 w-3 h-3 rounded-full bg-indigo-500 border-4 border-slate-950 z-10 hidden md:block group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>

      <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 hover:border-indigo-500/30 hover:shadow-indigo-500/5 bg-slate-900/40 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row">
          
          {/* Visual Storyboard Side */}
          <div className="lg:w-80 xl:w-96 bg-black/20 p-6 border-b lg:border-b-0 lg:border-r border-white/5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                 <LayoutPanelLeft className="w-4 h-4 text-indigo-400" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Storyboard View</span>
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[9px] font-black text-indigo-400 uppercase">
                  {scene.panelIndices.length} {scene.panelIndices.length === 1 ? 'Panel' : 'Panels'}
                </span>
              </div>
            </div>
            
            <div className={`grid gap-3 ${scene.panelIndices.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {scene.panelIndices.map((idx) => (
                <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/5 group/frame shadow-lg bg-slate-950">
                  {allPages[idx] ? (
                    <>
                      <img 
                        src={allPages[idx].preview} 
                        alt={`Panel ${idx + 1}`} 
                        className="w-full h-full object-cover transition-all group-hover/frame:scale-105 duration-700 opacity-90 group-hover/frame:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60"></div>
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-black text-indigo-300 border border-white/10">
                        P{idx + 1}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[8px] text-slate-700 font-black uppercase border border-dashed border-slate-800 rounded-xl p-4 text-center">
                      <Info className="w-4 h-4 mb-1 opacity-20" />
                      Index {idx + 1}
                    </div>
                  )}
                </div>
              ))}
              {scene.panelIndices.length === 0 && (
                <div className="aspect-[3/4] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                  <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">No Visuals</span>
                </div>
              )}
            </div>
          </div>

          {/* Script & Narration Side */}
          <div className="flex-1 p-8 sm:p-10 flex flex-col justify-between relative">
            {/* Top Section */}
            <div className="space-y-8">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-[0.4em] text-indigo-500 uppercase">Beat Sequence {scene.id}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight group-hover:text-indigo-200 transition-colors">
                    {scene.title}
                  </h3>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-black text-white uppercase tabular-nums tracking-widest">{scene.duration}</span>
                  </div>
                  <button 
                    onClick={copySceneText}
                    className="p-2.5 bg-slate-950/60 text-slate-400 hover:text-white rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all active:scale-90"
                    title="Copy this scene"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Hindi Narration Block */}
              <div className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600/20 rounded-full">
                  <div className="w-full h-1/3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]"></div>
                </div>
                <div className="space-y-5">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Volume2 className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-black tracking-[0.2em]">Narration Script</span>
                    </div>
                    <div className="hindi-text text-xl sm:text-2xl lg:text-3xl leading-[1.6] text-slate-200 font-light max-w-4xl">
                      <p className="whitespace-pre-wrap selection:bg-indigo-500/30">
                        {scene.voiceOver}
                      </p>
                    </div>
                </div>
              </div>
            </div>

            {/* Bottom Duration Progress Bar */}
            <div className="mt-12 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <PlayCircle className="w-3.5 h-3.5" />
                   <span>Audio Timeline Breakdown</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{durationValue} Seconds Est.</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  style={{ width: `${durationPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
