
import React, { useState, useEffect } from 'react';
import { LiveSession } from '../types';
import { dbService } from '../services/db';
import { Video, Plus, Trash2, Edit, Save, X, Calendar, User, BookOpen, Link as LinkIcon, RefreshCw, KeyRound, Hash, Youtube, Globe } from 'lucide-react';

const AdminLiveSessions: React.FC = () => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<LiveSession> | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    const data = await dbService.getLiveSessions();
    setSessions(data);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!editingSession?.title || !editingSession?.streamUrl) {
        setMessage({ text: 'يرجى إكمال الحقول الأساسية (العنوان ورابط البث)', type: 'error' });
        return;
    }

    setIsLoading(true);
    try {
        await dbService.saveLiveSession(editingSession);
        setMessage({ text: 'تم حفظ الجلسة بنجاح ✅', type: 'success' });
        setEditingSession(null);
        loadSessions();
    } catch (e) {
        setMessage({ text: 'فشل حفظ الجلسة.', type: 'error' });
    }
    setIsLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البث؟')) return;
    await dbService.deleteLiveSession(id);
    loadSessions();
  };
  
  const getPlatformIcon = (platform: LiveSession['platform']) => {
    switch (platform) {
      case 'youtube': return <Youtube size={12} className="text-red-500" />;
      case 'other': return <Globe size={12} className="text-gray-400" />;
      case 'zoom':
      default:
        return <Video size={12} className="text-blue-400" />;
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">إدارة <span className="text-blue-400">البث المباشر</span></h2>
            <p className="text-gray-500 mt-2">قم بجدولة جلسات Zoom المباشرة وإضافة روابط البث للطلاب.</p>
        </div>
        <button 
          onClick={() => setEditingSession({ title: '', teacherName: '', startTime: '', status: 'upcoming', topic: '', platform: 'zoom', streamUrl: '', meetingId: '', passcode: '', targetGrades: [], isPremium: false })} 
          className="bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        >
            <Plus size={18} /> إضافة جلسة جديدة
        </button>
      </header>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-bold border ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading && sessions.length === 0 ? (
            <div className="col-span-full py-20 text-center animate-pulse text-gray-500">جاري تحميل الجلسات...</div>
        ) : sessions.map(session => (
            <div key={session.id} className="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a1118]/80 group relative overflow-hidden flex flex-col">
                {session.isPremium && <div className="absolute top-4 left-4 bg-[#fbbf24] text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Premium</div>}
                <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${session.status === 'live' ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                        {session.status === 'live' ? 'بث مباشر 🔴' : 'مجدولة 📅'}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={() => setEditingSession(session)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(session.id)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                </div>
                <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">{session.title}</h4>
                    <p className="text-xs text-gray-500 font-bold mb-4 flex items-center gap-2"><User size={12}/> {session.teacherName}</p>
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2">الموضوع: {session.topic}</p>
                    <div className="flex flex-wrap gap-1">
                        {(session.targetGrades && session.targetGrades.length > 0 ? session.targetGrades : ['الكل']).map(g => (
                            <span key={g} className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-300 font-bold">{g === 'uni' ? 'جامعي' : `صف ${g}`}</span>
                        ))}
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-gray-600">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {session.startTime}</span>
                    <span className="flex items-center gap-1.5">{getPlatformIcon(session.platform)} {session.platform}</span>
                </div>
                <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5 truncate">
                    <p className="text-[9px] font-mono text-gray-500 flex items-center gap-2"><LinkIcon size={10}/> {session.streamUrl}</p>
                </div>
            </div>
        ))}

        {!isLoading && sessions.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30">
                <Video size={64} className="mx-auto mb-4" />
                <p className="font-bold">لا توجد جلسات مجدولة حالياً.</p>
            </div>
        )}
      </div>

      {editingSession && (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0a1118] border border-white/10 w-full max-w-lg rounded-[50px] p-10 relative shadow-3xl animate-slideUp overflow-hidden">
                <button onClick={() => setEditingSession(null)} className="absolute top-8 left-8 text-gray-500 hover:text-white bg-white/5 p-2 rounded-full"><X size={20}/></button>
                
                <h3 className="text-3xl font-black text-white mb-8">{editingSession.id ? 'تعديل الجلسة' : 'إضافة جلسة جديدة'}</h3>
                
                <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar px-2">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">عنوان البث</label>
                        <input type="text" value={editingSession.title || ''} onChange={e => setEditingSession({...editingSession, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400" placeholder="مثال: مراجعة الفيزياء النووية" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">اسم المعلم</label>
                            <input type="text" value={editingSession.teacherName || ''} onChange={e => setEditingSession({...editingSession, teacherName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400" placeholder="أ. فلان الفلاني" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">الموعد</label>
                            <input type="text" value={editingSession.startTime || ''} onChange={e => setEditingSession({...editingSession, startTime: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400" placeholder="اليوم 18:00" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">منصة البث</label>
                        <select value={editingSession.platform || 'zoom'} onChange={e => setEditingSession({...editingSession, platform: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400">
                            <option value="zoom">Zoom (مدمج وآمن)</option>
                            <option value="youtube">YouTube Live</option>
                            <option value="other">منصة خارجية أخرى</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">رابط البث المباشر (URL)</label>
                        <input type="text" value={editingSession.streamUrl || ''} onChange={e => setEditingSession({...editingSession, streamUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400 ltr text-left" placeholder={editingSession.platform === 'youtube' ? 'https://youtube.com/live/...' : 'https://...'} />
                    </div>
                    {(!editingSession.platform || editingSession.platform === 'zoom') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2 flex items-center gap-2"><Hash size={10}/> Meeting ID (للتشغيل المدمج)</label>
                                <input type="text" value={editingSession.meetingId || ''} onChange={e => setEditingSession({...editingSession, meetingId: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400" placeholder="000 0000 000" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2 flex items-center gap-2"><KeyRound size={10}/> Passcode</label>
                                <input type="text" value={editingSession.passcode || ''} onChange={e => setEditingSession({...editingSession, passcode: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400" placeholder="123456" />
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">الفئات المستهدفة (اتركه فارغاً للكل)</label>
                        <div className="flex flex-wrap gap-2 bg-black/40 p-3 rounded-2xl border border-white/10">
                            {(['12', '11', '10', 'uni'] as const).map(g => (
                                <button
                                    key={g}
                                    onClick={() => {
                                        const currentGrades = editingSession.targetGrades || [];
                                        const newGrades = currentGrades.includes(g)
                                            ? currentGrades.filter(grade => grade !== g)
                                            : [...currentGrades, g];
                                        setEditingSession({ ...editingSession, targetGrades: newGrades });
                                    }}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold ${editingSession.targetGrades?.includes(g) ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'}`}
                                >
                                    {g === 'uni' ? 'جامعي' : `الصف ${g}`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/10">
                        <label className="font-bold text-[#fbbf24]">جلسة للمشتركين (Premium)؟</label>
                        <button
                            onClick={() => setEditingSession({...editingSession, isPremium: !editingSession.isPremium})}
                            className={`w-16 h-8 rounded-full p-1 transition-colors ${editingSession.isPremium ? 'bg-green-500' : 'bg-gray-700'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${editingSession.isPremium ? 'translate-x-8' : 'translate-x-0'}`}/>
                        </button>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">الموضوع</label>
                        <input type="text" value={editingSession.topic || ''} onChange={e => setEditingSession({...editingSession, topic: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400" placeholder="الفيزياء الذرية" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">حالة البث</label>
                        <select value={editingSession.status || 'upcoming'} onChange={e => setEditingSession({...editingSession, status: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400">
                            <option value="upcoming">مجدول (قريباً)</option>
                            <option value="live">بث مباشر الآن</option>
                        </select>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10">
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading}
                        className="w-full bg-blue-500 text-white py-5 rounded-[25px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {isLoading ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
                        حفظ بيانات البث
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminLiveSessions;
