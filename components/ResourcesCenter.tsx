
import React, { useState, useEffect } from 'react';
import { User, EducationalResource } from '../types';
import { dbService } from '../services/db';

const ResourcesCenter: React.FC<{ user: User | null }> = ({ user }) => {
  const [selectedGrade, setSelectedGrade] = useState<'10' | '11' | '12' | 'uni'>(user?.grade as any || '12');
  const [filterType, setFilterType] = useState<'all' | 'summary' | 'exam' | 'worksheet' | 'book'>('all');
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await dbService.getResources();
        setResources(data);
      } catch (e) {
        console.error("Failed to load resources");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = resources.filter(r => r.grade === selectedGrade && (filterType === 'all' || r.type === filterType));

  const getIcon = (type: string) => {
    switch(type) {
      case 'summary': return '📑';
      case 'exam': return '📝';
      case 'worksheet': return '📋';
      case 'book': return '📚';
      default: return '📄';
    }
  };

  const getColor = (type: string) => {
    switch(type) {
      case 'summary': return 'text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/5';
      case 'exam': return 'text-red-400 border-red-400/30 bg-red-400/5';
      case 'worksheet': return 'text-[#00d2ff] border-[#00d2ff]/30 bg-[#00d2ff]/5';
      case 'book': return 'text-purple-400 border-purple-400/30 bg-purple-400/5';
      default: return 'text-gray-400';
    }
  };

  const handleDownload = (resource: EducationalResource) => {
    // In a real app, this would use resource.url
    alert(`جاري تحميل الملف: ${resource.title}\nالحجم: ${resource.size}`);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <header className="mb-12 border-r-4 border-[#00d2ff] pr-8">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">المكتبة <span className="text-[#00d2ff]">الرقمية</span></h2>
        <p className="text-gray-500 text-xl font-medium">مذكرات، اختبارات سابقة، وملفات PDF المعتمدة للمنهج الكويتي.</p>
      </header>

      {/* Grade Tabs */}
      <div className="flex flex-wrap gap-4 mb-10">
        {[
          { id: '12', label: 'الصف 12' },
          { id: '11', label: 'الصف 11' },
          { id: '10', label: 'الصف 10' },
          { id: 'uni', label: 'الجامعة' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedGrade(tab.id as any)}
            className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${selectedGrade === tab.id ? 'bg-[#00d2ff] text-black shadow-lg shadow-[#00d2ff]/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex gap-4 mb-12 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'summary', label: 'مذكرات (Summaries)' },
          { id: 'exam', label: 'اختبارات (Exams)' },
          { id: 'worksheet', label: 'أوراق عمل (Sheets)' },
          { id: 'book', label: 'كتب (Books)' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterType(filter.id as any)}
            className={`px-6 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${filterType === filter.id ? 'border-white text-white bg-white/10' : 'border-white/5 text-gray-500 hover:border-white/20'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="py-20 text-center animate-pulse">
           <div className="w-16 h-16 border-4 border-[#00d2ff] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
           <p className="text-gray-500 text-xs font-black uppercase tracking-widest">جاري تحميل الملفات...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.length > 0 ? filtered.map(item => (
            <div key={item.id} className={`glass-panel p-8 rounded-[40px] border transition-all hover:-translate-y-2 group relative overflow-hidden ${getColor(item.type)}`}>
               <div className="absolute top-0 right-0 p-6 opacity-10 text-9xl pointer-events-none group-hover:scale-110 transition-transform">{getIcon(item.type)}</div>
               
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center text-2xl shadow-inner backdrop-blur-sm">
                        {getIcon(item.type)}
                     </div>
                     <span className="bg-black/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{item.year}</span>
                  </div>
                  
                  <h3 className="text-xl font-black mb-2 leading-relaxed text-white group-hover:text-[#00d2ff] transition-colors line-clamp-2 min-h-[3.5rem]">{item.title}</h3>
                  <div className="flex justify-between items-center mb-8 opacity-70">
                     <p className="text-xs font-bold">الفصل الدراسي {item.term === '1' ? 'الأول' : 'الثاني'}</p>
                     <span className="text-[10px] font-black bg-black/30 px-2 py-1 rounded">{item.size}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleDownload(item)}
                    className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                     <span>تحميل الملف</span>
                     <span className="text-lg">📥</span>
                  </button>
                  
                  <div className="mt-4 text-center">
                     <span className="text-[9px] text-gray-500 font-bold">{item.downloadCount} عملية تحميل</span>
                  </div>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center opacity-40 border-2 border-dashed border-white/10 rounded-[50px]">
               <span className="text-6xl mb-4 block">📂</span>
               <p className="font-bold text-lg">لا توجد ملفات في هذا التصنيف حالياً</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourcesCenter;