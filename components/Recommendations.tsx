import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AIRecommendation } from '../types';
import { dbService } from '../services/db';
import { AlertTriangle, BookOpen, Brain, MessageSquare, Target, RefreshCw, Sparkles, ChevronLeft } from 'lucide-react';

const Recommendations: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecs();
  }, [user]);

  const fetchRecs = async () => {
    setIsLoading(true);
    try {
        const data = await dbService.getAIRecommendations(user);
        setRecommendations(data);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleNavigate = (rec: AIRecommendation) => {
    // A simple mapping from recommendation type/ID to a URL
    let path = `/${rec.type}/${rec.targetId}`;
    if (rec.type === 'lesson') path = `/lesson/${rec.targetId}`;
    if (rec.type === 'quiz') path = `/quiz/${rec.targetId}`;
    if (rec.type === 'discussion') path = '/discussions'; // May need specific post ID later
    
    // Fallback if targetId is a view name
    if (['dashboard', 'curriculum', 'quiz-center'].includes(rec.targetId)) {
        path = `/${rec.targetId}`;
    }

    navigate(path);
  };

  const getUrgencyStyles = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high': return { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]' };
      case 'medium': return { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]' };
      default: return { text: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]' };
    }
  };
  
  const getIconForType = (type: AIRecommendation['type']) => {
    switch(type) {
      case 'lesson': return <BookOpen />;
      case 'quiz': return <Target />;
      case 'challenge': return <AlertTriangle />;
      case 'discussion': return <MessageSquare />;
      default: return <Brain />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <header className="mb-16 border-r-4 border-purple-500 pr-8 flex justify-between items-center">
        <div>
            <h2 className="text-5xl font-black mb-4 tracking-tighter">مسار <span className="text-purple-400 italic">التميز</span></h2>
            <p className="text-gray-500 text-xl font-medium">توصيات موجهة لك خصيصاً من فريق المركز السوري للعلوم.</p>
        </div>
        <button onClick={fetchRecs} className="p-4 bg-white/5 rounded-2xl text-gray-500 hover:text-purple-400 transition-all border border-white/10">
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/>
        </button>
      </header>

      {isLoading ? (
        <div className="py-40 text-center animate-pulse">
            <Sparkles className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-6" />
            <p className="text-gray-500 font-black text-xs uppercase tracking-widest">جاري سحب مسارك التعليمي المخصص...</p>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {recommendations.map((rec, idx) => {
            const styles = getUrgencyStyles(rec.urgency);
            return (
              <div 
                key={rec.id} 
                className={`glass-panel p-10 rounded-[50px] border ${styles.border} ${styles.bg} ${styles.glow} flex flex-col md:flex-row gap-10 items-center hover:scale-[1.01] transition-all group animate-slideUp`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`w-20 h-20 rounded-[35px] flex items-center justify-center text-3xl shrink-0 ${styles.bg} border-2 ${styles.border} ${styles.text} shadow-inner group-hover:scale-110 transition-transform`}>
                  {getIconForType(rec.type)}
                </div>
                <div className="flex-1 text-center md:text-right">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-3xl font-black text-white">{rec.title}</h3>
                    <span className={`px-6 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles.text} ${styles.border} ${styles.bg}`}>أولوية: {rec.urgency}</span>
                  </div>
                  <p className="text-gray-400 text-lg italic leading-relaxed mb-8">"{rec.reason}"</p>
                  <div className="flex justify-center md:justify-end">
                    <button onClick={() => handleNavigate(rec)} className="bg-white text-black font-black text-xs px-12 py-4 rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                        الانتقال للمهمة <ChevronLeft size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-40 text-center glass-panel rounded-[60px] border-dashed border-white/10 opacity-30 max-w-2xl mx-auto">
             <Brain size={80} className="mx-auto mb-8 text-gray-700" />
             <h3 className="text-2xl font-black text-white mb-2">لا توجد توصيات نشطة حالياً</h3>
             <p className="text-sm">سيقوم فريقك الأكاديمي بإرسال توجيهات مخصصة لمساعدتك فور رصد أي تحديات في مستواك.</p>
        </div>
      )}
    </div>
  );
};

export default Recommendations;