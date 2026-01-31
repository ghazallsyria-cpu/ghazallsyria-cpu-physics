
import React, { useState, useEffect, useRef } from 'react';
import { PhysicsExperiment, SavedExperiment } from '../types';
import { RefreshCw } from 'lucide-react';

interface VirtualLabProps {
  experiment: PhysicsExperiment;
  onBack: () => void;
  onSaveResult: (save: SavedExperiment) => void;
}

const VirtualLab: React.FC<VirtualLabProps> = ({ experiment, onBack, onSaveResult }) => {
  const [params, setParams] = useState<Record<string, number>>(
    Object.fromEntries(experiment.parameters.map(p => [p.id, p.defaultValue]))
  );
  const [history, setHistory] = useState<{val: number, time: number}[]>([]);
  const [envMode, setEnvMode] = useState<'Standard' | 'Vacuum' | 'High-Gravity'>('Standard');
  const [displayVal, setDisplayVal] = useState(0);
  const [isChanging, setIsChanging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showStateLoaded, setShowStateLoaded] = useState(false);
  const [flashState, setFlashState] = useState<'none' | 'success' | 'alert'>('none');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);
  const changeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = `ssc_vlab_state_${experiment.id}`;

  // Load state from localStorage on mount
  useEffect(() => {
    const savedStateRaw = localStorage.getItem(storageKey);
    if (savedStateRaw) {
        try {
            const savedState = JSON.parse(savedStateRaw);
            setParams(savedState.params);
            setEnvMode(savedState.envMode);
            setShowStateLoaded(true);
            setTimeout(() => setShowStateLoaded(false), 3000);
        } catch (e) {
            console.error("Failed to parse saved lab state", e);
        }
    }
  }, [experiment.id]);

  // Save state to localStorage on change
  useEffect(() => {
    try {
        localStorage.setItem(storageKey, JSON.stringify({ params, envMode }));
    } catch (e) {
        console.warn("Could not save lab state to localStorage:", e);
    }
  }, [params, envMode]);

  const calculateResult = () => {
    if (experiment.id === 'exp-ohm') {
        return (params.voltage / params.resistance);
    }
    if (experiment.id === 'exp-fusion') {
      const yield_val = (params.temp * params.pressure) / 10;
      return yield_val > 100 ? yield_val * 1.5 : yield_val;
    }
    return 0;
  };

  const handleParamChange = (id: string, value: number) => {
    setParams(prev => ({ ...prev, [id]: value }));
    setIsChanging(true);
    
    if (value >= experiment.parameters.find(p => p.id === id)!.max * 0.9) {
        setFlashState('alert');
        setTimeout(() => setFlashState('none'), 300);
    }

    if (changeTimeoutRef.current) clearTimeout(changeTimeoutRef.current);
    changeTimeoutRef.current = setTimeout(() => setIsChanging(false), 400);
  };
  
  const handleReset = () => {
    localStorage.removeItem(storageKey);
    setParams(Object.fromEntries(experiment.parameters.map(p => [p.id, p.defaultValue])));
    setEnvMode('Standard');
    setHistory([]);
  };

  useEffect(() => {
    const target = calculateResult();
    const startVal = displayVal;
    const startTime = Date.now();
    
    const animateValue = () => {
      const progress = Math.min((Date.now() - startTime) / 150, 1);
      const current = startVal + (target - startVal) * progress;
      setDisplayVal(current);
      if (progress < 1) requestAnimationFrame(animateValue);
    };
    animateValue();

    const logInterval = setInterval(() => {
        const res = calculateResult();
        setHistory(prev => [...prev, { val: res, time: Date.now() }].slice(-80));
    }, 50);

    return () => clearInterval(logInterval);
  }, [params, envMode]);

  useEffect(() => {
    const canvas = graphRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const themeColor = '#00d2ff';

      ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
      ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }

      if (history.length < 2) { animFrame = requestAnimationFrame(render); return; }

      const vals = history.map(h => h.val);
      const maxVal = Math.max(...vals, 10) * 1.2;
      const minVal = Math.min(...vals, 0) * 0.8;
      const range = maxVal - minVal;

      ctx.shadowBlur = isChanging ? 25 : 12;
      ctx.shadowColor = themeColor;
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      history.forEach((p, i) => {
        const x = (i / (history.length - 1)) * canvas.width;
        const y = canvas.height - ((p.val - minVal) / (range || 1)) * canvas.height;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      animFrame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animFrame);
  }, [history, isChanging]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const draw = () => {
      frame += 0.04;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (experiment.id === 'exp-ohm') {
        const current = (params.voltage / params.resistance);
        const flowRate = current * 30;
        
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        ctx.strokeRect(400, 250, 800, 400);

        for(let i=0; i<60; i++) {
          const t = (Date.now() * flowRate * 0.0005 + i * 0.05) % 1;
          let px = 0, py = 0;
          if (t < 0.3) { px = 400 + (t/0.3)*800; py = 250; }
          else if (t < 0.5) { px = 1200; py = 250 + ((t-0.3)/0.2)*400; }
          else if (t < 0.8) { px = 1200 - ((t-0.5)/0.3)*800; py = 650; }
          else { px = 400; py = 650 - ((t-0.8)/0.2)*400; }
          
          ctx.fillStyle = '#00d2ff';
          ctx.shadowBlur = 10; ctx.shadowColor = '#00d2ff';
          ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2); ctx.fill();
        }
      }

      if (experiment.id === 'exp-fusion') {
        const cx = 800, cy = 450;
        const radius = 180 + Math.sin(frame * 4) * 15;
        const plasmaIntensity = (params.temp / 200);
        const magneticEffect = (params.pressure / 10);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.5);
        grad.addColorStop(0, `rgba(255, 255, 255, ${plasmaIntensity})`);
        grad.addColorStop(0.2, `rgba(112, 0, 255, ${plasmaIntensity * 0.9})`);
        grad.addColorStop(0.5, `rgba(0, 210, 255, ${plasmaIntensity * 0.6})`);
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2); ctx.fill();

        for(let i=0; i<40; i++) {
           const angle = (frame * (i%5 + 1) + i) * 0.5;
           const dist = radius * (0.3 + 0.7 * Math.sin(frame + i));
           ctx.fillStyle = i % 2 === 0 ? '#00d2ff' : '#fff';
           ctx.beginPath();
           ctx.arc(cx + Math.cos(angle)*dist, cy + Math.sin(angle)*dist, 2, 0, Math.PI*2);
           ctx.fill();
        }

        ctx.strokeStyle = `rgba(0, 210, 255, ${magneticEffect * 0.5})`;
        ctx.lineWidth = 10;
        ctx.setLineDash([20, 40]);
        ctx.beginPath(); ctx.arc(cx, cy, radius + 80, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }

      requestAnimationFrame(draw);
    };
    draw();
  }, [experiment.id, params, envMode]);

  return (
    <div className={`fixed inset-0 z-[100] bg-[#010304] flex flex-col lg:flex-row overflow-hidden font-['Tajawal'] text-white transition-colors duration-300 ${flashState === 'alert' ? 'bg-red-900/20' : ''}`}>
      
      {flashState === 'alert' && <div className="fixed inset-0 z-[1000] border-[10px] border-red-500/50 pointer-events-none animate-pulse"></div>}
      {showSuccess && <div className="fixed inset-0 z-[1000] border-[10px] border-[#fbbf24]/50 pointer-events-none animate-ping"></div>}
      {showStateLoaded && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1001] bg-blue-500/20 border border-blue-500/40 text-blue-300 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest animate-fadeIn">
              ✓ تم تحميل جلستك السابقة
          </div>
      )}

      <div className={`w-full lg:w-[420px] bg-[#0a1118]/95 border-b lg:border-r border-white/10 p-8 md:p-12 flex flex-col gap-8 md:gap-12 backdrop-blur-3xl z-20 transition-all duration-500 ${isChanging ? 'border-[#00d2ff]/40' : ''}`}>
        <div className="flex justify-between items-center">
            <button onClick={onBack} className="text-[11px] font-black text-gray-500 hover:text-[#00d2ff] uppercase tracking-[0.4em] transition-all flex items-center gap-4 group active:opacity-50 touch-target">
               <span className="text-xl group-hover:-translate-x-2 transition-transform">←</span> Exit Lab
            </button>
            <button onClick={handleReset} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all" title="Reset to Defaults">
                <RefreshCw size={14} />
            </button>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-3 mb-4 justify-end">
             <span className="text-[11px] font-black text-[#fbbf24] uppercase tracking-[0.5em]">المعايرة اللحظية</span>
             <span className="w-3 h-3 bg-[#fbbf24] rounded-full animate-pulse shadow-[0_0_15px_#fbbf24]"></span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-tight">{experiment.title}</h2>
        </div>

        <div className="space-y-10 md:space-y-12">
          {experiment.parameters.map(p => (
            <div key={p.id} className="space-y-6">
              <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                <span className={`px-5 py-2 rounded-2xl transition-all duration-300 font-bold tabular-nums ${isChanging ? 'bg-[#00d2ff] text-black shadow-[0_0_25px_rgba(0,210,255,0.4)]' : 'bg-white/5 text-white'}`}>
                  {params[p.id]} {p.unit}
                </span>
                <span>{p.name}</span>
              </div>
              <input 
                type="range" min={p.min} max={p.max} step={p.step} value={params[p.id]}
                onChange={e => handleParamChange(p.id, parseFloat(e.target.value))}
                className="w-full accent-[#fbbf24] h-4 bg-white/10 rounded-full appearance-none cursor-pointer hover:bg-white/20 transition-all touch-target"
              />
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-8">
           <div className={`p-8 rounded-[40px] border transition-all duration-700 relative overflow-hidden ${isChanging ? 'border-[#00d2ff]/40 bg-[#00d2ff]/5' : 'bg-black/60 border-white/5'}`}>
              <canvas ref={graphRef} width={340} height={160} className="w-full h-32 mt-4" />
           </div>
           <button 
            onClick={() => {
              onSaveResult({id: Math.random().toString(), experimentId: experiment.id, experimentTitle: experiment.title, timestamp: new Date().toLocaleTimeString(), params, result: calculateResult()});
              setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2000);
            }} 
            className={`w-full py-6 md:py-7 rounded-[30px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 ${showSuccess ? 'bg-green-500 text-white' : 'bg-[#fbbf24] text-black'}`}
           >
             {showSuccess ? 'تم حفظ النتائج ✓' : 'حفظ بيانات التجربة'}
           </button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4 md:p-20 bg-grid-large bg-black/80">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-4 p-2 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-3xl z-40">
           {(['Standard', 'Vacuum', 'High-Gravity'] as const).map(mode => (
             <button 
              key={mode} 
              onClick={() => setEnvMode(mode)}
              className={`px-6 md:px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-90 ${envMode === mode ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}
             >
               {mode}
             </button>
           ))}
        </div>

        <div className="relative w-full max-w-[1400px] aspect-video glass-panel rounded-[50px] md:rounded-[100px] overflow-hidden border-white/10 shadow-[0_50px_150px_rgba(0,0,0,0.9)]">
           <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-transparent z-0"></div>
           <canvas ref={canvasRef} width={1600} height={900} className="w-full h-full object-contain relative z-10" />
           
           <div className="absolute bottom-12 md:bottom-24 right-12 md:right-24 text-right pointer-events-none z-20">
              <div className="text-[12px] font-black text-[#fbbf24] uppercase tracking-[0.8em] mb-4 opacity-70">إخراج المفاعلة</div>
              <div className="text-[6rem] md:text-[12rem] font-black text-white tracking-tighter tabular-nums drop-shadow-[0_20px_100px_rgba(251,191,36,0.3)] leading-none">
                {displayVal.toFixed(2)}
              </div>
           </div>

           <div className="absolute top-12 md:top-24 left-12 md:left-24 p-6 glass-card rounded-[30px] border-white/10 max-w-xs z-20 animate-slideUp hidden md:block">
              <p className="text-[10px] font-black text-[#fbbf24] uppercase tracking-widest mb-4">نصيحة سقراط 🤖</p>
              <p className="text-sm text-gray-300 italic leading-relaxed">
                "لاحظ الفرق في الاستقرار عند تغيير ضغط المفاعلة. التوازن هو مفتاح النجاح."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualLab;
