import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ForumPost } from '../types';
import { dbService } from '../services/db';
import { AlertTriangle, ChevronsRight, RefreshCw } from 'lucide-react';

const EscalatedPostsWidget: React.FC = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const allPosts = await dbService.getForumPosts();
            const escalated = allPosts.filter(p => p.isEscalated && p.isEscalated === true);
            setPosts(escalated);
        } catch (e) {
            console.error("Failed to load escalated posts", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="glass-panel p-8 rounded-[40px] border-red-500/20 bg-red-500/5 text-center animate-pulse">
                <RefreshCw className="w-8 h-8 text-red-400 animate-spin mx-auto" />
                <p className="text-xs font-bold text-red-400/70 mt-2">جاري البحث عن تنبيهات...</p>
            </div>
        );
    }
    
    if (posts.length === 0) {
        return null; // لا تظهر أي شيء إذا لم تكن هناك منشورات مصعدة
    }

    return (
        <div className="glass-panel p-8 rounded-[40px] border-red-500/20 bg-red-500/5 animate-slideUp">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="text-red-400 animate-pulse" />
                    <h3 className="text-xl font-black text-white">منشورات مصعّدة للمراجعة</h3>
                </div>
                <button onClick={loadData} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="space-y-4 max-h-64 overflow-y-auto no-scrollbar pr-2">
                {posts.map(post => (
                    <div key={post.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center group">
                        <div>
                            <p className="font-bold text-sm text-white truncate group-hover:text-red-400 transition-colors">{post.title}</p>
                            <p className="text-[10px] text-gray-500 font-mono">بواسطة: {post.authorName}</p>
                        </div>
                        <button onClick={() => navigate('/discussions')} className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                            مراجعة <ChevronsRight size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EscalatedPostsWidget;