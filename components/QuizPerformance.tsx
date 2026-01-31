import React, { useState, useEffect } from 'react';
import { User, StudentQuizAttempt, Question, PredictiveInsight } from '../types';
import { getPerformanceAnalysis } from '../services/gemini';

interface PerformanceAnalysisProps {
  user: User;
  attempts: StudentQuizAttempt[];
}

const PerformanceAnalysis: React.FC<PerformanceAnalysisProps> = ({ user, attempts: initialAttempts }) => {
  const [attempts, setAttempts] = useState<StudentQuizAttempt[]>(initialAttempts || []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);

  useEffect(() => {
    if (initialAttempts.length > 0) {
      runAnalysis(initialAttempts);
    }
    setInsights([
      { topicId: 'kwt-12-t2', topicTitle: 'الفيزياء النووية', probabilityOfDifficulty: 78, reasoning: 'لاحظنا بعض الصعوبات في الأسئلة المتعلقة بالموجات، مما قد يؤثر على فهمك للفيزياء النووية.', suggestedPrep: 'راجع درس "تركيب النواة" بتركيز.' },
      { topicId: 'kwt-11-t2', topicTitle: 'العزوم', probabilityOfDifficulty: 25, reasoning: 'مستواك ممتاز في قوانين نيوتن، وهذا سيسهل عليك فهم درس العزوم.', suggestedPrep: 'ابدأ بحل مسائل العزوم مباشرة.' }
    ]);
  }, [initialAttempts]);

  const runAnalysis = async (currentAttempts: StudentQuizAttempt[]) => {
    setIsLoading(true);
    try {
      const result = await getPerformanceAnalysis(user, currentAttempts);
      setAnalysis(result);
    } catch (e) {
      setAnalysis("فشل الاتصال بنظام التحليل.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmed = line.trim();
      const firstChar = trimmed[0];
      const isDigit = firstChar >= '0' && firstChar <= '9';
      
      if (isDigit || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return <p key={i} className="mb-4 text-gray-300 font-medium border-r-2 border-[#00d2ff] pr-4 py-1">{line}</p>;
      }
      return <p key={i} className="mb-4 text-gray-400 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] space-y-12">
      <div className="glass-panel p-12 rounded-[60px] border-[#00d2ff]/20 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#00d2ff]/5 rounded-full blur-[100px]"></div>
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
           <div className="text-right">
              <h2 className="text-4xl font-black mb-2 tracking-tighter">تحليل <span className="text-[#00d2ff]">الأداء الدراسي</span></h2>
              <p className="text-gray-500">نصائح مخصصة لك بناءً على {attempts.length} اختباراً منجزاً.</p>
           </div>
           <button 
             onClick={() => runAnalysis(attempts)} 
             disabled={isLoading || attempts.length === 0}
             className="bg-white/5 border border-white/10 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-30"
           >
             {isLoading ? 'جاري التحليل...' : 'تحديث التحليل'}
           </button>
        </header>

        {isLoading ? (
          <div className="py-32 text-center animate-pulse">
             <div className="w-16 h-16 border-4 border-[#00d2ff] border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
             <p className="text-[10px] font-black text-[#00d2ff] uppercase tracking-[0.5em]">جاري معالجة بياناتك...</p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-32 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[40px]">
             <span className="text-6xl mb-6 block">📉</span>
             <p className="font-black text-sm uppercase tracking-widest">لا توجد بيانات كافية للتحليل. أنجز اختباراتك أولاً.</p>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
             <div className="bg-black/40 p-10 rounded-[40px] border border-white/5 shadow-2xl">
                {renderContent(analysis)}
             </div>
          </div>
        )}
      </div>

      <div className="glass-panel p-12 rounded-[60px] border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
         <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
            <span className="text-3xl">🔮</span> توقعات الأداء المستقبلي
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-8 bg-black/40 rounded-[40px] border border-white/5 group hover:border-purple-500/40 transition-all">
                 <div className="flex justify-between items-start mb-6">
                    <h4 className="text-lg font-black text-white">{insight.topicTitle}</h4>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${insight.probabilityOfDifficulty > 50 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                       مستوى الصعوبة المتوقع: {insight.probabilityOfDifficulty}%
                    </span>
                 </div>
                 <p className="text-xs text-gray-500 leading-relaxed mb-6 italic">"{insight.reasoning}"</p>
                 <div className="pt-6 border-t border-white/5">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">نصيحة المعلم</p>
                    <p className="text-sm text-gray-300 font-bold">{insight.suggestedPrep}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default PerformanceAnalysis;