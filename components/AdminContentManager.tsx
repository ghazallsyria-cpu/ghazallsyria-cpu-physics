
import React, { useState, useEffect } from 'react';
import { HomePageContent, ContentPlacement } from '../types';
import { dbService } from '../services/db';
import { PlusCircle, Edit, Trash2, X, Save, RefreshCw, LayoutDashboard, AlertTriangle, Newspaper, Image as ImageIcon, Megaphone, Film, MapPin, Monitor, Layers, MousePointer2 } from 'lucide-react';

const AdminContentManager: React.FC = () => {
    const [contentItems, setContentItems] = useState<HomePageContent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<Partial<HomePageContent> | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'carousel'>('general');

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        setIsLoading(true);
        try {
            const data = await dbService.getHomePageContent();
            setContentItems(data);
        } catch (error) {
            setMessage("فشل تحميل المحتوى.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const filteredContent = contentItems.filter(item => {
        if (activeTab === 'carousel') return item.type === 'carousel';
        return ['news', 'alert', 'announcement', 'image'].includes(item.type);
    });

    const handleSave = async () => {
        if (!editingItem || !editingItem.title || !editingItem.content) {
            alert("يرجى تعبئة العنوان والمحتوى.");
            return;
        }
        setIsLoading(true);
        try {
            await dbService.saveHomePageContent(editingItem);
            setEditingItem(null);
            await loadContent();
            setMessage("تم الحفظ بنجاح!");
        } catch (error) {
            setMessage("فشل الحفظ.");
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذا العنصر؟")) {
            await dbService.deleteHomePageContent(id);
            await loadContent();
        }
    };
    
    const startNewItem = () => {
        setEditingItem({
            type: activeTab === 'carousel' ? 'carousel' : 'news',
            placement: 'TOP_BANNER',
            priority: 'normal',
            title: '',
            content: '',
            createdAt: new Date().toISOString()
        });
    };
    
    const getPlacementIcon = (placement: ContentPlacement) => {
        switch (placement) {
            case 'TOP_BANNER': return <Monitor size={14} />;
            case 'GRID_CARD': return <Layers size={14} />;
            case 'SIDEBAR_WIDGET': return <MousePointer2 size={14} />;
            case 'MODAL_POPUP': return <PlusCircle size={14} />;
            default: return <MapPin size={14} />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <h2 className="text-3xl font-black text-white flex items-center gap-4"><LayoutDashboard className="text-amber-400" /> التحكم في الصفحة الرئيسية</h2>
                <div className="flex gap-4">
                    <button onClick={loadContent} className="p-4 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all border border-white/10"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} /></button>
                    <button onClick={startNewItem} className="bg-[#fbbf24] text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"><PlusCircle size={18} /> إضافة إعلان/تنبيه</button>
                </div>
            </header>

            {message && <div className="mb-4 p-4 bg-green-500/10 text-green-400 rounded-2xl text-xs font-bold text-center animate-slideUp">{message}</div>}

            <div className="glass-panel p-8 rounded-[40px] border-white/5 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-white/10 text-xs font-black text-gray-500 uppercase tracking-widest">
                        <tr className="text-right">
                            <th className="p-4">العنوان</th>
                            <th className="p-4 text-center">مكان الظهور</th>
                            <th className="p-4 text-center">النوع</th>
                            <th className="p-4 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contentItems.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <td className="p-4 font-bold text-white">{item.title}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-amber-400/10 text-amber-400 px-3 py-1.5 rounded-xl text-[10px] font-black inline-flex items-center gap-2">
                                        {getPlacementIcon(item.placement)} {item.placement}
                                    </span>
                                </td>
                                <td className="p-4 text-center text-gray-400 text-xs">{item.type}</td>
                                <td className="p-4 text-center flex justify-center gap-2">
                                    <button onClick={() => setEditingItem(item)} className="p-2.5 text-blue-400 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-all"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2.5 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!isLoading && contentItems.length === 0 && <div className="text-center py-20 opacity-30 italic">لا يوجد محتوى مضاف حالياً.</div>}
            </div>
            
            {editingItem && (
                <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn" onClick={() => setEditingItem(null)}>
                    <div className="bg-[#0a1118] border border-white/10 w-full max-w-3xl rounded-[60px] p-10 shadow-3xl animate-slideUp flex flex-col max-h-[90vh] relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[100px] pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <h3 className="text-3xl font-black text-white italic">{editingItem.id ? 'تعديل المحتوى' : 'إضافة محتوى ذكي'}</h3>
                            <button onClick={() => setEditingItem(null)} className="p-3 text-gray-500 hover:text-white bg-white/5 rounded-full"><X size={24}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-8 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">مكان الظهور (Placement)</label>
                                    <select value={editingItem.placement || 'TOP_BANNER'} onChange={e => setEditingItem({ ...editingItem, placement: e.target.value as ContentPlacement })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400 font-bold transition-all">
                                        <option value="TOP_BANNER">📺 البانر العلوي (Hero Area)</option>
                                        <option value="GRID_CARD">🗂️ كرت مدمج (Dashboard Grid)</option>
                                        <option value="SIDEBAR_WIDGET">🖱️ القائمة الجانبية (Sidebar)</option>
                                        <option value="MODAL_POPUP">⚠️ منبثق عند الدخول (Initial Popup)</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">نوع المحتوى</label>
                                    <select value={editingItem.type || 'news'} onChange={e => setEditingItem({ ...editingItem, type: e.target.value as any })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400 font-bold transition-all">
                                        <option value="news">📰 خبر جديد</option>
                                        <option value="announcement">📣 إعلان أكاديمي</option>
                                        <option value="alert">⚠️ تنبيه هام</option>
                                        <option value="image">🖼️ صورة إعلانية</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">العنوان الرئيسي</label>
                                <input type="text" placeholder="عنوان جذاب..." value={editingItem.title || ''} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400 font-bold" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">المحتوى / الوصف</label>
                                <textarea placeholder="اكتب تفاصيل الإعلان هنا..." value={editingItem.content || ''} onChange={e => setEditingItem({ ...editingItem, content: e.target.value })} className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400 font-medium leading-relaxed" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">رابط الصورة (اختياري)</label>
                                <input type="text" placeholder="https://..." value={editingItem.imageUrl || ''} onChange={e => setEditingItem({ ...editingItem, imageUrl: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400 font-mono text-xs" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">نص الزر (CTA)</label>
                                    <input type="text" placeholder="مثلاً: ابدأ الآن" value={editingItem.ctaText || ''} onChange={e => setEditingItem({ ...editingItem, ctaText: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">رابط الزر</label>
                                    <input type="text" placeholder="رابط الصفحة..." value={editingItem.ctaLink || ''} onChange={e => setEditingItem({ ...editingItem, ctaLink: e.target.value as any })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/10 relative z-10">
                            <button onClick={handleSave} className="w-full bg-amber-400 text-black py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                                <Save size={20}/> اعتماد ونشر المحتوى
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContentManager;
