import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LiveSession, User } from '../types';
import { dbService } from '../services/db';
import { Video, Calendar, User as UserIcon, BookOpen, RefreshCw, AlertCircle, PlayCircle, ExternalLink, Youtube, X, BellRing } from 'lucide-react';

// Lazy load components
const ZoomMeeting = lazy(() => import('./ZoomMeeting'));
const YouTubePlayer = lazy(() => import('./YouTubePlayer'));

// Helper to extract video ID from various YouTube URL formats
const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]{11}).*/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
};

interface LiveSessionsProps {
  user: User;
}

const LiveSessions: React.FC<LiveSessionsProps> = ({ user }) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [activeZoomSession, setActiveZoomSession] = useState<LiveSession | null>(null);
  const [activeYoutubeSession, setActiveYoutubeSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribeSessions = dbService.subscribeToLiveSessions((updatedSessions) => {
        setSessions(updatedSessions);
        if (teachers.length > 0) setIsLoading(false);
        setError(null);
    });
    const unsubscribeTeachers = dbService.subscribeToUsers((updatedTeachers) => {
        setTeachers(updatedTeachers);
        if (sessions.length > 0 || dbCurriculumIsNotEmpty()) setIsLoading(false);
    }, 'teacher');

    // Helper to check if any curriculum data is loaded, to prevent indefinite loading state.
    const dbCurriculumIsNotEmpty = () => sessions.length > 0;

    return () => {
        unsubscribeSessions();
        unsubscribeTeachers();
    };
  }, []);
  
  // New Effect for notification logic
  useEffect(() => {
    const NOTIFICATION_WINDOW_MINUTES = 5;

    const checkUpcomingSessions = () => {
        const now = new Date().getTime();
        sessions.forEach(session => {
            if (session.status === 'upcoming') {
                const sessionTime = new Date(session.startTime).getTime();
                if (isNaN(sessionTime)) return; // Invalid date, skip
                
                const diffInMinutes = (sessionTime - now) / 60000;
                const notifiedKey = `notified_${session.id}`;
                const alreadyNotified = sessionStorage.getItem(notifiedKey);

                if (diffInMinutes > 0 && diffInMinutes <= NOTIFICATION_WINDOW_MINUTES && !alreadyNotified) {
                    const roundedMinutes = Math.ceil(diffInMinutes);
                    const toastMessage = `"${session.title}" ستبدأ خلال ${roundedMinutes} ${roundedMinutes > 1 ? 'دقائق' : 'دقيقة'}.`;
                    
                    // Show immediate toast
                    setToast({ title: '📢 جلسة على وشك البدء!', message: toastMessage });
                    setTimeout(() => setToast(null), 7000);

                    // Create persistent notification in DB
                    dbService.createNotification({
                        userId: user.uid,
                        title: "📢 جلسة على وشك البدء!",
                        message: `حصتك المباشرة "${session.title}" ستبدأ قريباً. استعد!`,
                        timestamp: new Date().toISOString(),
                        isRead: false,
                        type: 'info',
                        category: 'academic'
                    });

                    // Mark as notified for this browser session
                    sessionStorage.setItem(notifiedKey, 'true');
                }
            }
        });
    };

    // Run the check every 30 seconds
    const intervalId = setInterval(checkUpcomingSessions, 30000);
    checkUpcomingSessions(); // Initial check

    return () => clearInterval(intervalId);
  }, [sessions, user.uid]);

  const handleJoinClick = (session: LiveSession) => {
    if (session.status !== 'live') {
      alert('لم تبدأ هذه الجلسة بعد. سيتم تفعيل زر الانضمام عند بدء البث.');
      return;
    }

    if (session.platform === 'zoom' && session.meetingId) {
      setActiveZoomSession(session);
    } else if (session.platform === 'youtube' && session.streamUrl) {
      setActiveYoutubeSession(session);
    } else if (session.streamUrl) {
      window.open(session.streamUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('رابط البث غير متوفر حالياً.');
    }
  };

  if (activeYoutubeSession) {
    const videoId = extractYoutubeId(activeYoutubeSession.streamUrl);
    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4" onClick={() => setActiveYoutubeSession(null)}>
            <div className="w-full max-w-4xl bg-[#0a1118] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-center bg-black/50">
                    <h3 className="text-sm font-bold text-white">{activeYoutubeSession.title}</h3>
                    <button onClick={() => setActiveYoutubeSession(null)} className="p-2 rounded-full bg-white/10 text-white hover:bg-red-500"><X size={16} /></button>
                </header>
                <div className="aspect-video bg-black">
                    {videoId ? (
                        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">جاري تحميل البث...</div>}>
                            <YouTubePlayer videoId={videoId} />
                        </Suspense>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-red-400 font-bold p-8 text-center">
                           رابط يوتيوب غير صالح أو لا يمكن تضمينه. يرجى التحقق من الرابط في لوحة التحكم.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  }

  if (activeZoomSession) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-[500]">
           <RefreshCw className="animate-spin mb-4" size={40} />
           <p className="font-bold">جاري تحميل نظام الاجتماعات...</p>
        </div>
      }>
        <ZoomMeeting 
            meetingNumber={activeZoomSession.meetingId || ""} 
            passCode={activeZoomSession.passcode || ""} 
            userName={user.name} 
            userRole={user.role}
            directLink={activeZoomSession.streamUrl}
            onLeave={() => setActiveZoomSession(null)}
        />
      </Suspense>
    );
  }
  
  const isUserPremium = user.subscription !== 'free';
  const filteredSessions = sessions.filter(session => {
    const gradeMatch = !session.targetGrades || session.targetGrades.length === 0 || session.targetGrades.includes(user.grade);
    const subMatch = !session.isPremium || isUserPremium;
    return gradeMatch && subMatch;
  });


  const getPlatformIcon = (platform: LiveSession['platform']) => {
    switch (platform) {
      case 'youtube': return <Youtube size={20} />;
      default: return <Video size={20} />;
    }
  };
  
  const getJoinButton = (session: LiveSession) => {
    if (session.status !== 'live') {
      return (
        <button disabled className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-600 cursor-default">
          بانتظار بدء المعلم
        </button>
      );
    }

    if (session.platform === 'zoom') {
      return (
        <div className="flex flex-col gap-2">
          <button 
              onClick={() => handleJoinClick(session)}
              className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-blue-500 text-white shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
              <PlayCircle size={16}/> دخول الحصة المدمجة
          </button>
          {session.streamUrl && (
              <button 
                  onClick={() => window.open(session.streamUrl, '_blank', 'noopener,noreferrer')}
                  className="w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2"
              >
                  <ExternalLink size={12}/> فتح في تطبيق Zoom
              </button>
          )}
        </div>
      );
    }
    
    if (session.platform === 'youtube') {
       return (
        <button onClick={() => handleJoinClick(session)} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-600 text-white shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
          <Youtube size={16}/> مشاهدة البث الآن
        </button>
       );
    }

    return (
      <button onClick={() => handleJoinClick(session)} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-gray-500 text-white shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
        <ExternalLink size={16}/> الانضمام للجلسة
      </button>
    );
  };


  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-10 z-[2000] w-full max-w-sm animate-slideUp">
            <div className="glass-panel p-6 rounded-[30px] border-2 border-amber-500/30 bg-amber-500/10 flex items-start gap-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <BellRing size={24} className="animate-pulse" />
                </div>
                <div>
                    <h4 className="font-black text-amber-400">{toast.title}</h4>
                    <p className="text-sm text-gray-300">{toast.message}</p>
                </div>
                <button onClick={() => setToast(null)} className="absolute top-4 left-4 text-gray-500 hover:text-white">&times;</button>
            </div>
        </div>
      )}
      <div className="mb-16 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter italic uppercase">الجلسات <span className="text-blue-400 text-glow">المباشرة</span></h2>
        <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
          انضم إلى فصولنا التفاعلية المباشرة المدمجة مع نخبة من المعلمين في الكويت.
        </p>
      </div>

      <div className="border-t border-white/5 pt-12">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black border-r-4 border-blue-400 pr-4">حصص اليوم</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                مزامنة حية نشطة
            </div>
        </div>
        
        {isLoading ? (
          <div className="py-32 text-center">
             <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">جاري البحث عن البثوث المجدولة...</p>
          </div>
        ) : error ? (
            <div className="py-20 text-center glass-panel rounded-[40px] border-red-500/20 bg-red-500/5">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <p className="text-lg font-bold text-red-400">{error}</p>
            </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSessions.map(session => {
                const teacher = teachers.find(t => t.name === session.teacherName);
                const isTeacherOnline = teacher?.lastSeen && (new Date().getTime() - new Date(teacher.lastSeen).getTime()) < 3 * 60 * 1000;
                return (
                  <div 
                      key={session.id} 
                      className={`bg-[#0a1118]/80 border p-8 rounded-[40px] group transition-all flex flex-col relative overflow-hidden ${session.status === 'live' ? 'border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-white/5 hover:border-white/10'}`}
                  >
                      <div className="flex justify-between items-start mb-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${session.status === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-400'}`}>
                              {session.status === 'live' ? 'بث مباشر 🔴' : 'مجدولة 📅'}
                          </span>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.status === 'live' ? 'bg-blue-500 text-black' : 'bg-white/5 text-gray-500'}`}>
                              {getPlatformIcon(session.platform)}
                          </div>
                      </div>
                      <div className="flex-1">
                          <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{session.title}</h4>
                          <div className="text-xs text-gray-500 font-bold mb-6 flex items-center gap-2">
                            <UserIcon size={14}/> 
                            {session.teacherName}
                            {isTeacherOnline !== undefined && (
                              <span className={`w-2 h-2 rounded-full ml-1 ${isTeacherOnline ? 'bg-green-500' : 'bg-gray-600'}`} title={isTeacherOnline ? 'المعلم متصل الآن' : 'المعلم غير متصل'}></span>
                            )}
                          </div>
                          
                          <div className="space-y-2 mb-6">
                              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                  <BookOpen size={12}/>
                                  <span className="font-black uppercase tracking-widest">{session.topic}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                  <Calendar size={12}/>
                                  <span className="font-black uppercase tracking-widest">{session.startTime}</span>
                              </div>
                          </div>
                      </div>
                      <div className="mt-4">
                        {getJoinButton(session)}
                      </div>
                      
                      {session.status === 'live' && (
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                      )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="py-32 text-center glass-panel rounded-[50px] border-2 border-dashed border-white/10 opacity-60">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video size={40} className="text-gray-600" />
              </div>
              <p className="font-black text-lg uppercase tracking-widest mb-2">لا توجد حصص مباشرة متاحة لك حالياً</p>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">سيتم إخطارك فور بدء أي حصة جديدة تناسب صفك الدراسي.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSessions;
