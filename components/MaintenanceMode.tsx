
import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import { MaintenanceSettings, AppBranding } from '../types';
import { Atom, Zap, Activity, Cpu, Disc } from 'lucide-react';
import { dbService } from '../services/db';

const MaintenanceMode: React.FC = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [branding, setBranding] = useState<AppBranding | null>(null);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, totalMs: 999999 });
  const [isFinalMinute, setIsFinalMinute] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  
  const lastSecondRef = useRef<number>(-1);

  useEffect(() => {
    const unsubscribe = dbService.subscribeToMaintenance((updated) => {
        setSettings(updated);
    });
    dbService.getAppBranding().then(setBranding);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!settings?.expectedReturnTime) return;

    const timer = setInterval(() => {
      const target = new Date(settings.expectedReturnTime).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        if (!isExploding) triggerSupernova();
      } else {
        const seconds = Math.floor((diff / 1000) % 60);
        
        if (diff < 60000 && !isFinalMinute) {
            setIsFinalMinute(true);
        }

        if (diff < 60000 && seconds !== lastSecondRef.current) {
            lastSecondRef.current = seconds;
            animateQuantumPulse(seconds);
        }

        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: seconds,
          totalMs: diff
        });
      }
    }, 100);

    return () => clearInterval(timer);
  }, [settings, isFinalMinute, isExploding]);

  const animateQuantumPulse = (sec: number) => {
    // أنيميشن تبديل الرقم بنعومة ووهج
    (anime as any)({
        targets: '.quantum-number',
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.8, 1],
        filter: ['blur(10px)', 'blur(0px)'],
        duration: 400,
        easing: 'easeOutExpo'
    });

    // نبضة حلقة الطاقة المحيطة
    (anime as any)({
        targets: '.energy-ring',
        scale: [1, 1.2],
        opacity: [0.5, 0],
        duration: 800,
        easing: 'easeOutCubic'
    });

    // اهتزاز خفيف يزيد مع اقتراب الصفر
    const intensity = Math.max(0.5, (60 - sec) / 10);
    (anime as any)({
        targets: '.quantum-core-container',
        translateX: () => (anime as any).random(-intensity, intensity),
        translateY: () => (anime as any).random(-intensity, intensity),
        duration: 50,
        direction: 'alternate'
    });
  };

  const triggerSupernova = () => {
    setIsExploding(true);
    
    const tl = (anime as any).timeline({
        easing: 'easeOutQuart'
    });

    // 1. مرحلة الانهيار (The Singularity)
    tl.add({
        targets: '.quantum-core-container, .status-hud, .branding-layer',
        scale: 0,
        rotate: 720,
        filter: 'blur(40px) brightness(5)',
        duration: 800,
        easing: 'easeInBack'
    })
    // 2. الانفجار العظيم (Shockwaves)
    .add({
        targets: '.supernova-blast',
        scale: [0, 30],
        opacity: [1, 0],
        duration: 1800,
        easing: 'easeOutExpo',
        offset: '-=200'
    })
    // 3. جزيئات السديم (Nebula Particles)
    .add({
        targets: '.stellar-particle',
        translateX: () => (anime as any).random(-window.innerWidth, window.innerWidth),
        translateY: () => (anime as any).random(-window.innerHeight, window.innerHeight),
        scale: () => [(anime as any).random(2, 6), 0],
        opacity: [1, 0],
        rotate: () => (anime as any).random(-360, 360),
        duration: 3000,
        delay: (anime as any).stagger(3),
        offset: '-=1500'
    })
    // 4. وميض التلاشي النهائي (Final Whiteout)
    .add({
        targets: '.white-curtain',
        opacity: [0, 1],
        duration: 800,
        easing: 'linear',
        complete: () => {
            window.location.reload();
        }
    });
  };

  if (!settings) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center font-['Tajawal'] text-white overflow-hidden transition-all duration-2000 ${isFinalMinute ? 'bg-[#000103]' : 'bg-[#000407]'}`} dir="rtl">
      
      {/* طبقة الجمالية الخلفية */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"></div>
         {isFinalMinute && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_80%)]"></div>}
      </div>

      <div className="relative z-10 w-full flex flex-col items-center gap-12 px-6">
        
        {/* Layer 1: Branding & Intro */}
        {!isFinalMinute && (
            <div className="branding-layer animate-fadeIn text-center space-y-8">
                <div className="w-40 h-40 bg-white/5 border border-white/10 rounded-[45px] flex items-center justify-center shadow-3xl mx-auto backdrop-blur-xl relative group">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-[inherit] animate-ping opacity-20"></div>
                    {branding?.logoUrl ? <img src={branding.logoUrl} className="w-2/3 h-2/3 object-contain" /> : <Atom size={80} className="text-blue-400 animate-spin-slow" />}
                </div>
                <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                    تحسين <span className="text-blue-500">النظام</span>
                </h1>
                <p className="text-gray-500 max-w-lg mx-auto text-lg leading-relaxed italic opacity-80">
                    "{settings.maintenanceMessage}"
                </p>

                {settings.showCountdown && (
                    <div className="flex gap-6 justify-center">
                        {[
                            { v: timeLeft.d, l: 'أيام' },
                            { v: timeLeft.h, l: 'ساعات' },
                            { v: timeLeft.m, l: 'دقائق' },
                            { v: timeLeft.s, l: 'ثواني' }
                        ].map((t, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-20 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center backdrop-blur-2xl shadow-xl">
                                    <span className="text-4xl font-black tabular-nums">{String(t.v).padStart(2, '0')}</span>
                                </div>
                                <span className="text-[9px] font-black text-blue-500/50 uppercase mt-3 tracking-widest">{t.l}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Layer 2: Final Minute Quantum Core */}
        {isFinalMinute && !isExploding && (
            <div className="quantum-core-container flex flex-col items-center relative">
                {/* HUD المعلوماتي العلوي */}
                <div className="status-hud mb-16 flex flex-col items-center animate-fadeIn">
                    <div className="flex items-center gap-3 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <Cpu size={14} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Energy Accumulation Active</span>
                    </div>
                    <h2 className="text-2xl font-black text-white/40 uppercase tracking-[0.5em]">Ignition Point</h2>
                </div>

                <div className="relative w-80 h-80 flex items-center justify-center">
                    {/* حلقات الطاقة التفاعلية */}
                    <div className="energy-ring absolute inset-0 border-2 border-blue-500 rounded-full opacity-0"></div>
                    <div className="absolute inset-[-20px] border border-white/5 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-[-40px] border border-blue-500/10 rounded-full animate-reverse-spin"></div>
                    
                    {/* النواة الرقمية */}
                    <div className="quantum-number text-[12rem] font-black leading-none tabular-nums text-white drop-shadow-[0_0_60px_rgba(255,255,255,0.4)] italic">
                        {timeLeft.s}
                    </div>

                    {/* جزيئات تدور حول النواة */}
                    {Array.from({length: 8}).map((_, i) => (
                        <div 
                            key={i} 
                            className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_10px_#3b82f6]"
                            style={{ 
                                animation: `orbit ${2 + i*0.5}s linear infinite`,
                                transformOrigin: 'center center',
                                offsetPath: `path('M 160,160 m -120,0 a 120,120 0 1,0 240,0 a 120,120 0 1,0 -240,0')`
                            }}
                        ></div>
                    ))}
                </div>

                <p className="mt-16 text-blue-400 font-bold tracking-[1em] uppercase animate-pulse">
                    Stabilizing <span className="text-white">Core</span>
                </p>
            </div>
        )}
      </div>

      {/* 💥 محرك السوبرنوفا الملحمي (Epic Supernova Engine) */}
      {isExploding && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
            {/* موجة الانفجار الرئيسية */}
            <div className="supernova-blast absolute w-20 h-20 bg-white rounded-full shadow-[0_0_200px_#fff] z-[10001]"></div>
            
            {/* حلقات الصدمة اللونية */}
            {Array.from({length: 12}).map((_, i) => (
                <div 
                    key={i} 
                    className="supernova-blast absolute w-10 h-10 border-[30px] rounded-full opacity-0"
                    style={{ 
                        borderColor: i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#3b82f6' : '#fbbf24',
                        filter: 'blur(5px)'
                    }}
                ></div>
            ))}
            
            {/* مطر النجوم (Stellar Particles) */}
            {Array.from({length: 400}).map((_, i) => (
                <div 
                    key={i} 
                    className="stellar-particle absolute w-1.5 h-1.5 rounded-sm"
                    style={{ 
                        background: i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#3b82f6' : '#fbbf24',
                        boxShadow: `0 0 20px ${i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#3b82f6' : '#fbbf24'}`
                    }}
                ></div>
            ))}
            
            {/* ستارة الضوء النهائي */}
            <div className="white-curtain absolute inset-0 bg-white opacity-0 z-[10005]"></div>
          </div>
      )}

      {/* شريط HUD سفلي بتصميم معملي */}
      <div className="absolute bottom-10 w-full px-12 flex justify-between items-center opacity-20 pointer-events-none">
         <div className="flex items-center gap-4">
             <Activity size={16} />
             <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Node Sync Status: 100%</p>
         </div>
         <p className="text-[10px] font-bold uppercase tracking-[0.4em]">SYRIAN SCIENCE CENTER • CORE V13</p>
      </div>

      <button onClick={() => { localStorage.setItem('ssc_maintenance_bypass_token', 'ssc_core_secure_v4_8822'); window.location.reload(); }} className="fixed bottom-4 left-4 text-[8px] font-black text-white/5 hover:text-red-500 transition-all z-[10006]">
        BYPASS_AUTH
      </button>

      <style>{`
        @keyframes orbit {
            from { offset-distance: 0%; }
            to { offset-distance: 100%; }
        }
        .animate-spin-slow {
            animation: spin 20s linear infinite;
        }
        .animate-reverse-spin {
            animation: spin 15s linear reverse infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .text-glow-cyan {
            text-shadow: 0 0 30px rgba(56, 189, 248, 0.6);
        }
      `}</style>
    </div>
  );
};

export default MaintenanceMode;
