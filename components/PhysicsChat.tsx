import React, { useState, useRef, useEffect } from 'react';
import { getAdvancedPhysicsInsight } from '../services/gemini';
import { contentFilter } from '../services/contentFilter'; // استيراد نظام الرقابة
import { Message } from '../types';
import katex from 'katex';
import { ShieldAlert } from 'lucide-react';

interface AiTutorProps {
  grade: string;
  subject: 'Physics' | 'Chemistry';
}

const AiTutor: React.FC<AiTutorProps> = ({ grade, subject }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `مرحباً بك! أنا مساعدك الذكي لمادة ${subject === 'Physics' ? 'الفيزياء' : 'الكيمياء'}. اسألني عن أي قانون، تعريف، أو مسألة تواجه صعوبة فيها، وسأقوم بتبسيطها لك.`, 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(true);
  const [filterError, setFilterError] = useState(false);
  
  const [themeColor, setThemeColor] = useState('#e2e8f0');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const colorOptions = [
    { name: 'Gray', value: '#e2e8f0' },
    { name: 'Sky', value: '#00d2ff' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Green', value: '#22c55e' }
  ];

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // فحص مدخلات الطالب
    const checkInput = contentFilter.filter(input);
    if (!checkInput.isClean) {
        setFilterError(true);
        setTimeout(() => setFilterError(false), 4000);
        return;
    }

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const { text } = await getAdvancedPhysicsInsight(userMsg, grade, subject);
      
      // فحص مخرجات الذكاء الاصطناعي (زيادة أمان)
      const checkOutput = contentFilter.filter(text);
      const safeText = checkOutput.isClean ? text : checkOutput.cleanedText;

      setMessages(prev => [...prev, { role: 'assistant', content: safeText, timestamp: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const processText = (content: string) => {
    const htmlWithMath = content.replace(/\n/g, '<br />').replace(/\$(.*?)\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { throwOnError: false });
      } catch (e) {
        return match;
      }
    });
    return <div dangerouslySetInnerHTML={{ __html: htmlWithMath }} />;
  };

  return (
    <div className="h-full min-h-[600px] flex flex-col glass-panel rounded-[40px] md:rounded-[60px] border-white/5 overflow-hidden shadow-2xl relative font-['Tajawal']">
      <div className="p-6 sm:p-8 bg-white/[0.03] border-b border-white/5 flex justify-between items-center backdrop-blur-3xl">
        <div className="flex items-center gap-4 sm:gap-6">
          <div 
            role="button"
            tabIndex={0}
            aria-label="AI Tutor Icon" 
            style={{ backgroundColor: themeColor }} 
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl text-black flex items-center justify-center text-3xl sm:text-4xl shadow-lg animate-float transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-4 focus:ring-offset-[#0A2540]"
          >
            🤖
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black">المساعد <span style={{ color: themeColor }} className="transition-colors duration-500">الذكي</span></h3>
            <p className="text-[10px] text-[#00d2ff] font-black uppercase tracking-widest">مساعدك في {subject === 'Physics' ? 'الفيزياء' : 'الكيمياء'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-white/10">
                {colorOptions.map(color => (
                    <button 
                        key={color.value}
                        onClick={() => setThemeColor(color.value)}
                        className={`w-5 h-5 rounded-full transition-all duration-300 ${themeColor === color.value ? 'ring-2 ring-offset-2 ring-offset-gray-800' : 'scale-90 opacity-60 hover:opacity-100 hover:scale-100'}`}
                        style={{ backgroundColor: color.value, borderColor: color.value }}
                        title={`Theme: ${color.name}`}
                    />
                ))}
            </div>
            <button onClick={() => setShowThinking(!showThinking)} className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${showThinking ? 'bg-[#00d2ff]/20 border-[#00d2ff] text-[#00d2ff]' : 'bg-white/5 border-white/10 text-gray-500'}`}>
              {showThinking ? 'إخفاء التفكير' : 'عرض التفكير'}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-12 no-scrollbar bg-gradient-to-b from-black/20 to-transparent">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}>
            {m.thinking && showThinking && (
              <div className="max-w-[85%] mb-6 p-6 sm:p-8 bg-blue-500/5 border border-blue-500/10 rounded-[30px] sm:rounded-[40px] text-[11px] text-blue-300 font-mono italic animate-slideUp text-right">
                <div className="flex items-center gap-3 mb-4">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></span>
                    <p className="font-black uppercase tracking-widest">طريقة التفكير:</p>
                </div>
                {m.thinking}
              </div>
            )}
            <div className={`max-w-[85%] p-6 sm:p-10 rounded-[35px] sm:rounded-[45px] shadow-2xl relative transition-all ${
              m.role === 'user' 
                ? 'bg-gradient-to-tr from-blue-700 to-blue-600 text-white font-bold rounded-tl-none border-l-4 border-white/20' 
                : 'bg-white/5 text-gray-200 border border-white/10 rounded-tr-none text-right leading-relaxed text-base sm:text-xl'
            }`}>
              <div>{processText(m.content)}</div>
            </div>
            <span className="text-[9px] text-gray-600 font-black mt-4 uppercase tracking-widest">
              {m.role === 'user' ? 'الطالب' : 'المساعد الذكي'} • {m.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-end gap-4 animate-pulse">
            <div className="w-48 h-2 bg-white/5 rounded-full"></div>
            <div className="w-80 h-32 bg-white/5 rounded-[45px]"></div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 bg-black/60 border-t border-white/10 flex flex-col gap-4 backdrop-blur-2xl relative">
        {filterError && (
          <div className="absolute top-[-80px] left-6 right-6 bg-red-600 text-white p-4 rounded-2xl flex items-center gap-4 shadow-2xl border-2 border-white/20 animate-slideUp">
             <ShieldAlert size={24} />
             <p className="text-xs font-black">عذراً، سؤالك يحتوي على كلمات غير لائقة. يرجى استخدام لغة علمية محترمة.</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <input 
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            onFocus={() => { if(inputRef.current) inputRef.current.style.borderColor = themeColor; }}
            onBlur={() => { if(inputRef.current) inputRef.current.style.borderColor = ''; }}
            placeholder="اكتب سؤالك الفيزيائي هنا..."
            className={`flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 sm:px-10 sm:py-6 text-white outline-none transition-all font-bold text-base sm:text-lg ${filterError ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}`}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            style={{ backgroundColor: themeColor }}
            className="w-full sm:w-auto text-black px-8 sm:px-16 py-4 sm:py-auto rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
          >
            {isLoading ? 'جاري التحليل...' : 'إرسال'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
