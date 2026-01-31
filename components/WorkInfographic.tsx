
import React from 'react';

const WorkInfographic: React.FC = () => {
  return (
    <div className="glass-panel p-12 rounded-[60px] border-[#00d2ff]/20 bg-[#010304]/60 relative overflow-hidden shadow-[0_0_80px_rgba(0,210,255,0.1)]">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00d2ff 1px, transparent 1px), linear-gradient(90deg, #00d2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <div className="relative z-10 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-[#fbbf24] font-black uppercase tracking-widest text-[10px]">شرح توضيحي</span>
          <h3 className="text-5xl font-black text-white text-glow-cyan leading-none">مفهوم الشغل الميكانيكي</h3>
        </div>

        {/* The Core Diagram */}
        <div className="flex flex-col md:flex-row items-center justify-around gap-12 py-10">
          <div className="relative w-full max-w-md aspect-video bg-black/40 rounded-[40px] border border-white/5 flex items-center justify-center p-8 overflow-hidden">
            <svg viewBox="0 0 400 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,210,255,0.3)]">
              {/* Surface */}
              <line x1="20" y1="160" x2="380" y2="160" stroke="#333" strokeWidth="2" strokeDasharray="4 4" />
              
              {/* Displacement Vector (d) */}
              <line x1="200" y1="160" x2="350" y2="160" stroke="#00d2ff" strokeWidth="4" strokeLinecap="round" />
              <path d="M 350 160 l -10 -5 v 10 z" fill="#00d2ff" />
              <text x="280" y="185" fill="#00d2ff" fontSize="12" fontWeight="900">الإزاحة (d)</text>

              {/* The Box */}
              <rect x="150" y="100" width="100" height="60" fill="#00d2ff" fillOpacity="0.1" stroke="#00d2ff" strokeWidth="2" rx="10" />
              <text x="200" y="135" fill="white" fontSize="10" fontWeight="900" textAnchor="middle">Object (m)</text>

              {/* Force Vector (F) */}
              <g transform="translate(200, 130) rotate(-35)">
                <line x1="0" y1="0" x2="120" y2="0" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
                <path d="M 120 0 l -10 -5 v 10 z" fill="#fbbf24" />
                <text x="50" y="-15" fill="#fbbf24" fontSize="14" fontWeight="900" transform="rotate(35, 50, -15)">القوة (F)</text>
              </g>

              {/* Angle Theta */}
              <path d="M 240 130 A 40 40 0 0 0 232.7 107.1" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="2 2" />
              <text x="245" y="125" fill="#fbbf24" fontSize="16" fontWeight="900">θ</text>
            </svg>
            <div className="absolute top-4 right-6 text-[8px] font-black text-[#00d2ff] opacity-40 uppercase tracking-widest">محاكاة توضيحية</div>
          </div>

          {/* Formula Breakdown */}
          <div className="space-y-8 flex-1">
            <div className="bg-black/60 p-8 rounded-[40px] border border-white/5 shadow-inner text-center">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">القانون الرياضي</h4>
              <div className="text-4xl font-black text-white tabular-nums">
                <span className="text-[#00d2ff]">W</span> = <span className="text-[#fbbf24]">F</span> · <span className="text-[#00d2ff]">d</span> · <span className="text-[#fbbf24]">cosθ</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'W', desc: 'الشغل (جول)', color: 'text-[#00d2ff]' },
                { label: 'F', desc: 'القوة (نيوتن)', color: 'text-[#fbbf24]' },
                { label: 'd', desc: 'الإزاحة (متر)', color: 'text-[#00d2ff]' },
                { label: 'θ', desc: 'الزاوية بين F و d', color: 'text-[#fbbf24]' }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                  <span className={`text-xl font-black ${item.color}`}>{item.label}</span>
                  <span className="text-[9px] font-bold text-gray-500">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
           <div className="p-6 bg-green-500/5 rounded-[35px] border border-green-500/10 text-center space-y-3">
              <div className="text-2xl">➡️➡️</div>
              <h5 className="font-black text-white text-sm">أكبر قيمة للشغل</h5>
              <p className="text-[10px] text-gray-500">عندما θ = 0° (القوة مع الإزاحة)</p>
           </div>
           <div className="p-6 bg-[#00d2ff]/5 rounded-[35px] border border-[#00d2ff]/10 text-center space-y-3">
              <div className="text-2xl">⬆️➡️</div>
              <h5 className="font-black text-white text-sm">شغل منعدم (صفر)</h5>
              <p className="text-[10px] text-gray-500">عندما θ = 90° (القوة عمودية)</p>
           </div>
           <div className="p-6 bg-red-500/5 rounded-[35px] border border-red-500/10 text-center space-y-3">
              <div className="text-2xl">⬅️➡️</div>
              <h5 className="font-black text-white text-sm">شغل سالب (معيق)</h5>
              <p className="text-[10px] text-gray-500">عندما θ = 180° (مثل الاحتكاك)</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WorkInfographic;
