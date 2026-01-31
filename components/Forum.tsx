import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ForumPost, ForumReply, ForumSection, Forum as ForumType, LoggingSettings } from '../types';
import { dbService } from '../services/db';
import { auth } from '../services/firebase';
import { 
  ArrowUp, 
  MessageSquare, 
  ChevronLeft, 
  Users, 
  Clock,
  ArrowRight,
  Pin,
  AlertCircle,
  Plus,
  RefreshCw,
  X,
  Send,
  Zap,
  Bell,
  ShieldCheck,
  UserCheck,
  Info,
  Hash,
  MessageCircle,
  Quote,
  Lock,
  EyeOff,
  Crown
} from 'lucide-react';

interface ForumProps {
  user: User | null;
}

const Forum: React.FC<ForumProps> = ({ user }) => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<ForumSection[]>([]);
  const [activeForum, setActiveForum] = useState<ForumType | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
  const [forumSettings, setForumSettings] = useState<LoggingSettings | null>(null);

  const isRealUser = useMemo(() => auth.currentUser !== null, [user]);

  // صلاحية الوصول الكامل (القراءة والمشاركة)
  const hasFullAccess = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'teacher') return true;
    if (forumSettings?.forumAccessTier === 'free') return true;
    return user.subscription === 'premium';
  }, [user, forumSettings]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [sectionsData, settingsData] = await Promise.all([
        dbService.getForumSections(),
        dbService.getLoggingSettings()
      ]);
      setSections(sectionsData);
      setForumSettings(settingsData);
    } catch (e) { console.error("Forum init failed", e); }
    finally { setIsLoading(false); }
  };

  const loadPosts = async (forumId: string) => {
    setIsLoading(true);
    try {
        const forumPosts = await dbService.getForumPosts(forumId);
        setPosts(forumPosts);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleForumClick = (forum: ForumType) => {
    setActiveForum(forum);
    loadPosts(forum.id);
  };

  const handleOpenAskModal = () => {
    if (!isRealUser) {
      alert("⚠️ للنشر في الساحة، يرجى تسجيل الدخول بحساب حقيقي.");
      return;
    }
    if (!hasFullAccess) {
      alert("🔒 عذراً، المشاركة في ساحة النقاش مخصصة للمشتركين في باقة التفوق.");
      return;
    }
    setShowAskModal(true);
  };

  const handleAsk = async () => {
    if (!user || !activeForum || !isRealUser || !hasFullAccess) return;
    setIsSubmitting(true);
    try {
      await dbService.createForumPost({
        authorUid: auth.currentUser?.uid || user.uid,
        authorEmail: user.email,
        authorName: user.name,
        title: newQuestion.title.trim(), 
        content: newQuestion.content.trim(),
        tags: [activeForum.id],
        upvotes: 0,
        replies: [],
        timestamp: new Date().toISOString(),
        isPinned: false,
        isEscalated: false
      });
      setShowAskModal(false);
      setNewQuestion({ title: '', content: '' });
      await loadPosts(activeForum.id);
    } catch (e) { alert("فشل النشر."); }
    finally { setIsSubmitting(false); }
  };

  const handleReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) return;
    if (!hasFullAccess) {
      alert("🔒 الردود مخصصة للمشتركين.");
      return;
    }
    setIsSubmitting(true);
    try {
      await dbService.addForumReply(selectedPost.id, {
        authorUid: auth.currentUser?.uid || user.uid,
        authorEmail: user.email,
        authorName: user.name,
        content: replyContent,
        role: user.role
      });
      setReplyContent('');
      const updatedPosts = await dbService.getForumPosts(activeForum!.id);
      const freshPost = updatedPosts.find(p => p.id === selectedPost.id);
      if (freshPost) {
          setSelectedPost(freshPost);
          setPosts(updatedPosts);
      }
    } catch (e) { alert("فشل إرسال الرد."); }
    finally { setIsSubmitting(false); }
  };

  // واجهة عرض الأقسام الرئيسية
  if (!activeForum) {
    return (
      <div className="max-w-6xl mx-auto py-12 animate-fadeIn text-right font-['Tajawal']" dir="rtl">
        <header className="mb-16 relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 blur-[80px] rounded-full"></div>
          <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none">
            ساحة <span className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">النقاش</span>
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-6">
              <p className="text-gray-500 text-xl font-medium flex items-center gap-3">
                <MessageCircle className="text-amber-400" size={24}/>
                تبادل المعرفة والأسئلة مع نخبة من المعلمين والزملاء.
              </p>
              {forumSettings?.forumAccessTier === 'premium' && (
                  <span className="bg-amber-400/10 text-amber-500 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-400/20 flex items-center gap-2">
                      <Lock size={12} /> محتوى مخصص للمتميزين
                  </span>
              )}
          </div>
        </header>

        {sections.map((section) => (
          <div key={section.id} className="mb-20">
             <div className="flex items-center gap-4 mb-8 border-r-4 border-amber-400 pr-6">
                <h3 className="text-3xl font-black text-white">{section.title}</h3>
                <span className="bg-white/5 px-4 py-1 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">{section.forums.length} منتدى</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {section.forums.map(forum => (
                  <div 
                    key={forum.id} 
                    onClick={() => handleForumClick(forum)} 
                    className="glass-panel p-8 rounded-[45px] border-white/5 hover:border-amber-400/40 cursor-pointer transition-all group relative overflow-hidden bg-black/40 hover:-translate-y-2 shadow-2xl"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-4xl group-hover:scale-110 group-hover:bg-amber-400 transition-all duration-500 group-hover:rotate-6">
                            {forum.icon}
                        </div>
                        {!hasFullAccess && forumSettings?.forumAccessTier === 'premium' && <Lock className="text-amber-400/50" size={20} />}
                    </div>
                    <h4 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors">{forum.title}</h4>
                    <p className="text-gray-500 text-sm mt-3 leading-relaxed line-clamp-2">{forum.description}</p>
                    
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase">
                           <Users size={14}/> {Math.floor(Math.random() * 100) + 10} نشط الآن
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-black transition-all">
                            <ChevronLeft size={20} />
                        </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        ))}
      </div>
    );
  }

  // واجهة عرض المنشورات
  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-24 text-right font-['Tajawal']" dir="rtl">
      {/* Navigation Header */}
      <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-8">
        <button onClick={() => { setActiveForum(null); setSelectedPost(null); }} className="flex items-center gap-3 text-gray-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all group bg-white/5 px-6 py-3 rounded-2xl"> 
          <ArrowRight className="group-hover:translate-x-2 transition-transform" /> العودة للأقسام 
        </button>
        <div className="text-right">
          <h2 className="text-4xl font-black text-white flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center text-black text-xl">{activeForum.icon}</span>
            {activeForum.title}
          </h2>
          <p className="text-gray-500 italic mt-2 pr-16">{activeForum.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Post Feed */}
        <div className={`lg:col-span-8 space-y-6 ${selectedPost ? 'hidden md:block' : 'block'}`}>
          <div className="flex justify-between items-center bg-black/40 p-5 rounded-[35px] border border-white/5 backdrop-blur-xl">
             <div className="flex gap-3">
                <button onClick={() => setSortBy('newest')} className={`px-8 py-2.5 rounded-2xl text-[10px] font-black transition-all ${sortBy === 'newest' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>الأحدث</button>
                <button onClick={() => setSortBy('top')} className={`px-8 py-2.5 rounded-2xl text-[10px] font-black transition-all ${sortBy === 'top' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>الأكثر تفاعلاً</button>
             </div>
             <button 
                onClick={handleOpenAskModal} 
                className={`px-10 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 hover:scale-105 transition-all shadow-[0_10px_30px_rgba(251,191,36,0.2)] ${!hasFullAccess ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-amber-400 text-black'}`}
             >
                {!hasFullAccess ? <Lock size={18}/> : <Plus size={18}/>} طرح سؤال
             </button>
          </div>

          <div className="space-y-6">
            {posts.map(post => (
              <div 
                key={post.id} 
                onClick={() => setSelectedPost(post)} 
                className={`glass-panel p-8 rounded-[45px] border-2 cursor-pointer transition-all flex gap-8 group relative overflow-hidden ${selectedPost?.id === post.id ? 'border-amber-400 bg-amber-400/5 shadow-[0_0_50px_rgba(251,191,36,0.1)]' : 'border-white/5 bg-black/20 hover:border-white/20'}`}
              >
                {/* Overlay for locked posts */}
                {!hasFullAccess && (
                    <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-amber-400 text-black px-6 py-2 rounded-full font-black text-[10px] uppercase flex items-center gap-2 shadow-2xl">
                             <Crown size={14} /> اشترك لرؤية المحتوى
                         </div>
                    </div>
                )}

                <div className="flex flex-col items-center gap-2 bg-white/5 p-4 rounded-[25px] h-fit min-w-[70px] border border-white/5 shadow-inner">
                  <ArrowUp size={24} className="text-gray-500 group-hover:text-amber-400 transition-colors" />
                  <span className="font-black text-2xl text-white">{post.upvotes || 0}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                     {post.isPinned && <Pin size={16} className="text-amber-400 fill-amber-400" />}
                     <h3 className={`text-2xl font-black text-white group-hover:text-amber-400 transition-colors truncate ${!hasFullAccess ? 'blur-[2px]' : ''}`}>{post.title}</h3>
                  </div>
                  <p className={`text-gray-500 line-clamp-2 text-sm leading-relaxed mb-6 font-medium ${!hasFullAccess ? 'blur-[4px] select-none' : ''}`}>
                    {hasFullAccess ? `"${post.content}"` : "هذا المحتوى مخصص لمشتركي باقة التفوق، يرجى الترقية لتتمكن من القراءة والمشاركة في هذا النقاش العلمي الهام."}
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-black text-gray-600 uppercase tracking-widest border-t border-white/5 pt-5">
                    <span className="flex items-center gap-2">
                       <span className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400">👤</span>
                       {post.authorName} • <Clock size={12}/> {new Date(post.timestamp).toLocaleDateString('ar-KW')}
                    </span>
                    <span className="flex items-center gap-2 text-blue-400 bg-blue-400/10 px-3 py-1 rounded-lg">
                      <MessageSquare size={12}/> {post.replies?.length || 0} ردود
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post Detail Panel */}
        <div className={`lg:col-span-12 space-y-8 ${selectedPost ? 'block' : 'hidden'}`}>
          {selectedPost && (
            <div className="animate-slideUp space-y-10">
              {/* Locked Detail Message */}
              {!hasFullAccess ? (
                  <div className="glass-panel p-16 md:p-24 rounded-[60px] border-amber-400/30 bg-[#0a1118]/90 text-center relative overflow-hidden shadow-3xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[100px]"></div>
                      <button onClick={() => setSelectedPost(null)} className="absolute top-10 left-10 p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all text-white">
                        <X size={24}/>
                      </button>
                      
                      <div className="w-24 h-24 bg-amber-400/10 border-2 border-amber-400/20 rounded-[40px] flex items-center justify-center mx-auto mb-10 text-amber-400 animate-float shadow-[0_0_50px_rgba(251,191,36,0.2)]">
                         <Lock size={48} />
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black text-white mb-6">محتوى <span className="text-amber-400 italic">حصري</span></h2>
                      <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                         لقد وضع المدير قيوداً على هذا القسم لتكون المشاركة فيه مقتصرة على المشتركين في **باقة التفوق (Premium)** فقط.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <button 
                            onClick={() => navigate('/subscription')}
                            className="bg-amber-400 text-black px-12 py-5 rounded-[30px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                            <Crown size={20}/> اشترك وفعل حسابك الآن
                        </button>
                        <button 
                            onClick={() => setSelectedPost(null)}
                            className="bg-white/5 border border-white/10 text-white px-10 py-5 rounded-[30px] font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            العودة للخلف
                        </button>
                      </div>
                  </div>
              ) : (
                <>
                  <div className="glass-panel p-10 md:p-16 rounded-[60px] border-white/10 bg-[#0a1118]/80 shadow-3xl border-2 relative">
                    <button onClick={() => setSelectedPost(null)} className="absolute top-10 left-10 p-3 bg-white/5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-all">
                      <X size={24}/>
                    </button>
                    
                    <div className="max-w-4xl">
                      <div className="flex items-center gap-4 mb-8">
                         <span className="bg-amber-400/10 text-amber-400 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-400/20">سؤال فيزيائي</span>
                         <span className="text-gray-500 text-xs font-bold flex items-center gap-2"><Clock size={14}/> نُشر في {new Date(selectedPost.timestamp).toLocaleString('ar-KW')}</span>
                      </div>
                      
                      <h1 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">{selectedPost.title}</h1>
                      
                      <div className="flex items-start gap-6 bg-white/[0.02] p-10 rounded-[40px] border border-white/5 mb-12 shadow-inner">
                         <Quote className="text-amber-400 shrink-0 opacity-20" size={48} />
                         <p className="text-2xl md:text-3xl text-gray-300 leading-relaxed font-medium italic">{selectedPost.content}</p>
                      </div>

                      <div className="flex items-center gap-4 p-5 bg-blue-500/5 rounded-3xl border border-blue-500/10 w-fit">
                         <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xl">
                            {selectedPost.authorName.charAt(0)}
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">كاتب الموضوع</p>
                            <p className="text-xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">{selectedPost.authorName}</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Replies Section */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 px-6">
                       <h4 className="text-2xl font-black text-white italic">منصة <span className="text-blue-400">الردود العلمية</span></h4>
                       <div className="h-px flex-1 bg-white/5"></div>
                       <span className="bg-white/5 px-4 py-1 rounded-full text-xs font-bold text-gray-500">{selectedPost.replies?.length || 0} رد</span>
                    </div>

                    <div className="space-y-6">
                      {selectedPost.replies?.map((reply, idx) => {
                        const isAuthor = reply.authorUid === selectedPost.authorUid;
                        const isTeacher = reply.role === 'teacher' || reply.role === 'admin';
                        
                        return (
                          <div key={reply.id} className={`p-8 md:p-12 rounded-[50px] border-2 transition-all animate-slideUp relative ${isTeacher ? 'bg-amber-400/5 border-amber-400/20' : 'bg-white/[0.02] border-white/5'}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                              <div className="flex items-center gap-4">
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${isTeacher ? 'bg-amber-400 text-black' : isAuthor ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                    {isTeacher ? <ShieldCheck /> : isAuthor ? <UserCheck /> : reply.authorName.charAt(0)}
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-3">
                                       <p className={`text-2xl font-black ${isTeacher ? 'text-amber-400' : isAuthor ? 'text-blue-400' : 'text-white'}`}>
                                         {reply.authorName}
                                       </p>
                                       {isTeacher && <span className="bg-amber-400 text-black text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">معلم معتمد</span>}
                                       {isAuthor && <span className="bg-blue-500/10 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">صاحب السؤال</span>}
                                    </div>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-2"><Clock size={12}/> {new Date(reply.timestamp).toLocaleString('ar-KW')}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-gray-500"><ArrowUp size={18}/></button>
                                 <span className="px-4 py-2 bg-white/5 rounded-xl text-xs font-black text-gray-400">#{idx + 1}</span>
                              </div>
                            </div>

                            <div className="pr-18">
                               <p className="text-2xl md:text-3xl text-gray-200 leading-relaxed font-bold">
                                  {reply.content}
                                </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Reply Box */}
                    <div className="glass-panel p-10 rounded-[50px] border-white/10 bg-black/60 shadow-2xl mt-12 border-2">
                       <div className="flex items-center gap-4 mb-8">
                          <Zap className="text-amber-400 animate-pulse" />
                          <h5 className="text-xl font-black text-white">أضف بصمتك العلمية في النقاش</h5>
                       </div>
                       <textarea 
                          value={replyContent} 
                          onChange={e => setReplyContent(e.target.value)} 
                          placeholder="اكتب ردك العلمي هنا بوضوح..."
                          className="w-full bg-black/40 border-2 border-white/10 rounded-[35px] p-8 text-xl text-white outline-none focus:border-amber-400 h-48 transition-all shadow-inner placeholder:text-gray-700" 
                       />
                       <div className="mt-8 flex justify-end">
                          <button 
                              onClick={handleReply} 
                              disabled={!replyContent.trim() || isSubmitting} 
                              className="bg-amber-400 text-black px-16 py-6 rounded-full font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-[0_20px_50px_rgba(251,191,36,0.3)]"
                          >
                            {isSubmitting ? <RefreshCw className="animate-spin" size={20}/> : <Send size={20}/>} إرسال الرد الآن
                          </button>
                       </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Post Question */}
      {showAskModal && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowAskModal(false)}>
          <div className="glass-panel w-full max-w-2xl p-12 md:p-16 rounded-[70px] border-white/10 relative shadow-3xl bg-[#0a1118] border-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAskModal(false)} className="absolute top-10 left-10 text-gray-500 hover:text-white p-3 bg-white/5 rounded-full"><X size={24}/></button>
            <div className="mb-12">
                <span className="bg-amber-500/10 text-amber-500 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">شاركنا تساؤلاتك</span>
                <h3 className="text-4xl font-black mt-6 text-white leading-tight">سؤال جديد في <span className="text-amber-400">{activeForum.title}</span></h3>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-6">ما هو عنوان سؤالك؟</label>
                <input type="text" value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[25px] px-8 py-6 text-white outline-none focus:border-amber-400 font-bold text-xl shadow-inner" placeholder="مثلاً: استفسار حول قانون لنز..." />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-6">اشرح استفسارك بالتفصيل</label>
                <textarea value={newQuestion.content} onChange={e => setNewQuestion({...newQuestion, content: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[25px] p-8 text-white outline-none focus:border-amber-400 h-56 leading-relaxed italic text-lg shadow-inner" placeholder="اكتب سؤالك هنا بصيغة علمية واضحة..." />
              </div>
              
              <button 
                onClick={handleAsk} 
                disabled={isSubmitting || !newQuestion.title.trim() || !newQuestion.content.trim()} 
                className="w-full py-7 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 text-xl bg-amber-400 text-black hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={24}/> : <Zap size={24}/>} نشر السؤال في الساحة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;