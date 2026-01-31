import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Unit, Lesson, Curriculum } from '../types';
import { dbService } from '../services/db';
import { Check, Play, Lock, Zap, RefreshCw, BookOpen, Star, Pin, Waypoints } from 'lucide-react';

interface CurriculumBrowserProps {
  user: User;
  subject: 'Physics' | 'Chemistry';
}

const CurriculumBrowser: React.FC<CurriculumBrowserProps> = ({ user, subject }) => {
  const navigate = useNavigate();
  const userInitialGrade = user.grade === 'uni' ? '12' : user.grade;
  const [selectedGrade, setSelectedGrade] = useState<'10' | '11' | '12'>(userInitialGrade);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [dbCurriculum, setDbCurriculum] = useState<Curriculum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSubscriber = user.subscription === 'premium' || user.role === 'admin' || user.role === 'teacher';

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    setIsLoading(true);
    try {
      // FIX: Property 'getCurriculumSupabase' does not exist on type 'DBService'.
      const data = await dbService.getCurriculum();
      setDbCurriculum(data);
    } catch (e) {
      console.error("Load failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const activeTopic = dbCurriculum.find(t => t.grade === selectedGrade && t.subject === subject);
  
  const navigateToLesson = (lesson: Lesson) => {
    if (!isSubscriber) {
        navigate('/subscription');
        return;
    }

    if (lesson.templateType === 'PATH') {
        if (lesson.pathRootSceneId) {
            navigate(`/lesson/${lesson.id}/path/${lesson.pathRootSceneId}`);
        } else {
            alert("هذا الدرس التفاعلي قيد الإنشاء حالياً. يرجى المحاولة لاحقاً.");
        }
        return;
    }
    
    // Default navigation for STANDARD and UNIVERSAL
    navigate(`/lesson/${lesson.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter italic">منهج <span className="text-[#fbbf24] text-glow">{subject === 'Physics' ? 'الفيزياء' : 'الكيمياء'}</span></h2>
        {!isSubscriber && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl inline-flex items-center gap-3 mb-6">
                <Zap size={16} className="text-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-amber-500">أنت تتصفح النسخة المجانية. اشترك لفتح كافة الدروس.</span>
            </div>
        )}
      </div>

      <div className="flex justify-center gap-4 mb-16">
        {(['12', '11', '10'] as const).map(grade => (
          <button
            key={grade}
            onClick={() => { setSelectedGrade(grade); setExpandedUnitId(null); }}
            className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${selectedGrade === grade ? 'bg-[#fbbf24] text-black shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
          >
            الصف {grade}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-32 text-center animate-pulse">
          <RefreshCw className="w-12 h-12 text-[#fbbf24] animate-spin mx-auto mb-6" />
          <p className="text-gray-500 font-bold">جاري تحميل المنهج المعتمد...</p>
        </div>
      ) : activeTopic && activeTopic.units && activeTopic.units.length > 0 ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {activeTopic.units.map((unit: Unit, idx: number) => (
            <div key={unit.id} className={`glass-panel border transition-all duration-500 overflow-hidden ${ expandedUnitId === unit.id ? 'rounded-[40px] border-[#00d2ff]/40 bg-[#00d2ff]/5' : 'rounded-[30px] border-white/5 bg-white/[0.02]' }`}>
              <button onClick={() => setExpandedUnitId(expandedUnitId === unit.id ? null : unit.id)} className="w-full flex items-center justify-between p-8 text-right group">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all ${ expandedUnitId === unit.id ? 'bg-[#00d2ff] text-black' : 'bg-white/5 text-gray-500' }`}>{idx + 1}</div>
                  <div>
                    <h4 className={`text-xl font-black transition-colors ${expandedUnitId === unit.id ? 'text-[#00d2ff]' : 'text-white'}`}>{unit.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{unit.lessons?.length || 0} دروس • {unit.description}</p>
                  </div>
                </div>
                <div className={`transform transition-transform ${expandedUnitId === unit.id ? 'rotate-180 text-[#00d2ff]' : 'text-gray-600'}`}>▼</div>
              </button>
              <div className={`transition-all duration-500 ease-in-out ${expandedUnitId === unit.id ? 'max-h-[1000px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
                 <div className="px-8 space-y-3">
                    {unit.lessons?.sort((a,b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((lesson, lIdx) => (
                        <div key={lesson.id} onClick={() => navigateToLesson(lesson)} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${lesson.isPinned ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30 hover:border-amber-500/50' : isSubscriber ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-black/40 border-white/5 opacity-80'}`}>
                           <div className="flex items-center gap-4">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${lesson.isPinned ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500'}`}>
                                  {lesson.isPinned ? <Pin size={14}/> : isSubscriber ? lIdx + 1 : <Lock size={12} className="text-amber-500" />}
                              </span>
                              <div>
                                  <p className={`text-sm flex items-center gap-2 ${lesson.isPinned ? 'font-black text-amber-400' : !isSubscriber ? 'text-gray-500' : 'text-gray-200'}`}>
                                      {lesson.title}
                                      {lesson.isPinned && <span className="text-[8px] bg-amber-500 text-black px-2 rounded-full">مثبت</span>}
                                  </p>
                                  {lesson.templateType === 'UNIVERSAL' && <p className="text-[9px] text-[#00d2ff] flex items-center gap-1 font-bold mt-0.5"><Star size={8} fill="currentColor"/> درس تفاعلي ذكي</p>}
                                  {lesson.templateType === 'PATH' && <p className="text-[9px] text-purple-400 flex items-center gap-1 font-bold mt-0.5"><Waypoints size={10}/> مسار تفاعلي</p>}
                              </div>
                           </div>
                           {!isSubscriber && <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Premium</span>}
                        </div>
                    ))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[60px] max-w-xl mx-auto bg-black/20">
          <BookOpen size={64} className="mx-auto mb-6 text-gray-600" />
          <p className="font-black text-lg uppercase tracking-widest mb-2">المنهج غير متوفر حالياً</p>
          <p className="text-sm text-gray-500">سيقوم المدير أو المعلم بإضافة محتوى الوحدة الأولى قريباً.</p>
        </div>
      )}
    </div>
  );
};

export default CurriculumBrowser;