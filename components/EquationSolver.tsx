
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PhysicsEquation } from '../types';
import { dbService } from '../services/db';
import { getPhysicsExplanation } from '../services/gemini';
import katex from 'katex';
import { RefreshCw, Calculator, ArrowRight, Zap, Info } from 'lucide-react';

const MathRenderer: React.FC<{ content: string; isBlock?: boolean }> = ({ content, isBlock }) => {
  const mathHtml = useMemo(() => {
    try {
      return katex.renderToString(content, {
        throwOnError: false,
        displayMode: isBlock,
      });
    } catch (e) {
      console.warn('KaTeX rendering error:', e);
      return content; 
    }
  }, [content, isBlock]);

  return <span className={isBlock ? 'block text-2xl' : ''} dangerouslySetInnerHTML={{ __html: mathHtml }} />;
};

const EquationSolver: React.FC = () => {
  const [equations, setEquations] = useState<PhysicsEquation[]>([]);
  const [selectedEq, setSelectedEq] = useState<PhysicsEquation | null>(null);
  const [solveForTarget, setSolveForTarget] = useState<string>('');
  const [derivationSteps, setDerivationSteps] = useState<{title: string, content: string, type: 'IDENTIFY' | 'PARSE' | 'SOLVE' | 'VERIFY'}[]>([]);
  const [finalSolution, setFinalSolution] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSolving, setIsSolving] = useState(false);

  useEffect(() => {
    const loadEqs = async () => {
        setIsLoadingList(true);
        try {
            const data = await dbService.getEquations();
            setEquations(data);
        } catch (e) { console.error(e); }
        finally { setIsLoadingList(false); }
    };
    loadEqs();
  }, []);

  useEffect(() => {
    if (selectedEq) setSolveForTarget(selectedEq.solveFor || Object.keys(selectedEq.variables)[0]);
  }, [selectedEq]);

  const processEquation = async (eq: PhysicsEquation) => {
    setIsSolving(true);
    setDerivationSteps([]);
    setFinalSolution('');
    
    try {
      const prompt = `
      نظام التحليل الرياضي: نشط.
      المهمة: حل المعادلة الفيزيائية: ${eq.title}
      المدخلات الأصلية (LaTeX): ${eq.latex}
      تعريف الرموز: ${JSON.stringify(eq.variables)}
      المتغير المستهدف للحل: ${solveForTarget}
      
      المطلوب توليد مخرجات بالخطوات التالية حصراً:
      1. [IDENTIFY]: سرد المتغيرات مع وحداتها الفيزيائية.
      2. [PARSE]: تحليل الرموز.
      3. [SOLVE]: خطوات إعادة الترتيب الجبري للوصول لـ ${solveForTarget}.
      4. [VERIFY]: التحقق من الوحدات.
      5. [FINAL]: المعادلة النهائية بصيغة $$ LaTeX $$.
      `;
      
      const res = await getPhysicsExplanation(prompt, "UNIVERSITY");
      if (!res) throw new Error("Empty response");

      const steps: {title: string, content: string, type: any}[] = [];
      const sections = res.split(/\[(IDENTIFY|PARSE|SOLVE|VERIFY|FINAL)\]/);
      
      for (let i = 1; i < sections.length; i += 2) {
        const type = sections[i];
        const content = sections[i+1];
        if (type === 'FINAL') {
           setFinalSolution(content.trim());
        } else {
           steps.push({ 
             title: type === 'IDENTIFY' ? 'تعريف المتغيرات' : type === 'PARSE' ? 'تحليل الرموز' : type === 'SOLVE' ? 'خطوات الحل الجبري' : 'التحقق من الوحدات', 
             content: content.trim(), 
             type: type as any 
           });
        }
      }

      if (steps.length === 0) steps.push({ title: "تحليل النظام", content: res, type: 'SOLVE' });
      setDerivationSteps(steps);
    } catch (e) {
      setDerivationSteps([{ title: "خطأ", content: "فشل استدعاء محرك الحل.", type: 'SOLVE' }]);
    } finally {
      setIsSolving(false);
    }
  };

  const renderMathText = (text: string) => {
     return text.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g).map((part, i) => {
       if (part.startsWith('$$')) return <MathRenderer key={i} content={part.slice(2, -2)} isBlock />;
       if (part.startsWith('$')) return <MathRenderer key={i} content={part.slice(1, -1)} />;
       return <span key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br/>') }} />;
     });
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-16 border-r-4 border-[#00d2ff] pr-8 py-4 bg-white/5 rounded-l-[40px]">
        <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">محلل <span className="text-[#00d2ff] text-glow">المعادلات</span></h2>
        <p className="text-gray-500 text-xl font-medium max-w-2xl italic">أداة تفاعلية لاستنتاج المتغيرات المجهولة وفهم الاشتقاقات الرياضية.</p>
      </header>

      {isLoadingList ? (
          <div className="py-40 text-center animate-pulse"><RefreshCw className="w-12 h-12 text-[#00d2ff] animate-spin mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-6">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mr-4 mb-8">قوانين المنهج المسجلة</p>
                <div className="space-y-4">
                    {equations.map(eq => (
                        <button 
                        key={eq.id}
                        onClick={() => { setSelectedEq(eq); setDerivationSteps([]); setFinalSolution(''); }}
                        className={`w-full text-right p-8 rounded-[40px] border transition-all group relative overflow-hidden ${selectedEq?.id === eq.id ? 'bg-[#00d2ff] text-black border-[#00d2ff] shadow-2xl scale-105' : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:translate-x-2'}`}
                        >
                        <span className={`text-[8px] font-black uppercase tracking-widest absolute top-6 left-8 opacity-40 ${selectedEq?.id === eq.id ? 'text-black' : 'text-[#00d2ff]'}`}>{eq.category}</span>
                        <h4 className="text-lg font-black mt-4">{eq.title}</h4>
                        <div className="mt-6 opacity-60 group-hover:opacity-100 transition-opacity overflow-hidden text-sm">
                            <MathRenderer content={eq.latex} />
                        </div>
                        </button>
                    ))}
                    {equations.length === 0 && (
                        <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-30 italic text-sm">لا توجد قوانين مسجلة بعد.</div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-8">
            {selectedEq ? (
                <div className="space-y-10 animate-slideUp">
                    <div className="glass-panel p-16 rounded-[70px] border-white/10 relative overflow-hidden bg-black/40">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-12">
                            <h3 className="text-4xl font-black text-white">{selectedEq.title}</h3>
                        </div>
                        
                        <div className="bg-black/60 p-12 rounded-[50px] border border-white/5 mb-12 shadow-inner">
                            <MathRenderer content={selectedEq.latex} isBlock />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                            <div className="space-y-8">
                                <h5 className="text-[10px] font-black text-[#00d2ff] uppercase tracking-widest border-b border-[#00d2ff]/20 pb-4">المجهول المطلوب؟</h5>
                                <div className="flex flex-wrap gap-3">
                                {Object.keys(selectedEq.variables).map(sym => (
                                    <button 
                                    key={sym} 
                                    onClick={() => setSolveForTarget(sym)}
                                    className={`px-5 py-3 rounded-xl border font-black text-sm transition-all ${solveForTarget === sym ? 'bg-[#00d2ff] text-black border-[#00d2ff] scale-110 shadow-lg shadow-[#00d2ff]/20' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
                                    >
                                    {sym}
                                    </button>
                                ))}
                                </div>
                            </div>
                            <div className="space-y-8">
                                <h5 className="text-[10px] font-black text-[#00d2ff] uppercase tracking-widest border-b border-[#00d2ff]/20 pb-4">بدء التحليل</h5>
                                <button 
                                onClick={() => processEquation(selectedEq)}
                                disabled={isSolving}
                                className="w-full py-7 bg-white text-black rounded-[35px] font-black text-[12px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-6 group shadow-white/5"
                                >
                                {isSolving ? (
                                    <>
                                    <RefreshCw className="animate-spin" size={18} /> جاري التحليل الرياضي...
                                    </>
                                ) : (
                                    <>
                                    استخرج معادلة لـ ({solveForTarget})
                                    <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                                    </>
                                )}
                                </button>
                            </div>
                        </div>
                    </div>
                    </div>

                    {(derivationSteps.length > 0 || isSolving) && (
                    <div className="glass-panel p-16 rounded-[70px] border-[#00d2ff]/30 bg-[#00d2ff]/5 animate-slideUp relative shadow-2xl">
                        <h4 className="text-2xl font-black mb-12 flex items-center gap-6">
                            <Zap className="text-[#00d2ff] animate-pulse" /> خطوات الحل الجبري
                        </h4>
                        
                        {isSolving ? (
                            <div className="py-24 text-center">
                            <div className="w-16 h-16 border-4 border-[#00d2ff] border-t-transparent rounded-full animate-spin mx-auto mb-10"></div>
                            <p className="text-gray-500 font-bold">جاري ترتيب أطراف المعادلة...</p>
                            </div>
                        ) : (
                            <div className="space-y-10">
                            <div className="space-y-6">
                                {derivationSteps.map((step, idx) => (
                                    <div key={idx} className="p-8 bg-black/40 rounded-[40px] border border-white/5 animate-slideUp relative group overflow-hidden" style={{animationDelay: `${idx*0.1}s`}}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className={`w-2 h-2 rounded-full ${step.type === 'IDENTIFY' ? 'bg-blue-500' : step.type === 'PARSE' ? 'bg-purple-500' : 'bg-[#00d2ff]'}`}></span>
                                        <span className="text-[10px] font-black text-[#00d2ff] uppercase tracking-widest">{step.title}</span>
                                    </div>
                                    <div className="text-gray-300 leading-relaxed text-lg">
                                        {renderMathText(step.content)}
                                    </div>
                                    </div>
                                ))}
                            </div>

                            {finalSolution && (
                                <div className="mt-16 pt-16 border-t border-white/10 text-center animate-slideUp" style={{animationDelay: '0.8s'}}>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-10">الصيغة النهائية للقانون</p>
                                    <div className="p-12 bg-white text-black rounded-[50px] shadow-2xl transform hover:scale-[1.02] transition-transform">
                                    <MathRenderer content={finalSolution.replace(/\$\$/g, '')} isBlock />
                                    </div>
                                </div>
                            )}
                            </div>
                        )}
                    </div>
                    )}
                </div>
            ) : (
                <div className="h-[700px] flex flex-col items-center justify-center glass-panel rounded-[80px] border-dashed border-white/10 opacity-30 text-center p-24 bg-black/10">
                    <Calculator size={80} className="mb-10 text-gray-600" />
                    <h3 className="text-4xl font-black uppercase tracking-widest mb-6">محلل المعادلات الذكي</h3>
                    <p className="max-w-md text-xl leading-relaxed">اختر قانوناً من القائمة الجانبية للبدء في تحليل اشتقاقه وحل متغيراته.</p>
                </div>
            )}
            </div>
        </div>
      )}
    </div>
  );
};

export default EquationSolver;
