
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Calculator, LineChart, ChevronDown, ChevronUp, 
  ZoomIn, X, CheckCircle2, FlaskConical, Share2, Info, BarChart as BarChartIcon, Code
} from 'lucide-react';
import katex from 'katex';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Lesson, UniversalLessonConfig } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Math Renderer Component - Fixed Direction to LTR for scientific accuracy
const MathBlock: React.FC<{ tex: string; inline?: boolean }> = ({ tex, inline }) => {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: !inline });
  return (
    <div dir="ltr" className={`${inline ? "inline-block mx-1" : "flex justify-center my-6"}`}>
       <span 
         dangerouslySetInnerHTML={{ __html: html }} 
         className={inline ? "font-serif text-[#00d2ff] text-lg font-bold" : "text-xl md:text-3xl text-white font-bold"} 
       />
    </div>
  );
};

interface UniversalLessonViewerProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: () => void;
  isCompleted: boolean;
}

const UniversalLessonViewer: React.FC<UniversalLessonViewerProps> = ({ lesson, onBack, onComplete, isCompleted }) => {
  const config = lesson.universalConfig;
  
  if (!config) {
      return <div className="p-20 text-center text-red-500 font-bold">خطأ: تكوين الدرس الشامل مفقود.</div>;
  }

  // State
  const [calcValues, setCalcValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // Initialize values
  useEffect(() => {
    const initials: Record<string, number> = {};
    config.variables.forEach(v => {
        initials[v.id] = v.defaultValue;
    });
    setCalcValues(initials);
  }, [config]);

  // Dynamic Calculation
  useEffect(() => {
    try {
        const vars = Object.keys(calcValues);
        const values = Object.values(calcValues);
        if (vars.length > 0) {
            const func = new Function(...vars, `return ${config.calculationFormula};`);
            const res = func(...values);
            setResult(isNaN(res) ? 0 : res);
        }
    } catch (e) {
        console.error("Calculation Error:", e);
    }
  }, [calcValues, config.calculationFormula]);

  // Chart Logic
  const chartData = useMemo(() => {
    if (!config.graphConfig || !config.graphConfig.xAxisVariableId) return null;
    
    const xVarId = config.graphConfig.xAxisVariableId;
    const xVar = config.variables.find(v => v.id === xVarId);
    
    if (!xVar) return null;

    const stepsCount = 12;
    const stepSize = (xVar.max - xVar.min) / (stepsCount - 1);
    const labels = Array.from({length: stepsCount}, (_, i) => parseFloat((xVar.min + i * stepSize).toFixed(1)));

    const dataPoints = labels.map(val => {
        const tempValues = { ...calcValues, [xVarId]: val };
        try {
            const func = new Function(...Object.keys(tempValues), `return ${config.calculationFormula};`);
            return func(...Object.values(tempValues));
        } catch { return 0; }
    });

    const color = config.graphConfig.lineColor || '#00d2ff';
    const isArea = config.graphConfig.chartType === 'area';

    return {
        labels,
        datasets: [{
            label: `${config.graphConfig.yAxisLabel}`,
            data: dataPoints,
            borderColor: color,
            backgroundColor: isArea ? `${color}33` : `${color}88`,
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 8,
            fill: isArea
        }]
    };
  }, [calcValues, config]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#fff', font: { family: 'Tajawal', size: 12 } } },
      tooltip: { 
          backgroundColor: 'rgba(0,0,0,0.9)', 
          titleColor: config.graphConfig?.lineColor || '#00d2ff', 
          bodyFont: { family: 'Tajawal' },
          padding: 12,
          cornerRadius: 10,
          displayColors: false
      }
    },
    scales: {
      y: { 
          grid: { color: 'rgba(255,255,255,0.05)' }, 
          ticks: { color: '#aaa', font: { family: 'Tajawal' } },
          border: { display: false }
      },
      x: { 
          grid: { color: 'rgba(255,255,255,0.05)' }, 
          ticks: { color: '#aaa', font: { family: 'Tajawal' } },
          border: { display: false }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A2540] font-['Tajawal'] text-right text-white pb-20 animate-fadeIn" dir="rtl">
        {/* Header */}
        <div className="relative h-[350px] overflow-hidden rounded-b-[80px] border-b border-white/10 shadow-2xl mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-[#0A2540] to-black opacity-90 z-10"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
            <div className="relative z-20 container mx-auto px-6 h-full flex flex-col justify-center items-start pt-10">
                <div className="flex gap-3 mb-6">
                    <span className="px-5 py-2 bg-[#fbbf24] text-black rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20">درس تفاعلي ذكي</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tighter">{lesson.title}</h1>
                <p className="text-gray-300 text-lg md:text-xl max-w-3xl leading-relaxed font-light">{config.introduction}</p>
                <button onClick={onBack} className="absolute top-8 left-8 p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 group">
                    <X size={24} className="group-hover:rotate-90 transition-transform"/>
                </button>
            </div>
        </div>

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-12">
                
                {/* Visual Graph Area */}
                {chartData && (
                    <div className="glass-panel p-8 rounded-[50px] border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent shadow-2xl relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-8 px-2">
                            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                {config.graphConfig?.chartType === 'bar' ? <BarChartIcon className="text-[#00d2ff]" /> : <LineChart className="text-[#00d2ff]" />} 
                                التحليل البياني المباشر
                            </h3>
                        </div>
                        <div className="h-[450px] w-full relative z-10">
                            {config.graphConfig?.chartType === 'bar' ? 
                                <Bar data={chartData} options={chartOptions} /> : 
                                <Line data={chartData} options={chartOptions} />
                            }
                        </div>
                    </div>
                )}

                {/* Main Equation */}
                <div className="glass-panel p-10 rounded-[40px] border-r-4 border-[#00d2ff] bg-black/20">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-[#00d2ff]/10 rounded-xl flex items-center justify-center text-[#00d2ff]"><Calculator size={20}/></div>
                        <h3 className="text-xl font-black text-white">الصيغة الرياضية</h3>
                    </div>
                    <MathBlock tex={config.mainEquation} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-center">
                        {config.variables.map((v, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <MathBlock tex={v.symbol} inline />
                                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">{v.name}</p>
                                <p className="text-[9px] text-[#fbbf24] font-mono mt-1">[{v.unit}]</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Objectives */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10">
                    <h3 className="text-xl font-black text-gray-300 mb-6 flex items-center gap-3"><CheckCircle2 size={20} className="text-green-500" /> ماذا سنتعلم؟</h3>
                    <ul className="space-y-4">
                        {config.objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-4">
                                <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-[10px] font-black shrink-0 mt-1">{i + 1}</span>
                                <span className="text-gray-400 leading-relaxed text-sm font-medium">{obj}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Additional Content Blocks */}
                {lesson.content && lesson.content.map((block, i) => (
                    <div key={i} className="space-y-4">
                        {block.caption && <h3 className="text-2xl font-bold text-white border-r-4 border-[#fbbf24] pr-4">{block.caption}</h3>}
                        
                        {/* Text Block with LTR Math Fix */}
                        {block.type === 'text' && (
                            <div className="prose prose-invert max-w-none text-gray-300 text-lg leading-loose font-light">
                                <p dangerouslySetInnerHTML={{
                                    __html: block.content.replace(/\$(.*?)\$/g, (match, tex) => 
                                        `<span dir="ltr" class="inline-block mx-1 font-bold text-[#00d2ff] font-serif">${katex.renderToString(tex, {throwOnError:false})}</span>`
                                    )
                                }} />
                            </div>
                        )}

                        {/* HTML/Simulation Block - Verified Rendering */}
                        {block.type === 'html' && (
                            <div className="my-8 w-full bg-black/40 border border-white/10 rounded-[30px] overflow-hidden shadow-2xl relative group min-h-[500px]">
                                <div className="absolute top-0 left-0 bg-[#fbbf24] text-black px-3 py-1 text-[9px] font-black uppercase tracking-widest z-10 rounded-br-xl shadow-lg flex items-center gap-2">
                                    <Code size={10} /> محاكاة تفاعلية
                                </div>
                                <iframe
                                    srcDoc={`
                                        <!DOCTYPE html>
                                        <html dir="rtl">
                                        <head>
                                            <meta charset="UTF-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                            <style>
                                                body { margin: 0; padding: 20px; background: transparent; color: #fff; font-family: 'Tajawal', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow-x: hidden; }
                                                * { box-sizing: border-box; }
                                                ::-webkit-scrollbar { width: 6px; }
                                                ::-webkit-scrollbar-track { background: #000; }
                                                ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
                                            </style>
                                        </head>
                                        <body>
                                            <div style="width: 100%;">${block.content}</div>
                                        </body>
                                        </html>
                                    `}
                                    title={`Interactive-Block-${i}`}
                                    className="w-full min-h-[500px] border-none bg-transparent"
                                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                />
                            </div>
                        )}

                        {/* Image Block */}
                        {block.type === 'image' && (
                            <div className="relative group rounded-[40px] overflow-hidden border border-white/10 cursor-zoom-in shadow-2xl" onClick={() => setLightboxImage(block.content)}>
                                <img src={block.content} className="w-full h-auto object-cover" alt="visual" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ZoomIn className="text-white w-10 h-10"/></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Sidebar Calculator */}
            <div className="lg:col-span-4 space-y-8">
                <div className="sticky top-8">
                    <div className="glass-panel p-8 rounded-[40px] border-[#fbbf24]/20 bg-[#fbbf24]/5 shadow-[0_0_50px_rgba(251,191,36,0.1)] mb-8 relative overflow-hidden">
                        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#fbbf24]/10 rounded-full blur-[60px]"></div>
                        <h3 className="text-xl font-black text-[#fbbf24] mb-8 flex items-center gap-3 relative z-10"><Calculator /> المختبر الحسابي</h3>
                        
                        <div className="space-y-8 relative z-10">
                            {config.variables.map(variable => (
                                <div key={variable.id} className="space-y-3">
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                                        <span>{variable.name} <span className="font-serif text-[#fbbf24] mx-1">({variable.symbol})</span></span>
                                        <span className="bg-black/30 px-2 py-1 rounded text-[#00d2ff]">{calcValues[variable.id]} {variable.unit}</span>
                                    </div>
                                    <input 
                                        type="range" min={variable.min} max={variable.max} step={variable.step}
                                        value={calcValues[variable.id] || variable.defaultValue}
                                        onChange={(e) => setCalcValues({...calcValues, [variable.id]: Number(e.target.value)})}
                                        className="w-full h-2 bg-black/40 rounded-full appearance-none accent-[#fbbf24] cursor-pointer hover:accent-[#00d2ff] transition-all"
                                    />
                                </div>
                            ))}
                            
                            <div className="pt-8 border-t border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] mb-2">القيمة المحسوبة</p>
                                <div className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(251,191,36,0.4)] tabular-nums tracking-tighter" dir="ltr">
                                    {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xl text-[#fbbf24] font-medium ml-2">{config.resultUnit}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quiz Widget */}
                    {config.interactiveQuiz && (
                        <div className="bg-black/40 rounded-[30px] border border-white/5 overflow-hidden">
                            <button onClick={() => setShowQuiz(!showQuiz)} className="w-full flex justify-between items-center p-6 hover:bg-white/5 transition-all">
                                <span className="font-bold flex items-center gap-3 text-sm"><Info size={18} className="text-green-400"/> اختبر فهمك</span>
                                {showQuiz ? <ChevronUp size={18} className="text-gray-500"/> : <ChevronDown size={18} className="text-gray-500"/>}
                            </button>
                            {showQuiz && (
                                <div className="p-6 pt-0 border-t border-white/5 bg-black/20">
                                    <p className="text-sm text-gray-300 mb-6 font-medium leading-relaxed">{config.interactiveQuiz.question}</p>
                                    <div className="space-y-3">
                                        {config.interactiveQuiz.options.map((opt, idx) => (
                                            <button key={idx} onClick={() => alert(idx === config.interactiveQuiz?.correctIndex ? "إجابة صحيحة! أحسنت." : "حاول مرة أخرى.")} className="w-full text-right p-4 rounded-2xl bg-white/5 hover:bg-[#00d2ff]/20 hover:text-[#00d2ff] hover:border-[#00d2ff]/30 transition-all text-xs font-bold border border-white/5">
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button onClick={onComplete} className={`px-8 py-5 rounded-2xl font-black text-xs uppercase transition-all shadow-xl w-full flex items-center justify-center gap-3 ${isCompleted ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[#fbbf24] text-black hover:scale-105 active:scale-95'}`}>
                            {isCompleted ? <CheckCircle2 size={18}/> : <Share2 size={18}/>}
                            {isCompleted ? 'تم إكمال الدرس' : 'إتمام الدرس والحصول على النقاط'}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {lightboxImage && (
            <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn" onClick={() => setLightboxImage(null)}>
                <img src={lightboxImage} alt="Zoom" className="max-w-full max-h-[90vh] rounded-[30px] shadow-2xl border-2 border-white/10" />
                <button className="absolute top-8 right-8 text-white bg-white/10 p-4 rounded-full hover:bg-red-500 transition-all"><X size={24} /></button>
            </div>
        )}
    </div>
  );
};

export default UniversalLessonViewer;
