
import React from 'react';
import { PhysicsExperiment } from '../types';

interface FutureLabsProps {
  onSelect: (exp: PhysicsExperiment) => void;
  experiments: PhysicsExperiment[];
}

const FutureLabs: React.FC<FutureLabsProps> = ({ onSelect, experiments }) => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <header className="mb-20 text-center">
        <div className="inline-block px-6 py-2 bg-[#7000ff]/20 border border-[#7000ff]/40 rounded-full text-[10px] font-black uppercase tracking-[0.6em] text-[#7000ff] mb-8">Next-Gen Research</div>
        <h2 className="text-7xl font-black mb-6 tracking-tighter italic">مختبرات <span className="text-[#00d2ff] text-glow">المستقبل</span></h2>
        <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
          استكشف آفاق الفيزياء الحديثة من خلال محاكاة أبحاث الطاقة والكون المتقدمة.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {experiments.map(exp => (
          <div 
            key={exp.id} 
            onClick={() => onSelect(exp)}
            className="glass-panel group p-12 rounded-[60px] border-[#00d2ff]/10 hover:border-[#00d2ff]/40 transition-all duration-700 cursor-pointer overflow-hidden relative bg-black/40"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d2ff]/5 rounded-full blur-[100px]"></div>
             
             <div className="flex flex-col lg:flex-row gap-10 relative z-10">
                <div className="w-full lg:w-48 h-48 rounded-[40px] overflow-hidden border border-white/5 bg-black">
                   <img src={exp.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={exp.title} />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start mb-4">
                      <h3 className="text-3xl font-black group-hover:text-[#00d2ff] transition-colors">{exp.title}</h3>
                      <span className="bg-white/5 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Experimental</span>
                   </div>
                   <p className="text-gray-400 text-sm leading-relaxed mb-10 line-clamp-3 italic">"{exp.description}"</p>
                   <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                         <span className="w-10 h-10 rounded-xl bg-[#00d2ff]/10 flex items-center justify-center text-lg shadow-inner">🧪</span>
                         <span className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg shadow-inner">🦾</span>
                      </div>
                      <button className="bg-white text-black px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest group-hover:scale-110 transition-all shadow-xl">تنشيط البروتوكول</button>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FutureLabs;
