
import React, { useState, useEffect } from 'react';
import { ForumPost } from '../types';
import { dbService } from '../services/db';
import { Trash2, Pin, ShieldAlert, CheckCircle, Search, RefreshCw, MessageSquare, AlertTriangle, User, Clock, ChevronLeft } from 'lucide-react';

const AdminForumPostManager: React.FC = () => {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setIsLoading(true);
        try {
            const allPosts = await dbService.getForumPosts();
            setPosts(allPosts);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المنشور نهائياً؟')) return;
        try {
            await dbService.deleteForumPost(postId);
            setPosts(posts.filter(p => p.id !== postId));
            setMessage({ text: 'تم الحذف بنجاح.', type: 'success' });
        } catch (e) {
            setMessage({ text: 'فشل الحذف.', type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const togglePin = async (post: ForumPost) => {
        try {
            await dbService.updateForumPost(post.id, { isPinned: !post.isPinned });
            setPosts(posts.map(p => p.id === post.id ? { ...p, isPinned: !p.isPinned } : p));
        } catch (e) { console.error(e); }
    };

    const toggleEscalation = async (post: ForumPost) => {
        try {
            await dbService.updateForumPost(post.id, { isEscalated: !post.isEscalated });
            setPosts(posts.map(p => p.id === post.id ? { ...p, isEscalated: !p.isEscalated } : p));
        } catch (e) { console.error(e); }
    };

    const filteredPosts = posts.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="mb-12 border-r-4 border-[#fbbf24] pr-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
                        <ShieldAlert className="text-[#fbbf24]" size={32} /> مركز <span className="text-[#fbbf24]">الرقابة الأكاديمية</span>
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">مراجعة منشورات الطلاب، حذف المحتوى المخالف، وإدارة التنبيهات.</p>
                </div>
                <button onClick={loadPosts} className="p-4 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all">
                    <RefreshCw className={isLoading ? 'animate-spin' : ''} />
                </button>
            </header>

            {message && <div className={`mb-8 p-5 rounded-3xl text-sm font-bold border flex items-center gap-3 animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}> {message.text} </div>}

            <div className="relative mb-10">
                <Search className="absolute top-1/2 right-6 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                    type="text" 
                    placeholder="ابحث بالعنوان أو اسم الطالب..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-[25px] pr-16 pl-6 py-5 text-white outline-none focus:border-[#fbbf24] font-bold shadow-inner"
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {isLoading ? (
                    <div className="py-40 text-center animate-pulse text-gray-500">جاري جلب المنشورات من السحابة...</div>
                ) : filteredPosts.length > 0 ? filteredPosts.map(post => (
                    <div key={post.id} className={`glass-panel p-8 rounded-[40px] border-2 transition-all flex flex-col md:flex-row justify-between gap-8 group ${post.isEscalated ? 'border-red-500/30 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'border-white/5 bg-black/20 hover:border-white/20'}`}>
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                                {post.isPinned && <Pin size={16} className="text-[#fbbf24] fill-[#fbbf24]" />}
                                {post.isEscalated && <AlertTriangle size={18} className="text-red-500 animate-pulse" />}
                                <h3 className="text-2xl font-black text-white group-hover:text-[#fbbf24] transition-colors">{post.title}</h3>
                            </div>
                            <p className="text-gray-400 text-sm italic line-clamp-2 leading-relaxed">"{post.content}"</p>
                            <div className="flex flex-wrap gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest pt-4 border-t border-white/5">
                                <span className="flex items-center gap-2"><User size={12}/> {post.authorName}</span>
                                <span className="flex items-center gap-2"><Clock size={12}/> {new Date(post.timestamp).toLocaleString('ar-KW')}</span>
                                <span className="flex items-center gap-2 text-blue-400"><MessageSquare size={12}/> {post.replies?.length || 0} ردود</span>
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">{post.tags[0]}</span>
                            </div>
                        </div>
                        <div className="flex flex-row md:flex-col gap-3 justify-center shrink-0">
                            <button onClick={() => togglePin(post)} className={`p-4 rounded-2xl transition-all ${post.isPinned ? 'bg-[#fbbf24] text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5 text-gray-500 hover:text-white'}`} title="تثبيت المنشور">
                                <Pin size={20} fill={post.isPinned ? 'currentColor' : 'none'} />
                            </button>
                            <button onClick={() => toggleEscalation(post)} className={`p-4 rounded-2xl transition-all ${post.isEscalated ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-gray-500 hover:text-white'}`} title="تصعيد للمراجعة العاجلة">
                                <AlertTriangle size={20} />
                            </button>
                            <button onClick={() => handleDelete(post.id)} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl" title="حذف نهائي">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="py-40 text-center glass-panel rounded-[60px] border-dashed border-white/10 opacity-30">
                        <MessageSquare size={64} className="mx-auto mb-6 text-gray-600" />
                        <p className="font-black text-xl uppercase tracking-widest">لا توجد منشورات مطابقة للبحث.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminForumPostManager;
