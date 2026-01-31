
import React, { useState, useEffect } from 'react';
import { generatePhysicsVisualization } from '../services/gemini';

const PhysicsVeo: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  // Check if an API key has already been selected by the user on component mount
  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Assume true if the environment doesn't support the check to prevent blocking
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume selection was successful per SDK guidelines to mitigate race condition
      setHasKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setVideoUrl(null);
    setStatusMsg('جاري تحليل الطلب الفيزيائي وتحضير البيئة ثلاثية الأبعاد...');
    
    try {
      // Simulate rendering stages for better UX
      setTimeout(() => setStatusMsg('بدء عملية الرندرة الكوانتومية عبر نموذج Veo...'), 5000);
      setTimeout(() => setStatusMsg('جاري إضافة الإضاءة العلمية وتدقيق القوانين الفيزيائية...'), 15000);
      
      const url = await generatePhysicsVisualization(prompt);
      setVideoUrl(url);
    } catch (error: any) {
      console.error(error);
      // If the API key is invalid or project not found, prompt the user to select a key again
      if (error?.message?.includes("Requested entity was not found.")) {
        setHasKey(false);
      }
      setStatusMsg('حدث خطأ في نظام الرندرة، يرجى المحاولة لاحقاً.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn">
      <div className="glass-panel p-12 rounded-[60px] border-[#00d2ff]/20 text-center">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl mb-6">🎬</div>
          <h2 className="text-4xl font-black mb-4">صانع التخيّل <span className="text-[#00d2ff]">الفيزيائي</span></h2>
          <p className="text-gray-500 max-w-lg">اكتب أي مفهوم فيزيائي وسيقوم الذكاء الاصطناعي بتوليد فيديو سينمائي يشرحه لك بالكامل.</p>
        </div>

        {hasKey === false ? (
          <div className="py-10 animate-slideUp">
             <h3 className="text-xl font-black mb-4">تنشيط محرك الفيديو</h3>
             <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
               يجب اختيار مفتاح API مفعل للدفع من مشروع GCP لاستخدام نماذج Veo المتطورة.
               <br />
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[#00d2ff] hover:underline font-bold mt-2 inline-block">
                 راجع تعليمات الفوترة والأسعار
               </a>
             </p>
             <button 
               onClick={handleOpenKey}
               className="bg-[#00d2ff] text-black px-12 py-5 rounded-[30px] font-black uppercase tracking-widest glow-teal hover:scale-105 transition-all shadow-xl"
             >
               اختيار مفتاح API
             </button>
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-12">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثال: كيف تعمل القوة المركزية عند دوران قمر صناعي حول الأرض؟"
                className="flex-1 bg-white/5 border border-white/10 rounded-[30px] px-10 py-5 text-white outline-none focus:border-[#00d2ff] transition-all"
                disabled={isGenerating}
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="bg-[#00d2ff] text-black px-12 rounded-[30px] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 glow-teal"
              >
                {isGenerating ? 'جاري التوليد...' : 'توليد الفيديو'}
              </button>
            </div>

            {isGenerating && (
              <div className="py-20 animate-pulse">
                <div className="w-16 h-16 border-4 border-[#00d2ff] border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
                <p className="text-[#00d2ff] font-black uppercase tracking-[0.2em]">{statusMsg}</p>
              </div>
            )}

            {videoUrl && (
              <div className="animate-slideUp">
                <div className="rounded-[40px] overflow-hidden border border-white/10 shadow-2xl aspect-video bg-black relative">
                   <video src={videoUrl} controls autoPlay className="w-full h-full object-cover" />
                </div>
                <div className="mt-8 flex justify-between items-center bg-white/5 p-6 rounded-[30px] border border-white/5">
                   <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">تخيل ذكي لـ</p>
                      <p className="font-bold text-[#00d2ff]">{prompt}</p>
                   </div>
                   <a href={videoUrl} download className="bg-white/10 px-8 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">تحميل الفيديو</a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PhysicsVeo;