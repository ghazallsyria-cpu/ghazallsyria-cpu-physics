
import React, { useState, useEffect, useRef } from 'react';
import { solvePhysicsProblem } from '../services/gemini';
import { AISolverResult } from '../types';
import katex from 'katex';

interface PhysicsSolverProps {
  initialProblem?: string;
}

const PhysicsSolver: React.FC<PhysicsSolverProps> = ({ initialProblem = '' }) => {
  const [input, setInput] = useState(initialProblem);
  const [result, setResult] = useState<AISolverResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSolve = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await solvePhysicsProblem(input);
      if (!data || !data.finalResult) {
        throw new Error("لم نتمكن من استخلاص حل منطقي.");
      }
      setResult(data);
    } catch (e) {
      setError("عذراً، واجهنا صعوبة في معالجة هذه المسألة. يرجى التأكد من صياغة السؤال بشكل واضح أو المحاولة لاحقاً.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = (stepText: string) => {
    const html = stepText.replace(/\$(.*?)\$/g, (match, math) => {
        try {
            return katex.renderToString(math, { throwOnError: false });
        } catch(e) { return match; }
    });
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="max-w-4xl mx-auto py-12 animate-fadeIn font-['Tajawal']" dir="rtl">
      <header className="mb-12 text-center">
        <div className="w-20 h-20 bg-[#fbbf24] text-black rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl animate-float">📝</div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter">حل <span className="text-[#fbbf24]">المسائل الفيزيائية</span></h2>
        <p className="text-gray-500 text-lg mt-2 font-medium">اكتب نص المسألة وسأقوم بمساعدتك في حلها خطوة بخطوة.</p>
      </header>

      <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-white/[0.02] mb-10">
        <textarea 
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null); }}
          placeholder="أدخل المسألة الفيزيائية هنا (مثال: سقط جسم من ارتفاع 10 أمتار، احسب سرعة ارتطامه بالأرض)..."
          className="w-full h-48 bg-black/40 border-2 border-white/5 rounded-[35px] p-8 text-xl outline-none focus:border-[#fbbf24] transition-all italic text-white placeholder:text-gray-700 no-scrollbar"
        />
        <button 
          onClick={handleSolve}
          disabled={isLoading || !input.trim()}
          className="w-full mt-6 bg-[#fbbf24] text-black font-black py-6 rounded-3xl shadow-[0_20px_50px_rgba(251,191,36,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-xl flex items-center justify-center gap-4"
        >
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              جاري الحل...
            </>
          ) : 'ابدأ الحل الآن ⚡'}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[30px] text-center animate-fadeIn">
           <span className="text-2xl block mb-2">⚠️</span>
           <p className="text-red-400 font-bold">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-8 animate-slideUp">
           <div className="glass-panel p-12 rounded-[60px] border-[#fbbf24]/20 bg-[#fbbf24]/5">
              <h3 className="text-[12px] font-black text-[#fbbf24] uppercase tracking-widest mb-8 border-b border-[#fbbf24]/20 pb-4">القانون المستخدم</h3>
              <div className="bg-black/60 p-10 rounded-[40px] border border-white/5 text-center">
                <div className="block text-3xl text-white" dangerouslySetInnerHTML={{ __html: katex.renderToString(result.law, { displayMode: true, throwOnError: false }) }} />
              </div>
           </div>

           <div className="glass-panel p-12 rounded-[60px] border-white/5">
              <h3 className="text-[12px] font-black text-[#00d2ff] uppercase tracking-widest mb-10 border-b border-white/10 pb-4">خطوات الحل</h3>
              <div className="space-y-8">
                {result.steps.map((step, i) => (
                  <div key={i} className="flex gap-8 items-start group">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center font-black text-[#00d2ff] text-sm shrink-0 border border-white/5 group-hover:border-[#00d2ff]/40 transition-all shadow-inner">{i+1}</div>
                    <div className="text-xl text-gray-300 leading-relaxed pt-1">
                      {renderStep(step)}
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="glass-panel p-16 rounded-[70px] border-green-500/20 bg-green-500/5 text-center shadow-[0_30px_100px_rgba(34,197,94,0.1)]">
              <h3 className="text-[12px] font-black text-green-500 uppercase tracking-widest mb-6">الناتج النهائي</h3>
              <div className="block text-6xl font-black text-white drop-shadow-2xl" dangerouslySetInnerHTML={{ __html: katex.renderToString(result.finalResult, { displayMode: true, throwOnError: false }) }} />
              <div className="mt-12 p-8 bg-black/40 rounded-[40px] border border-white/5">
                 <p className="text-gray-400 italic text-xl leading-relaxed">"{result.explanation}"</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PhysicsSolver;
