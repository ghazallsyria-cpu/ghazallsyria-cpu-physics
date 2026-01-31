
import React, { useRef, useEffect, useState } from 'react';

const ARLab: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [arMode, setArMode] = useState<'Vectors' | 'Particles' | 'MagneticField'>('Vectors');

  useEffect(() => {
    if (isActive) { startCamera(); } else { stopCamera(); }
    return () => stopCamera();
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); renderAR(); };
      }
    } catch (e) {
      alert("AR Lab requires camera permissions.");
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const renderAR = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const loop = () => {
      if (!isActive) return;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2; const cy = canvas.height / 2;

      // Scanning HUD Line
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)'; ctx.lineWidth = 1;
      const scanY = (Date.now() / 10) % canvas.height;
      ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(canvas.width, scanY); ctx.stroke();

      if (arMode === 'Vectors') {
        ctx.strokeStyle = '#00d2ff'; ctx.lineWidth = 8; ctx.shadowBlur = 30; ctx.shadowColor = '#00d2ff';
        const len = 200 + Math.sin(Date.now() / 150) * 30;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + len, cy - len/2); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'black 32px Tajawal';
        ctx.fillText('NET FORCE: 125.4 N', cx + len + 20, cy - len/2);
      }

      if (arMode === 'Particles') {
        ctx.fillStyle = '#7000ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#7000ff';
        for (let i = 0; i < 40; i++) {
          const t = (Date.now() / 800 + i * 0.2) % 6;
          const px = (cx - 400) + t * 150; const py = cy + Math.sin(t * 4 + i) * 80;
          ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
        }
      }

      if (arMode === 'MagneticField') {
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)'; ctx.lineWidth = 3;
        for (let r = 80; r < 500; r += 60) {
          ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.45, Math.PI / 4 + Date.now()/1000, 0, Math.PI * 2); ctx.stroke();
        }
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal']">
      <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
           <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">واقع <span className="text-[#00d2ff] text-glow">الفيزياء</span> المعزز</h2>
           <p className="text-gray-500 text-lg md:text-xl font-medium">حول عالمك الواقعي إلى مختبر حي. ابحث عن الأجسام وسنقوم بإسقاط القوى الفيزيائية عليها.</p>
        </div>
        <button onClick={() => setIsActive(!isActive)} className={`px-10 md:px-14 py-5 md:py-6 rounded-[30px] md:rounded-[35px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] transition-all shadow-2xl text-xs ${isActive ? 'bg-red-500 text-white' : 'bg-[#00d2ff] text-black hover:scale-105'}`}>
          {isActive ? 'إيقاف النظام' : 'تنشيط AR NODE'}
        </button>
      </div>

      <div className="relative aspect-video bg-[#010304] rounded-[50px] md:rounded-[100px] overflow-hidden border-4 border-white/5 shadow-[0_50px_150px_rgba(0,0,0,0.8)] group">
         {!isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#010304]/90 backdrop-blur-3xl z-30 p-4">
               <div className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-[30px] md:rounded-[40px] flex items-center justify-center text-5xl md:text-6xl mb-6 md:mb-10 animate-float">👁️</div>
               <h3 className="text-2xl md:text-4xl font-black mb-4 text-center">بانتظار وصول البيانات البصرية</h3>
               <p className="text-gray-500 max-w-md text-center text-base md:text-lg italic">اضغط على الزر لتفعيل عدسة سقراط وكشف القوانين الخفية في غرفتك.</p>
            </div>
         )}
         
         <video ref={videoRef} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 transition-all duration-1000" playsInline muted />
         <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />

         {isActive && (
           <>
             <div className="absolute bottom-6 md:bottom-16 left-1/2 -translate-x-1/2 flex bg-black/60 backdrop-blur-2xl p-2 md:p-3 rounded-[30px] md:rounded-[40px] border border-white/10 z-40 shadow-2xl">
                {(['Vectors', 'Particles', 'MagneticField'] as const).map(mode => (
                  <button key={mode} onClick={() => setArMode(mode)} className={`px-6 py-3 md:px-10 md:py-5 rounded-[22px] md:rounded-[30px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${arMode === mode ? 'bg-[#00d2ff] text-black shadow-xl scale-105' : 'text-gray-500 hover:text-white'}`}>
                    {mode}
                  </button>
                ))}
             </div>
             <div className="absolute top-6 right-6 md:top-16 md:right-16 bg-black/60 px-4 py-2 md:px-8 md:py-4 rounded-[20px] md:rounded-[30px] border border-[#00d2ff]/30 backdrop-blur-md z-40">
                <span className="text-[10px] md:text-[12px] font-black text-[#00d2ff] uppercase tracking-[0.2em] md:tracking-[0.5em] animate-pulse">Scanning Reality Layer...</span>
             </div>
           </>
         )}
      </div>
    </div>
  );
};

export default ARLab;
