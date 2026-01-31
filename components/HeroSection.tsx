import React, { useEffect, useRef } from 'react';

const HeroSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // محاولة التشغيل التلقائي الصامت
      video.play().catch(err => console.log("Autoplay prevented", err));
    }
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
      {/* الفيديو كخلفية كاملة */}
      <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-cover opacity-60" 
          autoPlay 
          loop 
          muted 
          playsInline 
          webkit-playsinline="true"
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
      >
        <source src="https://spxlxypbosipfwbijbjk.supabase.co/storage/v1/object/public/assets/1769360535528_Ehab.mp4" type="video/mp4" />
      </video>

      {/* طبقة تدرج لوني لدمج الفيديو مع المحتوى السفلي وتحسين قراءة النصوص */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/40 to-[#000000]/30 z-10 pointer-events-none"></div>
      
      {/* تأثيرات إضافية اختيارية */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-10 pointer-events-none mix-blend-overlay"></div>
    </div>
  );
};

export default HeroSection;
