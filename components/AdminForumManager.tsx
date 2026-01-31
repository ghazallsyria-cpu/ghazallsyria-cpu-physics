
import React, { useState, useEffect } from 'react';
import { ForumSection, Forum, User, LoggingSettings } from '../types';
import { dbService } from '../services/db';
import { Plus, Trash2, Edit, Save, X, RefreshCw, ChevronUp, ChevronDown, MessageSquare, PlusCircle, Database, ShieldCheck, Zap, Globe } from 'lucide-react';

const AdminForumManager: React.FC = () => {
    const [sections, setSections] = useState<ForumSection[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [settings, setSettings] = useState<LoggingSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingSection, setEditingSection] = useState<Partial<ForumSection> | null>(null);
    const [editingForum, setEditingForum] = useState<{ forum: Partial<Forum>, sectionId: string } | null>(null);
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [sectionsData, teachersData, settingsData] = await Promise.all([
                dbService.getForumSections(),
                dbService.getTeachers(),
                dbService.getLoggingSettings()
            ]);
            setSections(sectionsData);
            setTeachers(teachersData);
            setSettings(settingsData);
        } catch (e) {
            console.error("Load error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitialize = async () => {
        if (!confirm("سيتم إنشاء الجداول الأساسية ومنشور ترحيبي لضمان عمل قاعدة البيانات. هل تود الاستمرار؟")) return;
        setIsSaving(true);
        try {
            await dbService.initializeForumSystem();
            setMessage({ text: "تمت تهيئة الجداول (Collections) بنجاح ✅", type: 'success' });
            await loadData();
        } catch (e) {
            setMessage({ text: "فشلت التهيئة.", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveEverything = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                dbService.saveForumSections(sections),
                settings ? dbService.saveLoggingSettings(settings) : Promise.resolve()
            ]);
            setMessage({text: "تم حفظ هيكل المنتديات والإعدادات بنجاح!", type: 'success'});
        } catch (error) {
            setMessage({text: "فشل حفظ التغييرات.", type: 'error'});
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const addSection = () => setEditingSection({ id: `sec_${Date.now()}`, title: '', description: '', forums: [], order: sections.length });
    const saveSection = () => {
        if (!editingSection || !editingSection.title) return;
        if (sections.some(s => s.id === editingSection.id)) {
            setSections(sections.map(s => s.id === editingSection.id ? editingSection as ForumSection : s));
        } else {
            setSections([...sections, editingSection as ForumSection]);
        }
        setEditingSection(null);
    };

    const addForum = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;
        setEditingForum({
            forum: { id: `forum_${Date.now()}`, title: '', description: '', icon: '💬', imageUrl: '', order: section.forums.length },
            sectionId
        });
    };

    const saveForum = () => {
        if (!editingForum || !editingForum.forum.title) return;
        setSections(sections.map(section => {
            if (section.id === editingForum.sectionId) {
                const newForums = [...section.forums];
                const existingIndex = newForums.findIndex(f => f.id === editingForum.forum.id);
                if (existingIndex > -1) newForums[existingIndex] = editingForum.forum as Forum;
                else newForums.push(editingForum.forum as Forum);
                return { ...section, forums: newForums };
            }
            return section;
        }));
        setEditingForum(null);
    };

    return (
        <div className="max-w-7xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <div>
                    <h2 className="text-4xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
                        <MessageSquare className="text-[#fbbf24]" size={32} /> إدارة <span className="text-[#fbbf24]">المنتديات والنقاشات</span>
                    </h2>
                    <p className="text-gray-500 mt-2">تحكم في هيكل الأقسام، وصلاحيات الطلاب.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleInitialize} className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"><Database size={18} /> تهيئة الجداول</button>
                    <button onClick={addSection} className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 hover:bg-white/10 transition-all"><PlusCircle size={18} /> قسم رئيسي</button>
                    <button onClick={handleSaveEverything} disabled={isSaving} className="bg-[#fbbf24] text-black px-10 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all">
                        {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18} />} حفظ التغييرات
                    </button>
                </div>
            </header>

            {message && <div className={`mb-8 p-5 rounded-3xl text-sm font-bold border flex items-center gap-3 animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}> {message.text} </div>}
            
            {/* إعدادات الصلاحيات المدمجة */}
            <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent mb-12">
                <div className="flex items-center gap-4 mb-8">
                    <ShieldCheck className="text-blue-400" />
                    <h3 className="text-xl font-black text-white">صلاحيات الوصول العامة</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                        onClick={() => settings && setSettings({...settings, forumAccessTier: 'free'})}
                        className={`p-6 rounded-[30px] border-2 transition-all flex items-center justify-between ${settings?.forumAccessTier === 'free' ? 'border-[#fbbf24] bg-[#fbbf24]/10 text-[#fbbf24]' : 'border-white/5 bg-white/5 text-gray-500'}`}
                    >
                        <div className="flex items-center gap-4">
                            <Globe size={24} />
                            <div className="text-right">
                                <p className="font-black text-sm">مفتوح للجميع</p>
                                <p className="text-[10px] opacity-60">يمكن لكافة الطلاب النشر والرد</p>
                            </div>
                        </div>
                        {settings?.forumAccessTier === 'free' && <ShieldCheck size={20}/>}
                    </button>
                    <button 
                        onClick={() => settings && setSettings({...settings, forumAccessTier: 'premium'})}
                        className={`p-6 rounded-[30px] border-2 transition-all flex items-center justify-between ${settings?.forumAccessTier === 'premium' ? 'border-blue-400 bg-blue-400/10 text-blue-400' : 'border-white/5 bg-white/5 text-gray-500'}`}
                    >
                        <div className="flex items-center gap-4">
                            <Zap size={24} />
                            <div className="text-right">
                                <p className="font-black text-sm">للمشتركين فقط (Premium)</p>
                                <p className="text-[10px] opacity-60">النشر والرد متاح فقط لأصحاب الاشتراكات</p>
                            </div>
                        </div>
                        {settings?.forumAccessTier === 'premium' && <ShieldCheck size={20}/>}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-40 text-center animate-pulse"><RefreshCw className="w-12 h-12 text-[#fbbf24] animate-spin mx-auto mb-6" /></div>
            ) : (
                <div className="space-y-10">
                    {sections.length === 0 && <div className="text-center py-20 opacity-30 italic">لا توجد أقسام بعد. اضغط على "تهيئة الجداول" أو "قسم رئيسي" للبدء.</div>}
                    {sections.map((section, index) => (
                        <div key={section.id} className="glass-panel p-8 rounded-[40px] border border-white/5 bg-black/20 group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-xl font-black text-[#fbbf24] shadow-inner">{index + 1}</div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{section.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingSection(section)} className="p-3 bg-white/5 rounded-xl text-blue-400 hover:bg-white/10"><Edit size={18}/></button>
                                    <button onClick={() => { if(confirm("حذف القسم؟")) setSections(sections.filter(s => s.id !== section.id)); }} className="p-3 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={18}/></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {section.forums.map(forum => (
                                    <div key={forum.id} className="bg-white/[0.02] p-5 rounded-[30px] border border-white/5 flex justify-between items-center group/forum hover:bg-white/[0.05] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-black/40 overflow-hidden flex items-center justify-center border border-white/10">
                                                {forum.imageUrl ? <img src={forum.imageUrl} className="w-full h-full object-cover" /> : <span className="text-2xl">{forum.icon}</span>}
                                            </div>
                                            <div>
                                                <span className="text-lg font-black text-white">{forum.title}</span>
                                                <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{forum.moderatorName ? `🔐 ${forum.moderatorName}` : 'بدون إشراف'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover/forum:opacity-100 transition-opacity">
                                            <button onClick={() => setEditingForum({ forum, sectionId: section.id })} className="p-2 text-blue-400"><Edit size={14}/></button>
                                            <button onClick={() => { setSections(sections.map(s => s.id === section.id ? { ...s, forums: s.forums.filter(f => f.id !== forum.id) } : s)); }} className="p-2 text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => addForum(section.id)} className="col-span-full py-4 text-xs font-black text-green-400 border-2 border-dashed border-green-500/20 rounded-[30px] hover:bg-green-500/5 transition-all">+ إضافة منتدى نقاش فرعي</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals for Adding/Editing */}
            {(editingSection || editingForum) && (
                <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-[#0a1118] border border-white/10 w-full max-w-xl rounded-[60px] p-10 relative shadow-3xl">
                        <button onClick={() => { setEditingSection(null); setEditingForum(null); }} className="absolute top-8 left-8 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full">✕</button>
                        
                        {editingSection && (
                            <div className="space-y-8">
                                <h3 className="text-3xl font-black text-white">إعدادات القسم</h3>
                                <div className="space-y-6">
                                    <input type="text" placeholder="عنوان القسم" value={editingSection.title} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24]" />
                                    <textarea placeholder="وصف القسم" value={editingSection.description} onChange={e => setEditingSection({...editingSection, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24] h-32" />
                                    <button onClick={saveSection} className="w-full bg-[#fbbf24] text-black py-5 rounded-2xl font-black uppercase shadow-2xl transition-all">تحديث القسم</button>
                                </div>
                            </div>
                        )}

                        {editingForum && (
                             <div className="space-y-8">
                                <h3 className="text-3xl font-black text-white">إعدادات رابط النقاش</h3>
                                <div className="space-y-6">
                                    <input type="text" placeholder="اسم المنتدى" value={editingForum.forum.title} onChange={e => setEditingForum({...editingForum, forum: {...editingForum.forum, title: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400" />
                                    <select 
                                        value={editingForum.forum.moderatorUid || ''}
                                        onChange={e => {
                                            const t = teachers.find(u => u.uid === e.target.value);
                                            setEditingForum({...editingForum, forum: {...editingForum.forum, moderatorUid: t?.uid, moderatorName: t?.name}});
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none"
                                    >
                                        <option value="">تعيين مشرف أكاديمي</option>
                                        {teachers.map(t => <option key={t.uid} value={t.uid}>{t.name}</option>)}
                                    </select>
                                    <input type="text" placeholder="رابط الصورة المعبرة" value={editingForum.forum.imageUrl} onChange={e => setEditingForum({...editingForum, forum: {...editingForum.forum, imageUrl: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-400 text-xs font-mono" />
                                    <button onClick={saveForum} className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black uppercase shadow-2xl transition-all">حفظ الرابط</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminForumManager;
