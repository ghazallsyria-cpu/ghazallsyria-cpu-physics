
import React, { useState } from 'react';

const WorkInteractive: React.FC = () => {
  const [angle, setAngle] = useState(0);
  const force = 200; // N
  const distance = 15; // m
  const work = force * distance * Math.cos((angle * Math.PI) / 180);
  const isMoving = work > 10;

  return (
    <div className="glass-panel p-8 md:p-10 rounded-[50px] border-[#00d2ff]/20 space-y-10 relative overflow-hidden group">
      <style>{`
        @keyframes jiggle {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(1px, 1px) rotate(0.5deg); }
          50% { transform: translate(-1px, -1px) rotate(-0.5deg); }
          75% { transform: translate(-1px, 1px) rotate(0.5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .box-jiggle {
          animation: jiggle 0.4s infinite;
        }
      `}</style>
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#00d2ff]/5 rounded-full blur-[80px]"></div>
      
      <div className="flex justify-between items-center border-b border-white/5 pb-6">
        <div>
          <h4 className="text-2xl font-black text-[#00d2ff] text-glow-cyan">تجربة: تحليل الشغل 📐</h4>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">غير الزاوية وشاهد النتيجة</p>
        </div>
        <div className="bg-[#00d2ff]/10 border border-[#00d2ff]/30 px-5 py-2 rounded-xl text-[#00d2ff] font-mono text-xs hidden sm:block">
          W = F·d·cos(θ)
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
        <div className="flex-1 bg-black/80 rounded-[40px] p-6 md:p-10 border border-white/5 relative h-80 flex items-end justify-center overflow-hidden">
          {/* Ground */}
          <div className="absolute bottom-16 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          {/* Displacement Vector (Added for visualization context) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 h-8 flex items-center justify-center opacity-60">
             <div className="w-full h-0.5 bg-white/20 relative">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-white/40 rotate-45"></div>
               <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-white/40 uppercase tracking-widest">Displacement (d)</div>
             </div>
          </div>

          {/* Physical Object */}
          <div className={`w-32 h-32 bg-[#00d2ff]/10 border border-[#00d2ff]/40 rounded-3xl relative z-10 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(0,210,255,0.1)] transition-transform ${isMoving ? 'box-jiggle' : ''}`}>
            <span className="text-[10px] font-black text-[#00d2ff] uppercase mb-1">الكتلة (m)</span>
            <div className="w-12 h-1 bg-[#00d2ff]/30 rounded-full"></div>
            
            {/* Force Vector Arrow */}
            <div 
              className="absolute left-1/2 bottom-1/2 h-1 origin-left bg-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.6)]"
              style={{ 
                width: '160px', 
                transform: `rotate(-${angle}deg)`,
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' 
              }}
            >
              <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#fbbf24] rotate-45"></div>
              <div className="absolute -top-10 right-0 text-[10px] font-black text-[#fbbf24] bg-black/90 px-3 py-1.5 rounded-lg border border-[#fbbf24]/20 whitespace-nowrap" style={{ transform: `rotate(${angle}deg)` }}>
                F = 200 N
              </div>
            </div>

            {/* Angular Arc Helper */}
            <svg className="absolute left-1/2 bottom-1/2 w-32 h-32 pointer-events-none opacity-40">
              <path 
                d={`M 0 0 A 60 60 0 0 0 ${60 * Math.cos(angle * Math.PI / 180)} ${-60 * Math.sin(angle * Math.PI / 180)}`} 
                fill="none" stroke="#00d2ff" strokeWidth="1" strokeDasharray="4 4"
              />
            </svg>
          </div>

          <div className={`absolute top-6 left-8 text-[8px] font-black uppercase tracking-widest transition-colors duration-300 ${isMoving ? 'text-green-500 animate-pulse' : 'text-red-500'}`}>
             {isMoving ? 'Movement Detected' : 'No Movement'}
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">زاوية السحب (θ)</label>
              <span className="text-2xl font-black text-[#fbbf24] text-glow-gold">{angle}°</span>
            </div>
            <input 
              type="range" min="0" max="90" value={angle} 
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-[#00d2ff] cursor-pointer"
            />
          </div>

          <div className="space-y-4">
            <div className="p-8 bg-white/[0.02] rounded-[35px] border border-white/5 group hover:border-[#00d2ff]/30 transition-all">
               <p className="text-[9px] font-black text-gray-500 uppercase mb-3 tracking-widest">الشغل المبذول (W)</p>
               <h3 className="text-4xl font-black text-white tabular-nums">
                 {work.toFixed(1)} <span className="text-sm text-[#00d2ff] font-medium">جول</span>
               </h3>
            </div>
            
            <div className="p-6 bg-[#00d2ff]/5 rounded-3xl border border-[#00d2ff]/10">
               <p className="text-xs text-cyan-200/60 leading-relaxed italic">
                 "لاحظ: كلما زادت الزاوية، قل الشغل المبذول لأن جزءاً أكبر من القوة يضيع في محاولة رفع الجسم بدلاً من سحبه."
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkInteractive;
