
import React, { useState, useEffect, useRef } from 'react';

const EnergyPendulum: React.FC = () => {
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(null);
  
  const length = 200;
  const gravity = 9.81;
  const amplitude = Math.PI / 4; 
  const omega = Math.sqrt(gravity / (length / 100));

  useEffect(() => {
    const animate = () => {
      setTime(prev => prev + 0.04);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, []);

  const currentAngle = amplitude * Math.cos(omega * time);
  const pe = 100 * (1 - Math.cos(currentAngle)) / (1 - Math.cos(amplitude));
  const ke = 100 - pe;

  return (
    <div className="glass-panel p-8 md:p-10 rounded-[50px] border-[#00d2ff]/20 space-y-10 relative overflow-hidden">
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-[80px]"></div>

      <div className="flex justify-between items-center border-b border-white/5 pb-6">
        <div>
          <h4 className="text-2xl font-black text-white text-glow-cyan">حفظ الطاقة الميكانيكية ⏳</h4>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">تجربة البندول البسيط</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 px-5 py-2 rounded-xl text-purple-400 font-black text-xs hidden sm:block">
          ME = PE + KE
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
        <div className="flex-1 h-80 w-full flex justify-center bg-black/80 rounded-[40px] border border-white/5 relative overflow-hidden shadow-inner">
           <svg width="100%" height="100%" viewBox="0 0 400 350" className="relative z-10">
             {/* Support Bar */}
             <rect x="150" y="0" width="100" height="4" fill="#333" rx="2" />
             <circle cx="200" cy="4" r="5" fill="#00d2ff" className="animate-pulse" />
             
             {/* The String */}
             <line 
                x1="200" y1="4" 
                x2={200 + length * Math.sin(currentAngle)} 
                y2={4 + length * Math.cos(currentAngle)} 
                stroke="#666" strokeWidth="1" strokeDasharray="5 5"
             />
             
             {/* The Bob */}
             <g transform={`translate(${200 + length * Math.sin(currentAngle)}, ${4 + length * Math.cos(currentAngle)})`}>
                <circle r="22" fill="#00d2ff" fillOpacity="0.05" />
                <circle r="14" fill="url(#bobGrad)" className="shadow-2xl" />
                <circle r="14" fill="none" stroke="#00d2ff" strokeWidth="0.5" className="animate-pulse" />
             </g>
             
             <defs>
                <radialGradient id="bobGrad">
                  <stop offset="0%" stopColor="#00d2ff" />
                  <stop offset="100%" stopColor="#004488" />
                </radialGradient>
             </defs>
           </svg>
           <div className="absolute top-6 right-8 text-[8px] font-black text-gray-600 uppercase tracking-[0.4em]">المحاكاة نشطة</div>
        </div>

        <div className="w-full md:w-64 space-y-10">
           <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                 <span>طاقة وضع (PE)</span>
                 <span className="text-[#fbbf24]">{pe.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                 <div className="h-full bg-gradient-to-r from-[#fbbf24] to-yellow-600 transition-all duration-75 shadow-[0_0_15px_rgba(251,191,36,0.4)] rounded-full" style={{ width: `${pe}%` }}></div>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                 <span>طاقة حركة (KE)</span>
                 <span className="text-[#00d2ff]">{ke.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                 <div className="h-full bg-gradient-to-r from-[#00d2ff] to-cyan-600 transition-all duration-75 shadow-[0_0_15px_rgba(0,210,255,0.4)] rounded-full" style={{ width: `${ke}%` }}></div>
              </div>
           </div>

           <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 text-center">
              <p className="text-[10px] font-bold text-gray-500 italic leading-relaxed">
                "لاحظ كيف تتبادل الطاقة أدوارها: أقصى طاقة وضع عند الأطراف، وأقصى طاقة حركة عند المنتصف."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyPendulum;
