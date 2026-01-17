
import React from 'react';
import { Clock, BookOpen, Volume2, LayoutPanelLeft, PlayCircle } from 'lucide-react';
import { Scene, MangaPage } from '../types';

interface SceneCardProps {
  scene: Scene;
  allPages: MangaPage[];
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene, allPages }) => {
  // Calculate a width percentage for the duration bar based on an arbitrary max of 60s
  const durationValue = parseInt(scene.duration) || 10;
  const durationPercent = Math.min((durationValue / 60) * 100, 100);

  return (
    <div className="glass-panel rounded-[2.5rem] overflow-hidden hover:bg-slate-800/40 transition-all group duration-500 border border-white/5 shadow-2xl">
      <div className="flex flex-col md:flex-row">
        
        {/* Visual Storyboard Side */}
        <div className="md:w-2/5 lg:w-1/3 bg-black/40 p-4 border-b md:border-b-0 md:border-r border-white/5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
               <LayoutPanelLeft className="w-4 h-4 text-indigo-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Story Panels</span>
            </div>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase">
              {scene.panelIndices.length} {scene.panelIndices.length === 1 ? 'Frame' : 'Frames'}
            </span>
          </div>
          
          <div className={`grid gap-3 ${scene.panelIndices.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {scene.panelIndices.map((idx) => (
              <div key={idx} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group/frame shadow-lg">
                {allPages[idx] ? (
                  <>
                    <img 
                      src={allPages[idx].preview} 
                      alt={`Panel ${idx + 1}`} 
                      className="w-full h-full object-cover transition-transform group-hover/frame:scale-110 duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-2 left-2 bg-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-black text-white shadow-xl">
                      PANEL {idx + 1}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase italic border border-dashed border-slate-800 rounded-2xl">
                    Missing
                  </div>
                )}
              </div>
            ))}
            {scene.panelIndices.length === 0 && (
              <div className="aspect-video flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Global Scene</span>
              </div>
            )}
          </div>
        </div>

        {/* Script & Narration Side */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase">Production Beat {scene.id}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight group-hover:text-indigo-300 transition-colors">
                  {scene.title}
                </h3>
              </div>
              
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-2xl border border-white/5">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-black text-white uppercase tabular-nums tracking-wider">{scene.duration}</span>
                </div>
              </div>
            </div>

            {/* Script Box */}
            <div className="relative">
              <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-transparent rounded-full opacity-40"></div>
              <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <Volume2 className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-black tracking-widest">Narration Script (Hindi)</span>
                  </div>
                  <div className="hindi-text text-xl sm:text-2xl leading-[1.6] text-slate-100 font-light relative">
                    <span className="text-4xl text-indigo-500/20 absolute -left-8 -top-4 font-serif">"</span>
                    <p className="whitespace-pre-wrap">
                      {scene.voiceOver}
                    </p>
                    <span className="text-4xl text-indigo-500/20 absolute -right-4 bottom-0 font-serif">"</span>
                  </div>
              </div>
            </div>
          </div>

          {/* Bottom Info / Duration Bar */}
          <div className="mt-10 pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                 <PlayCircle className="w-3.5 h-3.5" />
                 <span>Timeline Progress</span>
              </div>
              <span>{scene.duration} Sequence</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-indigo-500/20"
                style={{ width: `${durationPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
