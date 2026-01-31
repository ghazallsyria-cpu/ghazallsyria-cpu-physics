import React, { useState, useEffect, useRef } from 'react';
import { PhysicsExperiment, SavedExperiment } from '../types';

interface VRLabProps {
  experiment: PhysicsExperiment;
  onBack: () => void;
}

const VRLab: React.FC<VRLabProps> = ({ experiment, onBack }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHapticActive, setIsHapticActive] = useState(false);
  const [telemetry, setTelemetry] = useState<string[]>([]);
  const [depth, setDepth] = useState(0);
  const [notes, setNotes] = useState('');
  
  const storageKey = `ssc_vrlab_notes_${experiment.id}`;

  useEffect(() => {
    // Load saved notes on mount
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientY / innerHeight - 0.5) * 15;
      const y = (e.clientX / innerWidth - 0.5) * 15;
      setRotation({ x, y });
      setDepth(Math.abs(x) + Math.abs(y));
    };

    window.addEventListener('mousemove', handleMouseMove);
    setTelemetry(['System Initialized', 'Neural Link Established', `Protocol: ${experiment.title}`]);
    
    const telemetryInterval = setInterval(() => {
        setTelemetry(prev => [...prev.slice(-6), `SIGNAL: ${Math.random().toString(36).substr(2, 6).toUpperCase()} SYNCED AT ${(Math.random()*100).toFixed(3)}%`]);
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(telemetryInterval);
    };
  }, [experiment.id, experiment.title]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem(storageKey, notes);
    } catch (e) {
        console.warn("Could not save VR lab notes to localStorage:", e);
    }
  }, [notes, storageKey]);


  const triggerHaptic = () => {
    setIsHapticActive(true);
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    setTimeout(() => setIsHapticActive(false), 600);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#010304] font-['Tajawal'] text-white overflow-hidden flex items-center justify-center cursor-crosshair perspective-2000">
      <div 
        className="absolute inset-0 bg-grid-large bg-[#00d2ff]/5 transition-transform duration-100 ease-out pointer-events-none"
        style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${1 + depth/100})` }}
      >
        <div className="absolute inset-0 nebula-glow opacity-20"></div>
      </div>

      <div className="absolute inset-0 border-[20px] md:border-[80px] border-[#010304] pointer-events-none z-50">
         <div className="absolute top-8 left-1/2 -translate-x-1/2 px-8 py-3 bg-red-600/10 border border-red-500/30 rounded-full flex items-center gap-4 backdrop-blur-xl">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-ping shadow-[0_0_20px_#dc2626]"></div>
            <span className="text-[9px] md:text-[12px] font-black uppercase tracking-[0.4em] md:tracking-[0.8em] text-red-500 animate-pulse">Neural Reality Active</span>
         </div>

         <div className="absolute left-4 md:left-24 top-1/4 w-64 md:w-80 space-y-6 md:space-y-10 pointer-events-auto">
            <div className="glass-panel p-6 md:p-8 rounded-[30px] md:rounded-[40px] border-[#00d2ff]/20 bg-black/40">
               <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Stream</p>
                  <span className="w-2 h-2 bg-[#00d2ff] rounded-full animate-pulse"></span>
               </div>
               <div className="space-y-2 max-h-32 md:max-h-48 overflow-hidden font-mono">
                  {telemetry.map((t, i) => (
                    <p key={i} className="text-[9px] md:text-[11px] font-bold text-[#00d2ff] opacity-60 truncate animate-slideUp">{'>>'} {t}</p>
                  ))}
               </div>
            </div>
            <button 
              onClick={triggerHaptic} 
              className="w-full py-4 md:py-6 bg-white/5 border border-white/10 rounded-[20px] md:rounded-[30px] text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] hover:bg-[#00d2ff] hover:text-black hover:border-[#00d2ff] transition-all transform hover:scale-105 active:scale-95 shadow-2xl"
            >
              Test Haptics
            </button>
         </div>

         <div className="absolute right-4 md:right-24 top-1/4 w-64 md:w-80 pointer-events-auto space-y-6 md:space-y-10">
            <button onClick={onBack} className="w-full py-5 md:py-8 bg-red-600/10 border border-red-600/40 rounded-[30px] md:rounded-[40px] text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] md:tracking-[0.6em] text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-[0_0_50px_rgba(220,38,38,0.2)]">
               Exit Immersion
            </button>
            <div className="glass-panel p-6 rounded-[30px] border-purple-500/30 bg-purple-900/5 relative overflow-hidden">
               <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Lab Notebook</h4>
               <textarea
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
                 placeholder="Record your observations here..."
                 className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-purple-200 outline-none focus:border-purple-500 no-scrollbar resize-none"
               />
               <button onClick={() => setNotes('')} className="mt-2 text-[9px] text-gray-500 hover:text-red-500 font-bold transition-colors">Clear Notes</button>
            </div>
         </div>
      </div>

      <div 
        className={`relative w-full max-w-[1400px] aspect-video rounded-[60px] md:rounded-[100px] border-4 transition-all duration-500 ${isHapticActive ? 'scale-95 blur-md border-red-600 shadow-[0_0_100px_rgba(220,38,38,0.5)]' : 'border-white/10 shadow-[0_60px_200px_rgba(0,0,0,0.9)]'}`}
        style={{ transform: `rotateX(${rotation.x * 0.4}deg) rotateY(${rotation.y * 0.4}deg)` }}
      >
         <div className="absolute inset-0 bg-gradient-to-tr from-[#00d2ff]/10 via-transparent to-purple-600/10 rounded-[inherit] overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
               <div className="text-center">
                  <div className="relative w-32 h-32 md:w-48 md:h-48 mx-auto mb-12">
                     <div className="absolute inset-0 border-4 md:border-8 border-dashed border-[#00d2ff]/40 rounded-full animate-spin-slow"></div>
                     <div className="absolute inset-2 md:inset-4 border-2 md:border-4 border-white/10 rounded-full"></div>
                     <div className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl">⚛️</div>
                  </div>
                  <h3 className="text-2xl md:text-6xl font-black tracking-tighter text-white/40 uppercase tracking-[0.2em] md:tracking-[0.6em] animate-pulse">Rendering Reality Node...</h3>
               </div>
            </div>
         </div>

         <div className="absolute bottom-12 md:bottom-24 left-1/2 -translate-x-1/2 flex gap-4 md:gap-12">
            {[ { i: '🖐️', l: 'Kinetic' }, { i: '🔧', l: 'Adjust' }, { i: '🔍', l: 'Focus' }, { i: '📊', l: 'Data' } ].map((tool, i) => (
              <div key={i} className="flex flex-col items-center gap-2 md:gap-4 group">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl md:text-4xl hover:scale-125 transition-all hover:bg-[#00d2ff]/20 hover:border-[#00d2ff] cursor-pointer shadow-2xl">
                  {tool.i}
                </div>
                <span className="text-[9px] md:text-[10px] font-black text-gray-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">{tool.l}</span>
              </div>
            ))}
         </div>
      </div>
      
      {isHapticActive && <div className="fixed inset-0 z-[200] border-[20px] md:border-[40px] border-[#00d2ff] animate-ping opacity-20 pointer-events-none"></div>}
    </div>
  );
};

export default VRLab;
