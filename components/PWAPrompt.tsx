
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface PWAPromptProps {
    user: User | null;
    logoUrl?: string;
}

const PWAPrompt: React.FC<PWAPromptProps> = ({ user, logoUrl }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Effect to capture the browser's install prompt event.
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[PWA] beforeinstallprompt event captured.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Cleanup listener when component unmounts.
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Effect to decide when to show the prompt based on user activity.
  useEffect(() => {
    if (showPrompt || !deferredPrompt || !user) {
      return;
    }

    const sessionCount = parseInt(localStorage.getItem('ssc_sessions') || '0');
    const lessonsCompleted = user.progress?.completedLessonIds?.length || 0;

    // Show prompt only if user has at least 2 sessions and completed 1 lesson.
    if (sessionCount >= 2 && lessonsCompleted >= 1) {
      setTimeout(() => setShowPrompt(true), 3000);
    }
  }, [user, deferredPrompt, showPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-md animate-slideUp">
      <div className="glass-panel p-10 rounded-[50px] border-[#fbbf24]/40 bg-black/90 backdrop-blur-3xl shadow-[0_40px_120px_rgba(0,0,0,0.8)] flex flex-col items-center text-center border-2">
        <div className="w-24 h-24 bg-white/5 rounded-[35px] border border-white/10 flex items-center justify-center p-4 mb-8 shadow-[0_0_50px_rgba(251,191,36,0.2)] animate-float overflow-hidden">
           {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" /> : <span className="text-6xl">⚛️</span>}
        </div>
        
        <h3 className="text-3xl font-black text-white mb-4 tracking-tighter italic">تثبيت تطبيق <span className="text-[#fbbf24]">المركز</span></h3>
        <p className="text-gray-400 text-base mb-10 leading-relaxed font-bold italic">
          بناءً على تقدمك الرائع، نوصيك بتثبيت التطبيق للوصول السريع لدروسك وتنبيهات المساعد الذكي الفورية.
        </p>
        
        <div className="flex flex-col gap-4 w-full">
           <button 
             onClick={handleInstall} 
             className="w-full bg-[#fbbf24] text-black py-6 rounded-[30px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all glow-gold"
           >
             أضف للشاشة الرئيسية
           </button>
           <button 
             onClick={() => setShowPrompt(false)} 
             className="w-full py-4 text-gray-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all active:opacity-50"
           >
             سأقوم بذلك لاحقاً
           </button>
        </div>
      </div>
    </div>
  );
};

export default PWAPrompt;
