
import React, { useState, useEffect, useMemo } from 'react';
import { User, Question } from '../types';
import { dbService } from '../services/db';
import katex from 'katex';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const MathRenderer: React.FC<{ content: string; isBlock?: boolean }> = ({ content, isBlock }) => {
  const mathHtml = useMemo(() => {
    try {
      return katex.renderToString(content, {
        throwOnError: false,
        displayMode: isBlock,
      });
    } catch (e) {
      console.warn('KaTeX rendering error:', e);
      return content; // Fallback to raw content on error
    }
  }, [content, isBlock]);

  const className = isBlock 
    ? "block bg-black/20 p-4 my-4 rounded-xl text-center" 
    : "inline-block";

  return <span className={className} dangerouslySetInnerHTML={{ __html: mathHtml }} />;
};

interface QuestionBankProps {
  user: User | null;
  onExplainAI?: (questionText: string) => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ user, onExplainAI }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAnswerFor, setShowAnswerFor] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const data = await dbService.getAllQuestions();
    setQuestions(data);
  };

  const filteredQuestions = user ? questions.filter(q => q.grade === user.grade) : [];

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn font-['Tajawal'] pb-20">
      <header className="mb-12 border-r-4 border-[#fbbf24] pr-8">
        <h2 className="text-5xl font-black mb-4 tracking-tighter italic">بنك أسئلة <span className="text-[#fbbf24]">الصف {user?.grade}</span></h2>
        <p className="text-gray-500 text-xl font-medium">أرشيف أسئلة المنهج الكويتي المرقمنة بذكاء اصطناعي تفاعلي.</p>
      </header>

      <div className="space-y-10">
        {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
          <div key={q.id} className="glass-panel p-10 md:p-14 rounded-[60px] border-white/5 hover:border-[#fbbf24]/30 transition-all text-right group relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-transparent">
            
            <div className="flex justify-between items-center mb-10">
              <div className="flex gap-3">
                 <span className="bg-white/5 px-5 py-2 rounded-full text-[8px] font-black text-[#fbbf24] uppercase tracking-widest border border-[#fbbf24]/20 shadow-inner">{q.type}</span>
                 <span className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                   q.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                   q.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                   'bg-red-500/10 text-red-500 border-red-500/20'
                 }`}>{q.difficulty}</span>
              </div>
              <div className="flex items-center gap-3">
                 {/* Verification Indicator */}
                 {q.isVerified ? (
                    <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full" title="تم التحقق من الجودة بواسطة AI">
                      <ShieldCheck className="w-3 h-3 text-green-500" />
                      <span className="text-[8px] font-bold text-green-500 uppercase tracking-wider">AI Verified</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full" title="يحتاج للمراجعة">
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                      <span className="text-[8px] font-bold text-yellow-500 uppercase tracking-wider">Review Needed</span>
                    </div>
                 )}
                 <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                 <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{q.unit}</span>
                 <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                 <span className="text-[10px] font-black text-[#00d2ff] uppercase tracking-widest">{q.category}</span>
              </div>
            </div>
            
            <div className="mb-10">
               <h4 className="text-2xl md:text-3xl font-bold leading-relaxed text-white mb-8">
                 {((q as any).question_text || q.text || "").split(/(\$.*?\$)/g).map((part, i) => i % 2 === 0 ? part : <MathRenderer key={i} content={part.slice(1, -1)} />)}
               </h4>
               {q.question_latex && (
                 <div className="bg-black/40 p-10 rounded-[45px] border border-white/5 mb-8 text-center shadow-inner">
                    <MathRenderer content={q.question_latex} isBlock />
                 </div>
               )}
            </div>

            {q.type === 'mcq' && (q.choices || (q as any).answers) && ((q.choices || (q as any).answers).length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                 {(q.choices || (q as any).answers).map((choice: any) => (
                   <div key={choice.key || choice.id} className="p-7 bg-white/[0.03] border border-white/5 rounded-[30px] flex items-center justify-between group/choice hover:bg-white/[0.06] transition-all">
                      <span className="font-bold text-gray-300 group-hover/choice:text-white transition-colors">{choice.text}</span>
                      <span className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-[#fbbf24] shadow-inner">{choice.key || choice.id.split('-').pop()}</span>
                   </div>
                 ))}
              </div>
            )}
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setShowAnswerFor(showAnswerFor === q.id ? null : q.id)}
                className="bg-white text-black px-12 py-5 rounded-[25px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
              >
                {showAnswerFor === q.id ? 'إخفاء الإجابة' : 'كشف الحل النموذجي 5B'}
              </button>
            </div>

            {showAnswerFor === q.id && (
              <div className="mt-12 space-y-8 animate-slideUp">
                 {/* خطوات الحل المهيكلة 5B */}
                 <div className="p-10 bg-black/40 border border-white/10 rounded-[50px] shadow-2xl">
                    <h5 className="text-[10px] font-black text-[#fbbf24] uppercase tracking-[0.4em] mb-8 border-b border-white/5 pb-4">تسلسل الحل المبرمج (Structured Solution)</h5>
                    <div className="space-y-6">
                       {q.steps_array && q.steps_array.length > 0 ? q.steps_array.map((step, i) => (
                         <div key={i} className="flex gap-6 items-start">
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-[#fbbf24] shrink-0 border border-white/5">{i+1}</div>
                            <p className="text-gray-300 text-lg leading-relaxed pt-1 italic">
                              {step.split(/(\$.*?\$)/g).map((part, idx) => idx % 2 === 0 ? part : <MathRenderer key={idx} content={part.slice(1, -1)} />)}
                            </p>
                         </div>
                       )) : (
                         <div className="text-gray-300 text-lg leading-relaxed italic">
                           {q.solution?.split(/(\$.*?\$)/g).map((part, idx) => idx % 2 === 0 ? part : <MathRenderer key={idx} content={part.slice(1, -1)} />) || "يرجى مراجعة الكتاب المدرسي."}
                         </div>
                       )}
                    </div>
                 </div>

                 {/* الأخطاء الشائعة 5B */}
                 {q.common_errors && q.common_errors.length > 0 && (
                   <div className="p-10 bg-red-500/5 border border-red-500/10 rounded-[50px]">
                      <div className="flex items-center gap-4 mb-6">
                         <span className="text-2xl">⚠️</span>
                         <h5 className="text-lg font-black text-red-400">احذر من هذه الأخطاء (تحليل الأخطاء):</h5>
                      </div>
                      <ul className="space-y-4">
                         {q.common_errors.map((err, i) => (
                           <li key={i} className="flex items-start gap-4 text-gray-400 text-sm italic">
                              <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0"></span>
                              {err}
                           </li>
                         ))}
                      </ul>
                   </div>
                 )}
              </div>
            )}
          </div>
        )) : (
          <div className="py-32 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[80px]">
             <span className="text-8xl mb-6 block">📖</span>
             <p className="font-black text-sm uppercase tracking-[0.5em]">لا توجد أسئلة مرقمنة في هذا التصنيف بعد.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;