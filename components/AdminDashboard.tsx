import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Briefcase, Settings, Video, RefreshCw, HeartPulse, Library, MessageSquare, ClipboardList, ShieldCheck, ShieldAlert, Lock, CreditCard, Newspaper, FlaskConical, Zap, Sparkles, Cpu } from 'lucide-react';
import { dbService } from '../services/db';
import { auth } from '../services/firebase';
import EscalatedPostsWidget from './EscalatedPostsWidget';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [firestoreStatus, setFirestoreStatus] = useState<{ alive: boolean | null, error?: string }>({ alive: null });
  const [isChecking, setIsChecking] = useState(false);
  const [adminRoleValid, setAdminRoleValid] = useState<boolean>(true);

  useEffect(() => {
    checkHealth();
    verifyAdminRole();
  }, []);

  const verifyAdminRole = async () => {
    const user = auth.currentUser;
    if (user) {
        const userData = await dbService.getUser(user.uid);
        if (!userData || userData.role !== 'admin') {
            setAdminRoleValid(false);
        }
    }
  };

  const checkHealth = async () => {
    setIsChecking(true);
    const fsStatus = await dbService.checkConnection();
    setFirestoreStatus(fsStatus);
    setIsChecking(false);
  };

  const adminTools = [
    { view: 'lesson-builder', icon: Cpu, title: 'مختبر الدروس الذكية', description: 'بناء وتجربة الدروس التفاعلية (Universal System).' },
    { view: 'admin-curriculum', icon: BookOpen, title: 'إدارة المناهج', description: 'تعديل الدروس والمحتوى.' },
    { view: 'admin-quizzes', icon: ClipboardList, title: 'إدارة الاختبارات', description: 'بنوك الأسئلة والتقييم.' },
    { view: 'admin-labs', icon: FlaskConical, title: 'إدارة المختبرات', description: 'تجارب HTML5 و Phet.' },
    { view: 'admin-recommendations', icon: Zap, title: 'التوصيات الذكية', description: 'توجيه الطلاب أكاديمياً.' },
    { view: 'admin-content', icon: Newspaper, title: 'محتوى الرئيسية', description: 'الأخبار والإعلانات.' },
    { view: 'admin-brochure', icon: Sparkles, title: 'إدارة البروشور', description: 'تعديل محتوى الصفحة التسويقية.' },
    { view: 'admin-students', icon: Users, title: 'إدارة الطلاب', description: 'الحسابات والاشتراكات.' },
    { view: 'admin-payment-manager', icon: CreditCard, title: 'إدارة الدفع', description: 'الأسعار ورقم ومض.' },
    { view: 'admin-teachers', icon: Briefcase, title: 'إدارة المعلمين', description: 'الصلاحيات والحسابات.' },
    { view: 'admin-managers', icon: ShieldCheck, title: 'إدارة المدراء', description: 'فريق الإدارة.' },
    { view: 'admin-forums', icon: MessageSquare, title: 'المنتديات', description: 'هيكل الأقسام.' },
    { view: 'admin-forum-posts', icon: ShieldAlert, title: 'الرقابة', description: 'إدارة المنشورات.' },
    { view: 'admin-security-fix', icon: Lock, title: 'الأمان', description: 'إصلاح القواعد.' },
    { view: 'admin-live-sessions', icon: Video, title: 'البث المباشر', description: 'جدولة الحصص.' },
    { view: 'admin-assets', icon: Library, title: 'المكتبة', description: 'إدارة الوسائط.' },
    { view: 'admin-settings', icon: Settings, title: 'الإعدادات', description: 'سياسات النظام.' },
  ];

  const handleNavigate = (view: string) => {
    const path = view.startsWith('admin-') ? `/admin/${view.replace('admin-', '')}` : `/${view}`;
    navigate(path);
  };

  return (
    <div className="animate-fadeIn space-y-10 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">غرفة <span className="text-amber-400">القيادة</span></h2>
            <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[10px]">نظام الإدارة المركزي لـ المركز السوري للعلوم</p>
        </div>
      </header>
      
      {!adminRoleValid && (
          <div className="bg-red-600/20 border-2 border-red-600/40 p-6 rounded-[30px] flex items-center gap-6 animate-pulse">
              <ShieldAlert className="text-red-500" size={32} />
              <div>
                  <h4 className="text-white font-black">تحذير الصلاحيات</h4>
                  <p className="text-xs text-gray-400 mt-1">حسابك الحالي غير مسجل بصفة "Admin" في قاعدة البيانات.</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        <div className="xl:col-span-9 space-y-8">
           <EscalatedPostsWidget />
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminTools.map((tool, idx) => (
                <div 
                  key={tool.view} 
                  onClick={() => handleNavigate(tool.view)}
                  className={`glass-panel p-8 rounded-[45px] border-white/5 bg-black/20 cursor-pointer group transition-all flex flex-col gap-6 animate-slideUp hover:border-amber-400/40 ${idx === 0 ? 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30' : ''}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${idx === 0 ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-amber-400 group-hover:bg-amber-400 group-hover:text-black'}`}>
                      <tool.icon size={24} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black transition-colors ${idx === 0 ? 'text-white' : 'text-white group-hover:text-amber-400'}`}>{tool.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-widest">{tool.description}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="xl:col-span-3 space-y-6">
           <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-[#0a1118] shadow-2xl">
              <h3 className="text-sm font-black text-gray-400 mb-8 flex items-center gap-3 uppercase tracking-[0.2em]"><HeartPulse className="text-red-500" size={16} /> سرعة الاستجابة</h3>
              <div className="space-y-4">
                 <div className={`p-5 rounded-2xl border flex justify-between items-center ${firestoreStatus.alive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className="text-[10px] font-black uppercase">Database</span>
                    <span className="text-[10px] font-bold">{firestoreStatus.alive ? 'ONLINE' : 'ERROR'}</span>
                 </div>
                 <button onClick={checkHealth} className="w-full py-4 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                    <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} /> تحديث الحالة
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
