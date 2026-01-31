
import React, { useState, useEffect } from 'react';
import { AIRecommendation, User } from '../types';
import { dbService } from '../services/db';
import { Send, Trash2, Users, User as UserIcon, RefreshCw, Zap, Clock, Info } from 'lucide-react';

const AdminRecommendationManager: React.FC = () => {
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newRec, setNewRec] = useState<Partial<AIRecommendation>>({
        title: '', reason: '', type: 'lesson', urgency: 'medium', targetGrade: 'all'
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // جلب التوصيات (بدون فلترة للمدير لرؤية الكل)
            const snap = await dbService.getAIRecommendations({ grade: 'all', email: '' } as any);
            setRecommendations(snap);
        } catch (e) {}
        finally { setIsLoading(false); }
    };

    const handleSend = async () => {
        if (!newRec.title || !newRec.reason) return;
        setIsSaving(true);
        try {
            await dbService.saveRecommendation(newRec);
            setNewRec({ title: '', reason: '', type: 'lesson', urgency: 'medium', targetGrade: 'all' });
            await loadData();
        } catch (e) {}
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("حذف هذه التوصية؟")) return;
        await dbService.deleteRecommendation(id);
        await loadData();
    };

    return (
        <div className="max-w-6xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="mb-12 border-r-4 border-purple-500 pr-8">
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">إدارة <span className="text-purple-400">التوجيه الذكي</span></h2>
                <p className="text-gray-500 mt-2 font-medium">إرسال توصيات مخصصة لصف دراسي أو طالب محدد.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5">
                    <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent">
                        <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><Zap className="text-purple-400" /> توصية جديدة</h3>
                        <div className="space-y-6">
                            <input type="text" placeholder="عنوان التوصية (مثلاً: مراجعة المكثفات)" value={newRec.title} onChange={e => setNewRec({...newRec, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-purple-400" />
                            <textarea placeholder="السبب أو النصيحة..." value={newRec.reason} onChange={e => setNewRec({...newRec, reason: e.target.value})} className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-purple-400" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <select value={newRec.targetGrade} onChange={e => setNewRec({...newRec, targetGrade: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white">
                                    <option value="all">لكافة الطلاب</option>
                                    <option value="10">الصف العاشر</option>
                                    <option value="11">الحادي عشر</option>
                                    <option value="12">الثاني عشر</option>
                                </select>
                                <select value={newRec.urgency} onChange={e => setNewRec({...newRec, urgency: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white">
                                    <option value="low">أولوية عادية</option>
                                    <option value="medium">أولوية متوسطة</option>
                                    <option value="high">أولوية قصوى 🔥</option>
                                </select>
                            </div>
                            
                            <input type="email" placeholder="بريد طالب محدد (اختياري)" value={newRec.targetUserEmail || ''} onChange={e => setNewRec({...newRec, targetUserEmail: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-purple-400 text-left ltr" />

                            <button onClick={handleSend} disabled={isSaving} className="w-full bg-purple-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isSaving ? <RefreshCw className="animate-spin" /> : <Send size={18} />} إرسال التوصية الآن
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <div className="glass-panel p-8 md:p-10 rounded-[50px] border-white/5 bg-black/20 min-h-[600px]">
                        <h3 className="text-xl font-black text-white mb-8 border-b border-white/5 pb-4">التوصيات النشطة</h3>
                        {isLoading ? (
                            <div className="py-20 text-center animate-pulse"><RefreshCw className="animate-spin mx-auto text-purple-500" /></div>
                        ) : (
                            <div className="space-y-4">
                                {recommendations.map(rec => (
                                    <div key={rec.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-[30px] flex justify-between items-center group hover:bg-white/[0.05] transition-all">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-black text-white">{rec.title}</h4>
                                                <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black ${rec.urgency === 'high' ? 'bg-red-500 text-white' : 'bg-blue-500/20 text-blue-400'}`}>{rec.urgency}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 italic truncate">"{rec.reason}"</p>
                                            <div className="flex gap-4 mt-3 text-[9px] font-bold text-gray-600 uppercase">
                                                <span className="flex items-center gap-1"><Users size={10}/> {rec.targetGrade}</span>
                                                {rec.targetUserEmail && <span className="flex items-center gap-1 text-purple-400"><UserIcon size={10}/> {rec.targetUserEmail}</span>}
                                                <span className="flex items-center gap-1"><Clock size={10}/> {new Date(rec.createdAt).toLocaleDateString('ar-KW')}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(rec.id)} className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRecommendationManager;
