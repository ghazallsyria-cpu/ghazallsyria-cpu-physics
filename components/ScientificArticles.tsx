
import React, { useState, useEffect, useRef } from 'react';
import { Article } from '../types';
import { dbService } from '../services/db';
import { RefreshCw, Newspaper, ArrowRight, Share2, Bookmark } from 'lucide-react';

const MathRenderer: React.FC<{ content: string }> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);
    containerRef.current.innerHTML = '';
    parts.forEach(part => {
      if (!part) return;
      const span = document.createElement('span');
      if (part.startsWith('$$')) {
        span.className = 'block bg-black/20 p-4 my-4 rounded-xl font-mono text-center text-cyan-300';
        span.textContent = part.slice(2, -2).trim();
      } else if (part.startsWith('$')) {
        span.className = 'inline-block text-[#00d2ff] font-bold font-mono bg-white/5 px-2 rounded mx-1';
        span.textContent = part.slice(1, -1).trim();
      } else {
        let text = part.split('\n').map(line => {
          if (line.startsWith('### ')) {
            return `<h3 class="text-3xl font-black text-white mt-12 mb-6 tracking-tighter">${line.slice(4)}</h3>`;
          }
          return line;
        }).join('\n');

        text = text.replace(/\n\n/g, '<br/><br/>')
                   .replace(/\*\*(.*?)\*\*/g, '<b class="text-[#00d2ff]">$1</b>');
                   
        span.innerHTML = text;
      }
      containerRef.current?.appendChild(span);
    });
  }, [content]);

  return <div ref={containerRef} className="article-body-text leading-[1.8] text-xl text-gray-300" />;
};

const ScientificArticles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const data = await dbService.getArticles();
        setArticles(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!selectedArticle) return;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedArticle]);

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-[#010304] animate-fadeIn font-['Tajawal'] text-white relative text-right" dir="rtl">
        <div className="fixed top-0 left-0 h-1.5 bg-[#00d2ff] z-[100] transition-all duration-300 shadow-[0_0_15px_#00d2ff]" style={{ width: `${readingProgress}%` }} />

        <div className="relative h-[70vh] overflow-hidden">
           <img src={selectedArticle.imageUrl} className="w-full h-full object-cover scale-105" alt={selectedArticle.title} />
           <div className="absolute inset-0 bg-gradient-to-t from-[#010304] via-[#010304]/60 to-transparent"></div>
           
           <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8">
              <button 
                onClick={() => setSelectedArticle(null)}
                className="mb-10 flex items-center gap-4 text-white/50 hover:text-[#00d2ff] transition-all uppercase tracking-[0.4em] text-[10px] font-black group"
              >
                <ArrowRight className="group-hover:translate-x-2 transition-transform" /> العودة للمكتبة
              </button>
              
              <div className="flex gap-4 mb-8">
                 <span className="bg-[#00d2ff] text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">{selectedArticle.category}</span>
                 <span className="bg-white/10 backdrop-blur-md text-white/80 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">⏱ {selectedArticle.readTime}</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6 animate-slideUp">{selectedArticle.title}</h1>
              <p className="text-xl text-gray-400 max-w-2xl leading-relaxed italic border-r-4 border-[#00d2ff] pr-6">{selectedArticle.summary}</p>
           </div>
        </div>

        <div className="max-w-4xl mx-auto py-24 px-8">
           <div className="glass-panel p-16 md:p-24 rounded-[80px] border-white/5 bg-white/[0.01] relative">
              <div className="absolute top-20 left-[-60px] text-[120px] font-black text-white/[0.02] -rotate-90 pointer-events-none select-none">فيزياء</div>

              <MathRenderer content={selectedArticle.content} />
              
              <div className="mt-32 pt-16 border-t border-white/5">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">تصنيف المقال</p>
                       <p className="text-xl font-bold text-[#00d2ff]">{selectedArticle.category}</p>
                    </div>
                    <div className="flex gap-6">
                       <button className="bg-white/5 hover:bg-white/10 p-6 rounded-[30px] transition-all border border-white/5 group">
                          <Bookmark size={24} className="group-hover:scale-125 transition-transform" />
                       </button>
                       <button className="bg-white/5 hover:bg-white/10 p-6 rounded-[30px] transition-all border border-white/5 group">
                          <Share2 size={24} className="group-hover:scale-125 transition-transform" />
                       </button>
                       <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="bg-[#00d2ff] text-black px-10 py-5 rounded-[30px] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#00d2ff]/20"
                       >
                         للأعلى ↑
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-16 px-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <header className="mb-24">
        <div className="inline-block px-6 py-2 bg-[#00d2ff]/10 border border-[#00d2ff]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00d2ff] mb-8">المقالات الإثرائية</div>
        <h2 className="text-7xl font-black mb-6 tracking-tighter italic">المكتبة <span className="text-[#00d2ff] text-glow">العلمية</span></h2>
        <p className="text-gray-500 max-w-3xl text-2xl leading-relaxed">اكتشف آخر ما توصل إليه العلم في الفيزياء من خلال مقالات فريقنا الأكاديمي.</p>
      </header>

      {isLoading ? (
          <div className="py-40 text-center animate-pulse">
              <RefreshCw className="w-12 h-12 text-[#00d2ff] animate-spin mx-auto mb-6" />
          </div>
      ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {articles.map((art) => (
              <div 
                key={art.id} 
                onClick={() => { setSelectedArticle(art); window.scrollTo(0, 0); }}
                className="glass-card group rounded-[80px] overflow-hidden border-white/5 hover:border-[#00d2ff]/30 transition-all duration-700 flex flex-col cursor-pointer hover:translate-y-[-15px]"
              >
                 <div className="h-80 relative overflow-hidden">
                    <img src={art.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100" alt={art.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#010304] to-transparent opacity-90"></div>
                    <div className="absolute bottom-10 right-10">
                       <span className="bg-[#00d2ff] text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">{art.category}</span>
                    </div>
                 </div>
                 <div className="p-16 flex-1 flex flex-col bg-gradient-to-b from-[#0a1118] to-[#010304]">
                    <h3 className="text-4xl font-black text-white group-hover:text-[#00d2ff] transition-colors duration-500 mb-6 leading-tight">{art.title}</h3>
                    <p className="text-gray-400 text-lg leading-relaxed mb-12 flex-1 opacity-70 group-hover:opacity-100 transition-opacity">{art.summary}</p>
                    <div className="flex justify-between items-center pt-10 border-t border-white/5">
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{art.readTime} قراءة</span>
                       <span className="text-[#00d2ff] font-black text-[12px] uppercase tracking-widest group-hover:translate-x-[-10px] transition-transform">اقرأ المقال ←</span>
                    </div>
                 </div>
              </div>
            ))}
          </div>
      ) : (
          <div className="py-40 text-center glass-panel rounded-[80px] border-dashed border-white/10 opacity-30 max-w-2xl mx-auto">
              <Newspaper size={64} className="mx-auto mb-6 text-gray-600" />
              <p className="font-black text-xl uppercase tracking-widest mb-2">لا توجد مقالات منشورة حالياً</p>
              <p className="text-sm">هذا القسم ينتظر إبداع المعلمين لإضافة المحتوى الإثرائي.</p>
          </div>
      )}
    </div>
  );
};

export default ScientificArticles;
