
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/db';
import { ChevronLeft, User, Briefcase, UserCheck, Activity } from 'lucide-react';
import HeroSection from './HeroSection';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
      totalStudents: 1250, 
      maleStudents: 600, 
      femaleStudents: 650, 
      totalTeachers: 45, 
      total: 1295 
  });

  useEffect(() => {
    // Attempt to load real stats, fail silently if database is restricted
    try {
        const unsubscribe = dbService.subscribeToGlobalStats((updatedStats) => {
            // FIX: Add a more robust check to ensure the stats object is not empty and has the required properties.
            // This prevents a crash if Firestore returns an empty object, which would cause `updatedStats.totalStudents` to be undefined.
            if (updatedStats && typeof updatedStats.totalStudents === 'number') {
                setStats(updatedStats);
            }
        });
        return () => unsubscribe();
    } catch (e) {
        // Keep default stats
        console.warn("Could not subscribe to global stats, using default values.", e);
    }
  }, []);

  const StatCard = ({ value, label, icon: Icon, color }: any) => {
    return (
        <div className="relative p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[45px] shadow-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
            <div className="relative bg-[#050a10]/80 backdrop-blur-3xl rounded-[44px] p-8 h-full border border-white/5 flex flex-col items-center text-center">
                <div className={`relative w-16 h-16 mb-6 flex items-center justify-center rounded-[25px] ${color} shadow-2xl`}>
                    <Icon size={28} className="text-white relative z-10" />
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
                            {/* FIX: Ensure `value` is a number before calling toLocaleString to prevent runtime errors. */}
                            {(value || 0).toLocaleString()}
                        </span>
                        <span className="text-xl font-black text-blue-400 mb-2">+</span>
                    </div>
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mt-2">{label}</h4>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-[#000] overflow-x-hidden font-['Tajawal'] text-right" dir="rtl">
      
      {/* Background (Fixed & Guaranteed) */}
      <HeroSection />

      {/* Main Content Overlay - High Z-Index to ensure visibility */}
      <div className="relative z-50 w-full flex flex-col min-h-screen">
        
        {/* Full Screen Welcome Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            
            <div className="mb-10">
               <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[35px] border border-white/20 flex items-center justify-center shadow-[0_0_60px_rgba(56,189,248,0.3)]">
                  <span className="text-5xl">⚛️</span>
               </div>
            </div>

            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl leading-none">
                الفيزياء <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">الحديثة</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-gray-300 font-medium max-w-2xl leading-relaxed drop-shadow-md mb-12">
                منصة تعليمية متطورة تدمج الذكاء الاصطناعي مع المنهج الكويتي لتجربة تعليمية لا مثيل لها.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
                <button 
                    onClick={onStart} 
                    className="group relative px-12 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full font-black text-lg uppercase transition-all duration-300 hover:bg-[#38bdf8] hover:text-black hover:border-[#38bdf8] shadow-[0_0_40px_rgba(56,189,248,0.2)] hover:shadow-[0_0_80px_rgba(56,189,248,0.6)] active:scale-95 flex items-center gap-4 justify-center"
                >
                    دخول المنصة <ChevronLeft className="group-hover:-translate-x-2 transition-transform duration-300" size={24} />
                </button>
                <button 
                    onClick={() => navigate('/brochure')} 
                    className="group relative px-12 py-5 bg-transparent border border-white/20 text-white rounded-full font-black text-lg uppercase transition-all duration-300 hover:bg-white/10 active:scale-95 flex items-center gap-4 justify-center"
                >
                    عرض البروشور
                </button>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 text-white/50 hidden md:block animate-bounce">
               <span className="text-xs font-black uppercase tracking-[0.3em]">اكتشف الإحصائيات</span>
               <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent mx-auto mt-4"></div>
            </div>
        </div>

        {/* Stats Section */}
        <div className="w-full bg-gradient-to-b from-transparent via-[#000000]/90 to-[#000000] pb-32 pt-10">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 px-4">
                    <div className="text-right">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-6">
                           <Activity size={14} className="animate-pulse" /> Live Cloud Node Active
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white italic leading-none tracking-tighter">النمو <span className="text-blue-500">الرقمي</span></h2>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                    <StatCard value={stats.maleStudents} label="الطلاب (بنين)" icon={User} color="bg-blue-600" />
                    <StatCard value={stats.femaleStudents} label="الطالبات (بنات)" icon={User} color="bg-pink-600" />
                    <StatCard value={stats.totalTeachers} label="الطاقم الأكاديمي" icon={Briefcase} color="bg-amber-600" />
                    <StatCard value={stats.totalStudents} label="إجمالي المسجلين" icon={UserCheck} color="bg-emerald-600" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
