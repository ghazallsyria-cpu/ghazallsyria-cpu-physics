import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LiveSession, AppNotification } from '../types';
import { dbService } from '../services/db';
import { Video, Calendar, Users, MessageSquare, Play, Settings, Bell, FileCheck, UserPlus } from 'lucide-react';
import ZoomMeeting from './ZoomMeeting';
import ActivityStats from './ActivityStats';

const TeacherDashboard: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [activeZoomSession, setActiveZoomSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for notifications as a real-time system is not yet fully implemented for teachers
  const mockNotifications: AppNotification[] = [
    { id: '1', userId: user.uid, title: 'تصحيح مطلوب', message: 'الطالب "محمد الأحمد" سلم اختبار الفيزياء النووية.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isRead: false, type: 'info', category: 'academic' },
    { id: '2', userId: user.uid, title: 'طالب جديد انضم', message: 'انضم "علي مصطفى" إلى صف الثاني عشر.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), isRead: false, type: 'success', category: 'general' },
    { id: '3', userId: user.uid, title: 'رسالة جديدة', message: 'لديك رسالة من الطالبة "فاطمة الزهراء".', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), isRead: true, type: 'info', category: 'general' },
  ];

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} د`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} س`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} ي`;
  };

  const getNotificationIcon = (category: AppNotification['category']) => {
    if (category === 'academic') return <FileCheck className="text-amber-400" size={18} />;
    // You can expand this logic for different notification types
    return <UserPlus className="text-blue-400" size={18} />;
  };


  useEffect(() => {
    loadMySessions();
  }, []);

  const loadMySessions = async () => {
    setIsLoading(true);
    const data = await dbService.getLiveSessions();
    // Filter sessions where this teacher is the host (simple name check for demo)
    setSessions(data.filter(s => s.teacherName === user.name));
    setIsLoading(false);
  };

  if (activeZoomSession) {
    return (
      <ZoomMeeting 
        meetingNumber={activeZoomSession.meetingId || ""} 
        passCode={activeZoomSession.passcode || ""} 
        userName={user.name} 
        userRole={user.role}
        onLeave={() => setActiveZoomSession(null)}
      />
    );
  }

  return (
    <div className="animate-fadeIn space-y-10 font-['Tajawal'] text-right pb-20" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-white tracking-tight italic">
              مرحباً، أ. <span className="text-[#fbbf24]">{user.name.split(' ')[0]}</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-2">مساحة إدارة الحصص الافتراضية</p>
        </div>
        <div className="flex gap-3">
             <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-500 uppercase">الحالة الأكاديمية</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-bold text-white">متصل الآن</span>
             </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Sessions Management */}
        <div className="lg:col-span-8 space-y-8">
            <div className="glass-panel p-8 md:p-10 rounded-[50px] border-white/5 bg-[#0a1118]/80">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <Video className="text-[#fbbf24]" /> حصصي المجدولة
                    </h3>
                    <button onClick={() => navigate('/admin/live-sessions')} className="text-[10px] font-black text-blue-400 hover:underline">إدارة الجدولة ←</button>
                </div>

                {isLoading ? (
                    <div className="py-20 text-center animate-pulse text-gray-600">جاري تحميل الحصص...</div>
                ) : sessions.length > 0 ? (
                    <div className="space-y-4">
                        {sessions.map(session => (
                            <div key={session.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-[30px] flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-[#fbbf24]/30 transition-all">
                                <div className="flex items-center gap-6 text-right w-full md:w-auto">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${session.status === 'live' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-gray-500'}`}>
                                        {session.status === 'live' ? '🔴' : '📅'}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white group-hover:text-[#fbbf24] transition-colors">{session.title}</h4>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><Calendar size={12}/> {session.startTime}</span>
                                            <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><Users size={12}/> {session.topic}</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveZoomSession(session)}
                                    className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${session.status === 'live' ? 'bg-[#fbbf24] text-black shadow-lg shadow-yellow-500/20 hover:scale-105' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                >
                                    <Play size={14} fill="currentColor" /> {session.status === 'live' ? 'ابدأ البث المدمج الآن' : 'معاينة الغرفة'}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-30">
                        <Video size={48} className="mx-auto mb-4" />
                        <p className="font-bold">لا توجد حصص مجدولة لك حالياً.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6"><MessageSquare /></div>
                    <h4 className="text-xl font-black mb-2">رسائل الطلاب</h4>
                    <p className="text-xs text-gray-500 mb-6">لديك 3 رسائل جديدة تتطلب الرد بخصوص دروس الفيزياء النووية.</p>
                    <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">فتح صندوق الوارد ←</button>
                </div>
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6"><Settings /></div>
                    <h4 className="text-xl font-black mb-2">إعدادات المحتوى</h4>
                    <p className="text-xs text-gray-500 mb-6">قم بتعديل دروسك أو إضافة أسئلة جديدة إلى بنك الأسئلة المركزي.</p>
                    <button onClick={() => navigate('/admin/curriculum')} className="text-[10px] font-black text-purple-400 uppercase tracking-widest hover:underline">إدارة المحتوى ←</button>
                </div>
            </div>
        </div>

        {/* Right Column: Quick Stats & Notifications */}
        <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel p-8 rounded-[40px] border-white/5">
                <h3 className="text-lg font-black text-[#fbbf24] mb-6 border-r-4 border-[#fbbf24] pr-3">إحصائيات الأداء</h3>
                <div className="space-y-6">
                    {[
                        { label: 'إجمالي الطلاب', val: '450+', icon: '🎓' },
                        { label: 'ساعات البث', val: '120h', icon: '⏱️' },
                        { label: 'تقييم المعلم', val: '4.9/5', icon: '⭐' }
                    ].map((s, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{s.icon}</span>
                                <span className="text-xs font-bold text-gray-400">{s.label}</span>
                            </div>
                            <span className="text-lg font-black text-white">{s.val}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel p-8 rounded-[40px] border-white/5">
                <h3 className="text-lg font-black text-blue-400 mb-6 border-r-4 border-blue-400 pr-3">سجل النشاط</h3>
                <ActivityStats activityLog={user.activityLog} />
            </div>

            <div className="glass-panel p-8 rounded-[40px] border-white/5">
                <h3 className="text-lg font-black text-blue-400 mb-6 border-r-4 border-blue-400 pr-3 flex items-center gap-3"><Bell size={18}/> الإشعارات الحديثة</h3>
                <div className="space-y-4">
                    {mockNotifications.map(note => (
                        <div key={note.id} className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 group">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 relative">
                                {getNotificationIcon(note.category)}
                                {!note.isRead && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full border-2 border-[#0a1118] shadow-[0_0_10px_#3b82f6]"></div>}
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold text-xs ${note.isRead ? 'text-gray-400' : 'text-white'}`}>{note.message}</p>
                                <p className="text-[10px] font-mono text-gray-600 group-hover:text-blue-400 transition-colors">{formatRelativeTime(note.timestamp)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;