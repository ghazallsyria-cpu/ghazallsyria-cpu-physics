
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { LogOut, Loader2, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

interface ZoomMeetingProps {
  meetingNumber: string;
  passCode: string;
  userName: string;
  userRole: UserRole;
  directLink?: string;
  onLeave: () => void;
}

const ZoomMeeting: React.FC<ZoomMeetingProps> = ({ meetingNumber, passCode, userName, userRole, directLink, onLeave }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showBackup, setShowBackup] = useState(false);

  // تطهير رقم الاجتماع من أي مسافات قد يدخلها المعلم خطأً
  const sanitizedMeetingNumber = meetingNumber.replace(/\s+/g, '');
  const encodedName = encodeURIComponent(userName);
  
  // استخدام التنسيق الأحدث لعميل الويب من زوم لتجنب الخطأ 3001
  // الصيغة: /wc/{meetingId}/join هي الأكثر استقراراً حالياً
  const zoomWebUrl = `https://app.zoom.us/wc/${sanitizedMeetingNumber}/join?pwd=${passCode}&un=${encodedName}`;

  useEffect(() => {
    // إذا استمر التحميل أكثر من 10 ثوانٍ، اظهر خيار البديل المضمون للطالب
    const timer = setTimeout(() => {
      setShowBackup(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-[#010304] flex flex-col font-['Tajawal'] animate-fadeIn">
      {/* شريط التحكم العلوي - بسيط واحترافي */}
      <header className="bg-black/90 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <ShieldCheck size={20} />
            </div>
            <div className="text-right">
                <h3 className="text-white font-black text-sm uppercase tracking-tighter">بث الحصة المباشرة</h3>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">اتصال آمن • رقم الاجتماع: {sanitizedMeetingNumber}</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            {showBackup && directLink && (
                 <a 
                    href={directLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-amber-500 text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-amber-400 transition-all animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                 >
                    <ExternalLink size={14} /> حل المشكلة: الفتح عبر تطبيق Zoom
                 </a>
            )}
            <button 
                onClick={onLeave}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-2.5 rounded-xl flex items-center gap-3 transition-all shadow-xl font-black text-xs uppercase"
            >
                <LogOut size={16} /> مغادرة البث
            </button>
        </div>
      </header>

      {/* منطقة البث - Iframe */}
      <div className="flex-1 relative">
        {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-[#010304]">
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <Loader2 className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={32} />
                </div>
                <p className="font-black text-xs uppercase tracking-[0.3em] text-blue-500 animate-pulse text-center">جاري ربط إشارة البث المباشر...</p>
                
                {showBackup && (
                  <div className="mt-12 max-w-sm text-center animate-slideUp px-6">
                    <div className="flex items-center justify-center gap-2 text-amber-500 mb-4 font-bold text-sm">
                      <AlertCircle size={18} />
                      <p>هل الرابط لا يفتح؟</p>
                    </div>
                    <p className="text-gray-500 text-[11px] mb-6 leading-relaxed">بعض المتصفحات تمنع تشغيل الفيديو داخل الصفحات لأسباب أمنية. إذا ظهرت لك رسالة خطأ، يرجى استخدام الزر المباشر في الأعلى.</p>
                    {directLink && (
                       <a href={directLink} target="_blank" rel="noreferrer" className="inline-block bg-white/10 border border-white/20 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">
                          استخدام الرابط المباشر للمكالمة
                       </a>
                    )}
                  </div>
                )}
            </div>
        )}

        <iframe
          src={zoomWebUrl}
          allow="microphone; camera; borderless; autoplay; encrypted-media; fullscreen; display-capture"
          className="w-full h-full border-none"
          onLoad={() => setIsLoading(false)}
          title="Zoom Live Stream"
        />
      </div>

      {/* شريط معلومات سفلي */}
      <footer className="bg-black py-2 px-6 border-t border-white/5 flex justify-center">
         <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.5em]">SYRIAN SCIENCE CENTER • VIRTUAL STREAMING NODE</p>
      </footer>
    </div>
  );
};

export default ZoomMeeting;
