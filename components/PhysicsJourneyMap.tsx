import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Unit, Lesson, Curriculum } from '../types';
import { dbService } from '../services/db';
import { RefreshCw, Map } from 'lucide-react';

interface PhysicsJourneyMapProps {
  user: User;
}

const PhysicsJourneyMap: React.FC<PhysicsJourneyMapProps> = ({ user }) => {
  const navigate = useNavigate();
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // FIX: Property 'getCurriculumSupabase' does not exist on type 'DBService'.
        const data = await dbService.getCurriculum();
        setCurriculums(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  const activeTopic = curriculums.find(t => t.grade === user.grade && t.subject === 'Physics');

  const navigateToLesson = (lesson: Lesson) => {
    if (!activeTopic) return;
    navigate(`/lesson/${lesson.id}`);
  };

  const { progressPercent, nextLesson, activeUnitId } = useMemo(() => {
    if (!activeTopic || !activeTopic.units || activeTopic.units.length === 0) {
        return { progressPercent: 0, nextLesson: null, activeUnitId: null };
    }

    const allLessons = activeTopic.units.flatMap(u => u.lessons || []);
    if (allLessons.length === 0) {
        return { progressPercent: 0, nextLesson: null, activeUnitId: activeTopic.units[0]?.id || null };
    }

    const completedIds = user.progress.completedLessonIds || [];
    const completedCount = allLessons.filter(l => completedIds.includes(l.id)).length;
    
    const next = allLessons.find(l => !completedIds.includes(l.id));
    
    const currentUnit = activeTopic.units.find(u => (u.lessons || []).some(l => l.id === next?.id)) || activeTopic.units[activeTopic.units.length - 1];

    return {
      progressPercent: Math.round((completedCount / allLessons.length) * 100),
      nextLesson: next,
      activeUnitId: currentUnit?.id
    };
  }, [activeTopic, user.progress.completedLessonIds]);

  if (isLoading) {
    return (
        <div className="py-40 text-center animate-pulse">
            <RefreshCw className="w-12 h-12 text-[#fbbf24] animate-spin mx-auto mb-6" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">جاري رسم خريطتك التعليمية...</p>
        </div>
    );
  }

  if (!activeTopic || !activeTopic.units || activeTopic.units.length === 0) {
      return (
        <div className="max-w-3xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
          <header className="mb-16 relative">
            <div className="glass-panel p-8 rounded-[40px] border-[#00d2ff]/20 bg-gradient-to-r from-[#0A2540] to-black relative overflow-hidden">
               <div className="relative z-10 text-center md:text-right">
                 <p className="text-[10px] font-black text-[#00d2ff] uppercase tracking-[0.3em] mb-2">رحلتك في الفيزياء</p>
                 <h2 className="text-4xl font-black text-white">الصف <span className="text-[#fbbf24]">{user.grade}</span></h2>
              </div>
            </div>
          </header>
          <div className="py-32 text-center opacity-40 border-2 border-dashed border-white/5 rounded-[50px] bg-black/20">
             <span className="text-6xl mb-6 block">🚧</span>
             <p className="font-black text-sm uppercase tracking-[0.4em]">خريطة الرحلة لهذا الصف بانتظار إضافة المنهج</p>
          </div>
        </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      
      <header className="mb-16 relative">
        <div className="glass-panel p-8 rounded-[40px] border-[#00d2ff]/20 bg-gradient-to-r from-[#0A2540] to-black relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d2ff]/10 rounded-full blur-[80px]"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-right">
                 <p className="text-[10px] font-black text-[#00d2ff] uppercase tracking-[0.3em] mb-2">رحلتك في الفيزياء</p>
                 <h2 className="text-4xl font-black text-white">الصف <span className="text-[#fbbf24]">{user.grade}</span></h2>
              </div>
              
              <div className="flex gap-6">
                 <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-[#fbbf24]/30 flex items-center justify-center text-xl font-black relative">
                       {progressPercent}%
                       <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path className="text-[#fbbf24]" strokeDasharray={`${progressPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                       </svg>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest">إنجاز</p>
                 </div>
                 <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                       🏆
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{user.progress.points} XP</p>
                 </div>
              </div>
           </div>

           {nextLesson && (
             <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                <div>
                   <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">المهمة القادمة</p>
                   <p className="text-lg font-bold text-white">{nextLesson.title}</p>
                </div>
                <button 
                  onClick={() => navigateToLesson(nextLesson)}
                  className="bg-[#00d2ff] text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,210,255,0.4)]"
                >
                  استمرار ▶
                </button>
             </div>
           )}
        </div>
      </header>

      <div className="relative pl-8 md:pl-0 md:pr-0">
         <div className="absolute top-0 bottom-0 right-[19px] md:right-1/2 w-1 bg-gradient-to-b from-[#00d2ff] via-gray-700 to-transparent opacity-30 md:-translate-x-1/2 rounded-full"></div>

         <div className="space-y-16">
            {activeTopic.units.map((unit, unitIndex) => {
               const lessons = unit.lessons || [];
               const isCompleted = lessons.length > 0 && lessons.every(l => (user.progress.completedLessonIds || []).includes(l.id));
               const isActive = unit.id === activeUnitId;
               const isLocked = !isActive && !isCompleted && unitIndex > (activeTopic.units.findIndex(u => u.id === activeUnitId));

               return (
                 <div key={unit.id} className={`relative flex flex-col md:flex-row items-center gap-8 ${unitIndex % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                    
                    <div className={`
                       absolute right-0 md:right-1/2 md:translate-x-1/2 w-10 h-10 rounded-full border-4 z-10 flex items-center justify-center transition-all duration-500
                       ${isCompleted ? 'bg-[#00d2ff] border-[#00d2ff] shadow-[0_0_20px_#00d2ff]' : isActive ? 'bg-[#0a1118] border-[#fbbf24] scale-125 shadow-[0_0_30px_rgba(251,191,36,0.5)]' : 'bg-[#0a1118] border-gray-700 grayscale'}
                    `}>
                       {isCompleted ? <span className="text-black font-black">✓</span> : isActive ? <span className="w-2 h-2 bg-[#fbbf24] rounded-full animate-ping"></span> : <span className="text-gray-500 text-[8px]">🔒</span>}
                    </div>

                    <div className={`w-full md:w-[45%] transition-all duration-500 ${isLocked ? 'opacity-50 grayscale blur-[1px]' : 'opacity-100'}`}>
                       <div className={`
                          p-6 rounded-[30px] border relative overflow-hidden group
                          ${isActive ? 'bg-[#fbbf24]/5 border-[#fbbf24]/30' : 'bg-black/40 border-white/5 hover:border-white/20'}
                       `}>
                          <div className="flex justify-between items-start mb-4">
                             <h3 className={`text-xl font-black ${isActive ? 'text-[#fbbf24]' : 'text-white'}`}>{unit.title}</h3>
                             <span className="text-[10px] font-bold text-gray-600 bg-black/30 px-3 py-1 rounded-full uppercase tracking-widest">Unit {unitIndex + 1}</span>
                          </div>
                          <p className="text-xs text-gray-400 mb-6 line-clamp-2">{unit.description}</p>

                          <div className="space-y-3">
                             {lessons.map((lesson, lIdx) => {
                                const isLessonDone = (user.progress.completedLessonIds || []).includes(lesson.id);
                                const isLessonActive = nextLesson?.id === lesson.id;
                                
                                return (
                                   <div 
                                     key={lesson.id}
                                     onClick={() => !isLocked && navigateToLesson(lesson)}
                                     className={`
                                        flex items-center gap-4 p-3 rounded-xl border transition-all ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                                        ${isLessonDone ? 'bg-green-500/10 border-green-500/20' : isLessonActive ? 'bg-white/10 border-[#fbbf24]/50' : 'bg-black/20 border-white/5 hover:bg-white/5'}
                                     `}
                                   >
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${isLessonDone ? 'bg-green-500 text-black' : isLessonActive ? 'bg-[#fbbf24] text-black' : 'bg-white/5 text-gray-500'}`}>
                                         {isLessonDone ? '✓' : lIdx + 1}
                                      </div>
                                      <div className="flex-1">
                                         <p className={`text-sm font-bold ${isLessonDone ? 'text-green-400 line-through' : 'text-gray-300'}`}>{lesson.title}</p>
                                         <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{lesson.type}</p>
                                      </div>
                                      {isLessonActive && <div className="w-2 h-2 bg-[#fbbf24] rounded-full animate-ping"></div>}
                                   </div>
                                )
                             })}
                             {lessons.length === 0 && <p className="text-[10px] text-gray-600 italic">لا توجد دروس مضافة لهذه الوحدة.</p>}
                          </div>
                       </div>
                    </div>

                    <div className="hidden md:block md:w-[45%]"></div>
                 </div>
               );
            })}
         </div>
      </div>

      <div className="text-center mt-20 opacity-40">
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">نهاية المسار المتاح</p>
         <div className="h-12 w-1 bg-gradient-to-t from-transparent to-gray-700 mx-auto mt-4 rounded-full"></div>
      </div>
    </div>
  );
};

export default PhysicsJourneyMap;