
import React, { useState, useEffect } from 'react';
import { PhysicsExperiment, User } from '../types';
import { dbService } from '../services/db';
import { FlaskConical, Atom, RefreshCw, ChevronLeft, Globe, Zap, AlertCircle } from 'lucide-react';

const LabHub: React.FC<{ user: User }> = ({ user }) => {
  const [experiments, setExperiments] = useState<PhysicsExperiment[]>([]);
  const [activeExp, setActiveExp] = useState<PhysicsExperiment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExps();
  }, [user.grade]);

  const fetchExps = async () => {
    setIsLoading(true);
    try {
        const data = await dbService.getExperiments(user.grade);
        setExperiments(data);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  // معالجة عرض المحتوى المخصص بأمان
  if (activeExp) {
    return (
        <div className="fixed inset-0 z-[2000] bg-[#010304] flex flex-col animate-fadeIn font-['Tajawal']" dir="rtl">
            <header className="bg-black/80 backdrop-blur-xl border-b border-white/10 px-8 py-5 flex justify-between items-center z-50">
                <div className="flex items-center gap-6">
                    <button onClick={() => setActiveExp(null)} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-[#00d2ff] transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h3 className="text-white font-black text-xl italic tracking-tighter">{activeExp.title}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">بيئة محاكاة معزولة • مختبر المركز السوري للعلوم</p>
                    </div>
                </div>
                <div className="hidden md:flex gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 px-5 py-2 rounded-xl flex items-center gap-2">
                        <Globe size={14} className="text-blue-400" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">التجربة نشطة</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 relative bg-black">
                {/* رندر كود HTML المخصص داخل Iframe لتجنب تعارض الـ CSS والأمان */}
                <iframe
                    title={activeExp.title}
                    srcDoc={`
                        <!DOCTYPE html>
                        <html dir="rtl">
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                body { margin: 0; padding: 0; background: #000; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
                                iframe { border: none; width: 100%; height: 100%; }
                            </style>
                        </head>
                        <body>
                            ${activeExp.customHtml}
                        </body>
                        </html>
                    `}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                />
            </div>
            
            <footer className="bg-black py-3 px-8 border-t border-white/5 flex justify-center text-[10px] font-bold text-gray-700 uppercase tracking-[0.5em]">
                Secure Sandboxed Environment v2.0
            </footer>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-20 text-center relative">
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-64 h-64 bg-[#00d2ff]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic uppercase">المختبر <span className="text-[#00d2ff] text-glow-cyan">التفاعلي</span></h2>
        <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
            محاكاة القوانين الفيزيائية في بيئة افتراضية متطورة. اختر تجربتك الدراسية وانطلق.
        </p>
      </header>
      
      {isLoading ? (
          <div className="py-40 text-center animate-pulse"><RefreshCw className="w-16 h-16 text-[#00d2ff] animate-spin mx-auto mb-6 shadow-[0_0_20px_#00d2ff]" /></div>
      ) : (
          <>
            <div className="mb-12 flex justify-between items-center">
                <h3 className="text-2xl font-black border-r-4 border-[#00d2ff] pr-4 flex items-center gap-3">
                    <FlaskConical className="text-[#00d2ff]" /> مختبرات الصف {user.grade}
                </h3>
                <button onClick={fetchExps} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10"><RefreshCw size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {experiments.map(exp => (
                    <div 
                        key={exp.id} 
                        onClick={() => setActiveExp(exp)} 
                        className="glass-panel group p-8 rounded-[50px] cursor-pointer bg-black/40 border border-white/5 hover:border-[#00d2ff]/40 transition-all duration-700 relative overflow-hidden flex flex-col h-full hover:-translate-y-2 shadow-2xl"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-[#00d2ff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="h-48 rounded-[35px] overflow-hidden mb-8 border border-white/10 bg-white/5 relative group-hover:shadow-[0_0_50px_rgba(0,210,255,0.15)] transition-all">
                            {exp.thumbnail ? (
                                <img src={exp.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" alt={exp.title} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-6xl opacity-20 group-hover:opacity-100 group-hover:text-[#00d2ff] transition-all">⚛️</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                            {exp.isFutureLab && (
                                <span className="absolute top-4 left-4 bg-purple-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">Advanced Lab</span>
                            )}
                        </div>

                        <h4 className="text-2xl font-black text-white group-hover:text-[#00d2ff] transition-colors mb-4 leading-tight">{exp.title}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed mb-10 flex-1 italic group-hover:text-gray-300">"{exp.description}"</p>
                        
                        <button className="w-full py-5 bg-[#00d2ff] text-black rounded-[25px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                            <Zap size={14} fill="currentColor" /> دخول المختبر وتنشيط المحاكاة
                        </button>
                    </div>
                ))}
            </div>
            
            {experiments.length === 0 && (
                <div className="py-40 text-center glass-panel rounded-[60px] border-2 border-dashed border-white/5 opacity-30 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8"><AlertCircle size={40}/></div>
                    <p className="font-black text-xl uppercase tracking-widest mb-2">لا توجد تجارب مضافة لهذا الصف حالياً</p>
                    <p className="text-sm">سيقوم المدير بإضافة تجارب المحاكاة قريباً.</p>
                </div>
            )}
          </>
      )}
    </div>
  );
};

export default LabHub;
