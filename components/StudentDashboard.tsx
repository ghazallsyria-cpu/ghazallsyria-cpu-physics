import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, HomePageContent } from '../types';
import { dbService } from '../services/db';
import { ArrowRight, Map, Trophy, BookOpen, Star, Zap, Crown, Smartphone, UserCircle, Save, X, Megaphone, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState({ percent: 0, lessons: 0, points: 0 });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicContent, setDynamicContent] = useState<HomePageContent[]>([]);
  const [activePopup, setActivePopup] = useState<HomePageContent | null>(null);
  
  const [profileForm, setProfileForm] = useState({
      phone: user.phone || '',
      gender: user.gender || 'male'
  });

  const isProfileIncomplete = !user.phone || !user.gender;

  useEffect(() => {
    loadDynamicContent();
    const completed = (user.progress.completedLessonIds || []).length;
    setProgressData({ 
        lessons: completed, 
        percent: Math.min(completed * 5, 100), 
        points: user.progress.points || 0 
    });
  }, [user]);

  const loadDynamicContent = async () => {
    try {
        const content = await dbService.getHomePageContent();
        setDynamicContent(content);
        
        const popup = content.find(c => c.placement === 'MODAL_POPUP');
        if (popup) {
            setTimeout(() => {
                setActivePopup(popup);
            }, 1500);
        }
    } catch (e) {
        console.error("Failed to load content", e);
    }
  };

  const handleUpdateProfile = async () => {
      if (!profileForm.phone) {
          alert("يرجى إدخال رقم الموبايل للتواصل.");
          return;
      }
      setIsSaving(true);
      try {
          await dbService.saveUser({
              ...user,
              phone: profileForm.phone,
              gender: profileForm.gender
          });
          setShowProfileModal(false);
      } catch (e) {
          alert("حدث خطأ أثناء حفظ البيانات.");
      } finally {
          setIsSaving(false);
      }
  };

  const banners = useMemo(() => dynamicContent.filter(c => c.placement === 'TOP_BANNER'), [dynamicContent]);
  const gridAds = useMemo(() => dynamicContent.filter(c => c.placement === 'GRID_CARD'), [dynamicContent]);

  return (
    <div className="space-y-10 font-['Tajawal'] pb-24 text-right relative animate-fadeIn" dir="rtl">
      
      {/* 1. TOP BANNERS */}
      {banners.map((banner, idx) => (
          <div key={banner.id} className="relative overflow-hidden rounded-[50px] border-2 border-amber-400/20 bg-gradient-to-r from-amber-400/10 to-indigo-900/40 p-10 flex flex-col md:flex-row items-center gap-10 shadow-2xl animate-slideUp" style={{animationDelay: `${idx * 0.1}s`}}>
              {banner.imageUrl && <div className="w-full md:w-64 h-40 rounded-3xl overflow-hidden shrink-0 shadow-2xl border border-white/10"><img src={banner.imageUrl} className="w-full h-full object-cover" alt="ad" /></div>}
              <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                      <Megaphone className="text-amber-400 animate-pulse" size={24} />
                      <span className="bg-amber-400 text-black px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{banner.type}</span>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4 leading-tight">{banner.title}</h3>
                  <p className="text-gray-300 text-lg mb-8 leading-relaxed italic">"{banner.content}"</p>
                  {banner.ctaText && (
                      <button onClick={() => banner.ctaLink && navigate(`/${banner.ctaLink}`)} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                          {banner.ctaText}
                      </button>
                  )}
              </div>
          </div>
      ))}

      <div className="flex flex-col md:flex-row justify-between items-start gap-6 overflow-hidden animate-slideUp">
         <div className="welcome-text">
            <div className="flex items-center gap-4 mb-2">
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                مرحباً بك، <span className="text-amber-400">{user.name.split(' ')[0]}</span> 👋
                </h2>
                {user.subscription === 'premium' && (
                    <div className="bg-amber-400 text-black px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.3)] border border-black/10">
                        <Crown size={16} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">عضو متميز / Premium</span>
                    </div>
                )}
            </div>
            <p className="text-slate-400 text-lg font-medium">جاهز لاكتشاف أسرار الكون اليوم؟</p>
         </div>
         <div className="flex gap-4">
             <div className="bg-amber-400/10 border border-amber-400/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                <Star className="text-amber-400 fill-amber-400" size={20} />
                <span className="text-xl font-black text-white tabular-nums">{progressData.points} <span className="text-xs text-amber-400/60 mr-1">نقطة</span></span>
             </div>
         </div>
      </div>

      {/* New Template Promo Card */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/30 p-8 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-slideUp">
          <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-purple-500 rounded-3xl flex items-center justify-center text-white shadow-lg"><Sparkles size={32} /></div>
              <div>
                  <h4 className="text-2xl font-black text-white">تجربة الدرس التفاعلي الشامل</h4>
                  <p className="text-gray-400 text-sm mt-1">اكتشف نموذج الجيل القادم للدروس مع المحاكاة الحية والرسم البياني.</p>
              </div>
          </div>
          <button onClick={() => navigate('/template-demo')} className="bg-white text-purple-600 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl whitespace-nowrap">عرض النموذج الآن</button>
      </div>

      {isProfileIncomplete && (
          <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-2 border-blue-500/30 p-8 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
              <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center text-white shadow-lg"><Smartphone size={32} /></div>
                  <div>
                      <h4 className="text-xl font-black text-white">أكمل بيانات حسابك لتفعيل واتساب</h4>
                      <p className="text-gray-400 text-sm mt-1">يجب تسجيل رقم الموبايل والجنس لضمان وصول إشعارات الدفع والتنبيهات الهامة.</p>
                  </div>
              </div>
              <button onClick={() => setShowProfileModal(true)} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl whitespace-nowrap">تحديث البيانات الآن</button>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slideUp">
         <div onClick={() => navigate('/curriculum')} className="lg:col-span-8 bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/20 p-10 rounded-[50px] cursor-pointer hover:border-blue-400/40 transition-all group relative overflow-hidden">
           <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all"></div>
           <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-8 border border-blue-500/30"><BookOpen size={32} /></div>
              <h3 className="text-4xl font-black text-white mb-4">المناهج الدراسية</h3>
              <p className="text-lg text-slate-400 font-medium max-w-xl">استكمل رحلتك التعليمية من حيث توقفت. جميع الدروس والوحدات منظمة وفق منهج الوزارة.</p>
              <div className="mt-12 flex items-center gap-4 text-blue-400 font-black text-sm uppercase tracking-widest group-hover:gap-6 transition-all"><span>بدء الدراسة الآن</span><ArrowRight /></div>
           </div>
         </div>
         
         <div className="lg:col-span-4 space-y-8">
           <div onClick={() => navigate('/journey-map')} className="bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border border-amber-500/20 p-8 rounded-[40px] cursor-pointer hover:border-amber-400/40 transition-all group relative overflow-hidden h-full flex flex-col justify-between">
              <div>
                <Map className="text-amber-400 mb-6" size={40} />
                <h3 className="text-2xl font-black text-white mb-2">خريطة الطريق</h3>
                <p className="text-sm text-slate-400 font-medium">تتبع مسارك الأكاديمي بصرياً.</p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-amber-400 font-bold text-xs uppercase group-hover:gap-4 transition-all"><span>عرض الخريطة</span><ArrowRight size={16} /></div>
           </div>
         </div>

         {/* 2. GRID CARDS */}
         {gridAds.map(ad => (
             <div key={ad.id} onClick={() => ad.ctaLink && navigate(`/${ad.ctaLink}`)} className="lg:col-span-4 glass-panel p-8 rounded-[40px] border-amber-400/20 bg-amber-400/5 cursor-pointer hover:-translate-y-2 transition-all relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
                 <div className="flex items-center gap-4 mb-6">
                     <div className="w-10 h-10 bg-amber-400 text-black rounded-xl flex items-center justify-center"><Zap size={20} fill="currentColor"/></div>
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">تنبيه المدير</span>
                 </div>
                 <h4 className="text-xl font-black text-white mb-2 group-hover:text-amber-400 transition-colors">{ad.title}</h4>
                 <p className="text-sm text-gray-400 leading-relaxed italic line-clamp-3 mb-6">"{ad.content}"</p>
                 <div className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">المزيد <ArrowRight size={14}/></div>
             </div>
         ))}

         <div className="lg:col-span-4 glass-panel p-8 rounded-[40px] border-white/5">
            <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2"><Zap size={14} className="text-amber-400" /> مستوى الإنجاز</h4>
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-4xl font-black text-white tabular-nums">{progressData.percent}%</p>
                        <p className="text-xs text-gray-500 font-bold mt-1">من المنهج المقرر</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-blue-400 tabular-nums">{progressData.lessons}</p>
                        <p className="text-[10px] text-gray-600 font-black uppercase">درس مكتمل</p>
                    </div>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5"><div className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full" style={{width: `${progressData.percent}%`}}></div></div>
            </div>
         </div>

         <div className="lg:col-span-4 glass-panel p-8 rounded-[40px] border-white/5">
            <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2"><Trophy size={14} className="text-amber-400" /> آخر الإنجازات</h4>
            <div className="flex items-center gap-6 p-4 bg-white/5 rounded-3xl border border-white/5">
                <div className="w-14 h-14 bg-amber-400/10 rounded-2xl flex items-center justify-center text-2xl border border-amber-400/20">🏆</div>
                <div><p className="font-bold text-white">مستكشف الجاذبية</p><p className="text-[10px] text-gray-500">أنهيت الوحدة الأولى بنجاح</p></div>
            </div>
         </div>
      </div>

      {/* 3. MODAL POPUP */}
      {activePopup && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
              <div id="modal-popup" className="bg-[#0a1118] border-2 border-amber-400/30 w-full max-w-lg rounded-[60px] p-12 relative shadow-[0_0_100px_rgba(251,191,36,0.15)] text-center animate-slideUp">
                  <button onClick={() => setActivePopup(null)} className="absolute top-8 left-8 text-gray-500 hover:text-white p-2 bg-white/5 rounded-full transition-all"><X size={24}/></button>
                  <div className="w-24 h-24 bg-amber-400/10 rounded-[35px] border-2 border-amber-400/20 flex items-center justify-center mx-auto mb-10 text-amber-400 animate-float shadow-2xl">
                      <AlertTriangle size={48} />
                  </div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter mb-4">{activePopup.title}</h2>
                  <p className="text-gray-400 text-xl mb-12 leading-relaxed font-medium italic">"{activePopup.content}"</p>
                  {activePopup.ctaText && (
                      <button 
                        onClick={() => {
                            if (activePopup.ctaLink) navigate(`/${activePopup.ctaLink}`);
                            setActivePopup(null);
                        }} 
                        className="w-full py-6 bg-amber-400 text-black rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                      >
                          {activePopup.ctaText}
                      </button>
                  )}
                  <p className="mt-8 text-gray-600 text-[10px] font-black uppercase tracking-widest">إشعار رسمي من الإدارة</p>
              </div>
          </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
          <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
              <div className="bg-[#0a1118] border border-white/10 w-full max-w-lg rounded-[60px] p-12 relative shadow-3xl animate-slideUp">
                  <button onClick={() => setShowProfileModal(false)} className="absolute top-8 left-8 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full"><X size={24}/></button>
                  <div className="text-center mb-10"><div className="w-20 h-20 bg-blue-500 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-2xl"><UserCircle size={48} className="text-white"/></div><h3 className="text-3xl font-black text-white italic">تحديث الملف الشخصي</h3><p className="text-gray-500 text-sm mt-3">بياناتك ضرورية لربط الدفعات المباشرة وتنبيهات المعلم.</p></div>
                  <div className="space-y-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mr-4 block">رقم الموبايل</label><div className="relative"><Smartphone className="absolute top-1/2 right-6 -translate-y-1/2 text-gray-500" size={18}/><input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[25px] pr-16 pl-6 py-5 text-white outline-none focus:border-blue-500 font-black text-xl tabular-nums ltr text-left" placeholder="965XXXXXXXX"/></div></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mr-4 block">تحديد الجنس</label><div className="grid grid-cols-2 gap-4"><button onClick={() => setProfileForm({...profileForm, gender: 'male'})} className={`py-5 rounded-[25px] font-black text-xs uppercase tracking-widest border-2 transition-all ${profileForm.gender === 'male' ? 'bg-blue-500 border-blue-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-500'}`}>👨 ذكر</button><button onClick={() => setProfileForm({...profileForm, gender: 'female'})} className={`py-5 rounded-[25px] font-black text-xs uppercase tracking-widest border-2 transition-all ${profileForm.gender === 'female' ? 'bg-pink-500 border-pink-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-500'}`}>👩 أنثى</button></div></div>
                      <button onClick={handleUpdateProfile} disabled={isSaving} className="w-full mt-4 py-6 bg-emerald-500 text-black rounded-[30px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">{isSaving ? <RefreshCw className="animate-spin" /> : <Save size={20}/>} حفظ وتفعيل التنبيهات</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentDashboard;
