
import React, { useState, useEffect } from 'react';
import { StudyGroup } from '../types';
import { dbService } from '../services/db';
import { Users, RefreshCw, PlusCircle, ArrowRight } from 'lucide-react';

const StudyGroups: React.FC = () => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
        setIsLoading(true);
        try {
            const data = await dbService.getStudyGroups();
            setGroups(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    loadGroups();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
           <h2 className="text-5xl font-black mb-4 tracking-tighter italic">خلايا <span className="text-[#00d2ff]">الدراسة</span> الجماعية</h2>
           <p className="text-gray-500 text-lg">انضم لزملائك في الكويت لحل مسائل الفيزياء وتجاوز التحديات الأسبوعية معاً.</p>
        </div>
        <button className="bg-[#00d2ff] text-black px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
            <PlusCircle size={20} /> إنشاء خلية جديدة
        </button>
      </div>

      {isLoading ? (
          <div className="py-40 text-center">
              <RefreshCw className="w-12 h-12 text-[#00d2ff] animate-spin mx-auto" />
          </div>
      ) : groups.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {groups.map((group) => (
              <div key={group.id} className="glass-panel p-10 rounded-[50px] border border-white/5 hover:border-[#00d2ff]/20 transition-all group bg-black/40">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <h3 className="text-2xl font-black text-white group-hover:text-[#00d2ff] transition-colors">{group.name}</h3>
                       <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">المستوى: صف {group.level}</span>
                    </div>
                    <div className="flex -space-x-4">
                       {[1,2,3].map(i => (
                         <div key={i} className="w-10 h-10 rounded-full border-2 border-[#010304] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] font-bold">U{i}</div>
                       ))}
                       {group.membersCount > 3 && <div className="w-10 h-10 rounded-full border-2 border-[#010304] bg-[#00d2ff] flex items-center justify-center text-[8px] font-black text-black">+{group.membersCount - 3}</div>}
                    </div>
                 </div>

                 <div className="bg-black/40 p-6 rounded-3xl border border-white/5 mb-8">
                    <p className="text-[9px] font-black text-[#fbbf24] uppercase tracking-widest mb-2">التحدي النشط الآن</p>
                    <h4 className="text-lg font-bold text-white mb-4">{group.activeChallenge}</h4>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="w-[65%] h-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                    </div>
                 </div>

                 <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">دخول الغرفة والبدء بالدراسة</button>
              </div>
            ))}
          </div>
      ) : (
          <div className="py-40 text-center glass-panel rounded-[60px] border-dashed border-white/10 opacity-30 max-w-2xl mx-auto">
              <Users size={64} className="mx-auto mb-6 text-gray-600" />
              <p className="font-black text-xl uppercase tracking-widest mb-2">لا توجد خلايا دراسة نشطة</p>
              <p className="text-sm">ابدأ بإنشاء أول خلية دراسة لصفك واجمع زملاءك.</p>
          </div>
      )}
    </div>
  );
};

export default StudyGroups;
