
import React, { useState, useEffect } from 'react';
import { PhysicsExperiment } from '../types';
import { dbService } from '../services/db';
import { Plus, Trash2, Edit, Save, X, RefreshCw, FlaskConical, Code, Monitor, GraduationCap, ImageIcon } from 'lucide-react';

const AdminLabManager: React.FC = () => {
    const [experiments, setExperiments] = useState<PhysicsExperiment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingExp, setEditingExp] = useState<Partial<PhysicsExperiment> | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await dbService.getExperiments();
            setExperiments(data);
        } catch (e) {}
        finally { setIsLoading(false); }
    };

    const handleSave = async () => {
        if (!editingExp?.title || !editingExp?.customHtml) {
            alert("يرجى تعبئة العنوان وكود الـ HTML الخاص بالتجربة.");
            return;
        }
        setIsLoading(true);
        try {
            await dbService.saveExperiment(editingExp);
            setEditingExp(null);
            await loadData();
            setMessage("تم حفظ المختبر بنجاح!");
        } catch (e) {}
        finally { setIsLoading(false); setTimeout(() => setMessage(null), 3000); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه التجربة؟")) return;
        await dbService.deleteExperiment(id);
        await loadData();
    };

    return (
        <div className="max-w-7xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="mb-12 border-r-4 border-[#00d2ff] pr-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
                        <FlaskConical className="text-[#00d2ff]" size={32} /> إدارة <span className="text-[#00d2ff]">المختبرات التفاعلية</span>
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">إضافة تجارب فيزيائية ذكية باستخدام أكواد HTML5 أو محاكيات Phet.</p>
                </div>
                <button onClick={() => setEditingExp({ title: '', description: '', thumbnail: '', grade: '12', type: 'CUSTOM_HTML', customHtml: '', isFutureLab: false })} className="bg-[#00d2ff] text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-3">
                    <Plus size={20} /> إضافة تجربة جديدة
                </button>
            </header>

            {message && <div className="mb-6 p-4 bg-green-500/10 text-green-400 rounded-2xl text-xs font-bold text-center border border-green-500/20">{message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? (
                    <div className="col-span-full py-40 text-center animate-pulse"><RefreshCw className="animate-spin text-[#00d2ff] mx-auto" /></div>
                ) : experiments.map(exp => (
                    <div key={exp.id} className="glass-panel p-8 rounded-[45px] border border-white/5 bg-black/40 group relative overflow-hidden flex flex-col">
                        <div className="h-40 rounded-3xl overflow-hidden mb-6 bg-white/5 border border-white/10">
                            {exp.thumbnail ? <img src={exp.thumbnail} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><ImageIcon size={48}/></div>}
                        </div>
                        <h3 className="text-2xl font-black text-white group-hover:text-[#00d2ff] transition-colors mb-2">{exp.title}</h3>
                        <p className="text-gray-500 text-xs line-clamp-2 italic flex-1">"{exp.description}"</p>
                        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                            <span className="bg-white/5 px-4 py-1 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">صف {exp.grade}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingExp(exp)} className="p-3 bg-white/5 rounded-xl text-blue-400 hover:bg-white/10 transition-all"><Edit size={18}/></button>
                                <button onClick={() => handleDelete(exp.id)} className="p-3 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 transition-all"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editingExp && (
                <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-[#0a1118] border border-white/10 w-full max-w-4xl rounded-[60px] p-10 relative shadow-3xl flex flex-col max-h-[90vh]">
                        <button onClick={() => setEditingExp(null)} className="absolute top-10 left-10 p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">✕</button>
                        <h3 className="text-3xl font-black text-white mb-10 flex items-center gap-4 italic"><Monitor className="text-[#00d2ff]"/> تصميم المختبر التفاعلي</h3>
                        
                        <div className="flex-1 overflow-y-auto no-scrollbar pr-4 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">اسم التجربة</label>
                                    <input type="text" value={editingExp.title} onChange={e => setEditingExp({...editingExp, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#00d2ff] font-bold" placeholder="مثال: محاكاة قانون هوك" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">الصف الدراسي المستهدف</label>
                                    <select value={editingExp.grade} onChange={e => setEditingExp({...editingExp, grade: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold">
                                        <option value="10">الصف العاشر</option>
                                        <option value="11">الحادي عشر</option>
                                        <option value="12">الثاني عشر</option>
                                        <option value="uni">جامعي</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">وصف مختصر</label>
                                <input type="text" value={editingExp.description} onChange={e => setEditingExp({...editingExp, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#00d2ff]" placeholder="ماذا سيتعلم الطالب من هذه التجربة؟" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4 flex items-center gap-2"><Code size={14} className="text-[#00d2ff]"/> كود HTML للمحاكاة (أو رابط Iframe)</label>
                                <textarea value={editingExp.customHtml} onChange={e => setEditingExp({...editingExp, customHtml: e.target.value})} className="w-full h-64 bg-black/60 border border-white/10 rounded-3xl p-6 text-emerald-400 font-mono text-xs ltr text-left outline-none focus:border-[#00d2ff] shadow-inner" placeholder="<iframe src='...' /> or <div id='lab'></div><script>...</script>" />
                                <p className="text-[9px] text-gray-600 mr-4 italic">يمكنك لصق كود Embed الخاص بـ Phet Simulations أو كتابة كود JS مخصص.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">رابط صورة الغلاف (Thumbnail)</label>
                                <input type="text" value={editingExp.thumbnail} onChange={e => setEditingExp({...editingExp, thumbnail: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-xs" placeholder="https://..." />
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/10">
                            <button onClick={handleSave} className="w-full bg-amber-400 text-black py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                                <Save size={20} className="inline mr-2" /> حفظ ونشر المختبر فوراً
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLabManager;
