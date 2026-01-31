import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ViewState, User, AppBranding, HomePageContent } from '../types';
import { dbService } from '../services/db';
import { LayoutDashboard, BookOpen, Atom, FlaskConical, Target, MessageSquare, BrainCircuit, ShieldCheck, UserPlus, Database, Settings, LogOut, ChevronLeft, Map, Image as ImageIcon, Zap, Crown, Library, ExternalLink, Users, Briefcase, Lock, Video, Newspaper, CreditCard } from 'lucide-react';

interface SidebarProps {
  user: User;
  branding: AppBranding;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, branding, onLogout, isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarAds, setSidebarAds] = useState<HomePageContent[]>([]);
  
  // This would be derived from the route in a more complex app
  const activeSubject = 'Physics'; 

  useEffect(() => {
    const loadAds = async () => {
        try {
            const content = await dbService.getHomePageContent();
            setSidebarAds(content.filter(c => c.placement === 'SIDEBAR_WIDGET'));
        } catch (e) {}
    };
    loadAds();
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) onClose?.();
  };
  
  const getNavItems = () => {
    switch (user.role) {
      case 'student':
        return [
          { label: 'الرئيسية', items: [
            { path: '/dashboard', id: 'dashboard', label: 'لوحة التحكم', icon: '🏠' },
            { path: '/journey-map', id: 'journey-map', label: 'خريطة رحلتك', icon: '🗺️' },
          ]},
          { label: 'المحتوى التعليمي', items: [
            { path: '/curriculum', id: 'curriculum', label: 'المنهج الدراسي', icon: '📚' },
            { path: '/lab-hub', id: 'lab-hub', label: 'المختبر التفاعلي', icon: '🔬' },
            { path: '/quiz-center', id: 'quiz_center', label: 'مركز الاختبارات', icon: '⚡' },
          ]},
          { label: 'أدوات الذكاء الاصطناعي', items: [
            { path: '/ai-chat', id: 'ai-chat', label: 'المساعد الذكي', icon: '🤖' },
          ]},
          { label: 'التفاعل والمجتمع', items: [
            { path: '/discussions', id: 'discussions', label: 'ساحة النقاش', icon: '💬' },
          ]},
          { label: 'الحساب', items: [
            { path: '/subscription', id: 'subscription', label: 'الاشتراك والفواتير', icon: '💳' },
          ]},
        ];
      case 'admin':
      case 'teacher':
        return [
          { label: 'الرئيسية', items: [
            { path: user.role === 'admin' ? '/admin/dashboard' : '/dashboard', id: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
          ]},
          { label: 'إدارة المحتوى', items: [
            { path: '/admin/curriculum', id: 'admin-curriculum', label: 'المناهج والدروس', icon: '📚' },
            { path: '/admin/quizzes', id: 'admin-quizzes', label: 'الاختبارات', icon: '📝' },
            { path: '/admin/labs', id: 'admin-labs', label: 'المختبرات', icon: '🔬' },
            { path: '/admin/assets', id: 'admin-assets', label: 'مكتبة الوسائط', icon: '🖼️' },
            { path: '/admin/content', id: 'admin-content', label: 'محتوى الرئيسية', icon: '📰' },
          ]},
          { label: 'إدارة المستخدمين', items: [
            { path: '/admin/students', id: 'admin-students', label: 'الطلاب', icon: '🎓' },
            { path: '/admin/teachers', id: 'admin-teachers', label: 'المعلمين', icon: '🧑‍🏫' },
            { path: '/admin/managers', id: 'admin-managers', label: 'المدراء', icon: '🛡️' },
          ]},
          { label: 'التفاعل والمجتمع', items: [
            { path: '/admin/forums', id: 'admin-forums', label: 'هيكل المنتديات', icon: '💬' },
            { path: '/admin/forum-posts', id: 'admin-forum-posts', label: 'مراقبة المنشورات', icon: '🚨' },
            { path: '/admin/live-sessions', id: 'admin-live-sessions', label: 'البث المباشر', icon: '📺' },
          ]},
          { label: 'النظام والمالية', items: [
            { path: '/admin/payment-manager', id: 'admin-payment-manager', label: 'المالية والأسعار', icon: '💰' },
            { path: '/admin/recommendations', id: 'admin-recommendations', label: 'التوصيات الذكية', icon: '🧠' },
            { path: '/admin/settings', id: 'admin-settings', label: 'إعدادات النظام', icon: '⚙️' },
            { path: '/admin/security-fix', id: 'admin-security-fix', label: 'أمان Firestore', icon: '🔒' },
          ]},
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-[55] lg:hidden transition-opacity" onClick={onClose} />
      )}
      <div className={`fixed inset-y-0 right-0 z-[60] w-72 bg-[#0A2540] border-l border-white/5 flex flex-col transition-transform duration-500 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6">
          <div className="bg-white/[0.03] border border-white/5 p-5 rounded-[35px] flex items-center gap-5 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shadow-lg relative z-10">
                {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="App Logo" className="w-full h-full object-contain" />
                ) : (
                    <span className="text-2xl">⚛️</span>
                )}
             </div>
             <div className="min-w-0 relative z-10 text-right">
                <h3 className="font-black text-white truncate text-sm leading-tight">{branding.appName}</h3>
                <span className="text-[9px] text-amber-500 uppercase font-black tracking-widest mt-1 block">بوابة {user.role}</span>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto no-scrollbar space-y-8 pb-10">
          {navItems.map((group, idx) => (
            <div key={idx}>
              <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item: any) => {
                  const isActive = item.path && location.pathname === item.path;
                  return (
                    <button
                      key={item.path + (item.subject || '')}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-amber-400 text-black shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-bold text-[13px] tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest">
            <span>🚪</span> تسجيل الخروج
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
