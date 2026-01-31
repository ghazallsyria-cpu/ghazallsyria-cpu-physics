
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, LessonScene, StudentLessonProgress, Asset, StudentInteractionEvent } from '../types';
import { dbService } from '../services/db';
import { useAuth } from './ProtectedRoute';
import { RefreshCw, Lock, UploadCloud, FileText, CheckCircle2, AlertTriangle, X, BookOpen } from 'lucide-react';

const LessonPathViewer: React.FC<{ user: User }> = ({ user }) => {
    const { lessonId, sceneId } = useParams<{ lessonId: string; sceneId: string }>();
    const navigate = useNavigate();
    
    const [scene, setScene] = useState<LessonScene | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<Asset | null>(null);
    
    // State for adaptive learning
    const [pathHistory, setPathHistory] = useState<string[]>([]);
    const [showStruggleModal, setShowStruggleModal] = useState(false);

    const isSubscriber = user.subscription === 'premium' || user.role === 'admin' || user.role === 'teacher';

    useEffect(() => {
        if (!sceneId) return;
        
        // Adaptive learning logic
        const newHistory = [...pathHistory, sceneId];
        setPathHistory(newHistory);

        const lastThree = newHistory.slice(-3);
        if (lastThree.length === 3 && lastThree[0] === lastThree[1] && lastThree[1] === lastThree[2]) {
            setShowStruggleModal(true);
        } else {
            setShowStruggleModal(false);
        }

        const loadScene = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const sceneData = await dbService.getLessonScene(sceneId);
                if (!sceneData) throw new Error("المشهد غير موجود.");
                
                if (sceneData.is_premium && !isSubscriber) {
                    navigate('/subscription');
                    return;
                }
                
                setScene(sceneData);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadScene();

    }, [sceneId, user, navigate, isSubscriber]);

    const handleDecision = async (nextSceneId: string, decisionText: string) => {
        if (!lessonId || !sceneId) return;
        
        let fileAsset: Asset | null = uploadedFile;
        if (file && !uploadedFile) {
            setIsUploading(true);
            // FIX: Expected 1 arguments, but got 2.
            fileAsset = await dbService.uploadAsset(file);
            setIsUploading(false);
        }

        const progress: Partial<StudentLessonProgress> = {
            student_id: user.uid,
            lesson_id: lessonId,
            current_scene_id: nextSceneId,
            answers: { [sceneId]: decisionText },
            uploaded_files: fileAsset ? { [sceneId]: fileAsset } : {},
            updated_at: new Date().toISOString()
        };
        
        const interaction: StudentInteractionEvent = {
            student_id: user.uid,
            lesson_id: lessonId,
            from_scene_id: sceneId,
            to_scene_id: nextSceneId,
            decision_text: decisionText
        };
        
        try {
            await Promise.all([
                dbService.saveStudentLessonProgress(progress),
                dbService.logStudentInteraction(interaction)
            ]);
        } catch (e) {
            console.error("Failed to save progress or log interaction:", e);
            // Don't block navigation even if logging fails
        }

        navigate(`/lesson/${lessonId}/path/${nextSceneId}`);
    };

    if (isLoading) {
        return <div className="p-40 text-center animate-pulse"><RefreshCw className="animate-spin mx-auto text-amber-400" size={48} /></div>;
    }
    
    if (error) {
        return <div className="p-20 text-center text-red-500 font-bold">{error}</div>;
    }

    if (!scene) return null;

    return (
        <div className="max-w-4xl mx-auto py-12 animate-fadeIn" dir="rtl">
            <div className="glass-panel p-12 rounded-[50px] border-white/5 bg-black/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px]"></div>

                <h1 className="text-4xl font-black mb-8 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">{scene.title}</h1>
                <p className="text-lg text-gray-300 leading-relaxed mb-10 whitespace-pre-line">{scene.content.text}</p>
                
                {scene.content.imageUrl && <img src={scene.content.imageUrl} className="rounded-2xl mb-6 shadow-xl border border-white/5" />}
                {scene.content.videoUrl && <video src={scene.content.videoUrl} controls className="rounded-2xl mb-6 w-full shadow-xl" />}
                
                {scene.content.requiresUpload && (
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mb-8">
                        {uploadedFile ? (
                            <div className="flex items-center gap-3 text-green-400 font-bold">
                                <CheckCircle2 /> <span>تم رفع الملف: {uploadedFile.name}</span>
                            </div>
                        ) : (
                            <label className="flex items-center gap-3 cursor-pointer">
                                <UploadCloud />
                                <span className="font-bold">{file ? `الملف المحدد: ${file.name}` : 'ارفع ملفاً للمتابعة'}</span>
                                <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
                            </label>
                        )}
                    </div>
                )}

                <div className="pt-8 border-t border-white/10 space-y-4">
                    <h3 className="text-lg font-bold">ما هو قرارك؟</h3>
                    {scene.decisions.map((dec, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleDecision(dec.next_scene_id, dec.text)}
                            disabled={isUploading || (scene.content.requiresUpload && !file && !uploadedFile)}
                            className="w-full p-6 bg-blue-500/10 text-blue-300 rounded-2xl text-right font-black hover:bg-blue-500/20 disabled:opacity-50 transition-all border border-transparent hover:border-blue-500/30"
                        >
                            {dec.text}
                        </button>
                    ))}
                </div>
            </div>

            {/* Adaptive Learning Modal */}
            {showStruggleModal && (
                <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
                    <div className="glass-panel max-w-lg p-10 rounded-[40px] border border-amber-500/20 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-400">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4">يبدو أنك تواجه صعوبة</h3>
                        <p className="text-gray-400 mb-8">
                            لا بأس بذلك! هل تود مراجعة شرح الدرس الأساسي المتعلق بهذه النقطة قبل المتابعة؟
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowStruggleModal(false)} className="flex-1 py-4 bg-white/5 text-white rounded-xl font-bold text-sm">لا، سأستمر</button>
                            <button onClick={() => navigate('/curriculum')} className="flex-1 py-4 bg-amber-500 text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                <BookOpen size={16} /> نعم، أعدني للمنهج
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonPathViewer;
