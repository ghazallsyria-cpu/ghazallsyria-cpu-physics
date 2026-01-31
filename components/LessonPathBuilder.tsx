import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lesson, LessonScene } from '../types';
import { dbService } from '../services/db';
import { Waypoints, Plus, Trash2, Edit, Save, X, RefreshCw, Layers, BrainCircuit, Zap, Link as LinkIcon, Image, Upload } from 'lucide-react';

const LessonPathBuilder: React.FC = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [scenes, setScenes] = useState<LessonScene[]>([]);
    const [selectedScene, setSelectedScene] = useState<LessonScene | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!lessonId) return;
        loadData();
    }, [lessonId]);
    
    const loadData = async () => {
        if (!lessonId) return;
        setIsLoading(true);
        try {
            const [scenesData, lessonData] = await Promise.all([
                dbService.getLessonScenesForBuilder(lessonId),
                // FIX: Property 'getLessonSupabase' does not exist on type 'DBService'.
                dbService.getLesson(lessonId)
            ]);
            setScenes(scenesData);
            setLesson(lessonData);
        } catch (e) { console.error("Failed to load data:", e); }
        finally { setIsLoading(false); }
    };

    const handleSelectScene = (scene: LessonScene) => setSelectedScene(scene);
    
    const handleAddNewScene = () => {
        if (!lessonId) return;
        const newScene: LessonScene = {
            id: `scene_${Date.now()}`, // Temporary ID
            lesson_id: lessonId,
            title: 'مشهد جديد',
            content: { text: '' },
            decisions: [],
            is_premium: false,
        };
        setSelectedScene(newScene);
    };

    const handleSaveScene = async () => {
        if (!selectedScene) return;
        setIsLoading(true);
        try {
            await dbService.saveLessonScene(selectedScene);
            await loadData();
        } catch (e) { console.error("Save error:", e); }
        finally { setIsLoading(false); }
    };
    
    const handleDeleteScene = async (sceneId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا المشهد؟")) return;
        setIsLoading(true);
        try {
            await dbService.deleteLessonScene(sceneId);
            setSelectedScene(null);
            await loadData();
        } catch (e) { console.error("Delete error:", e); }
        finally { setIsLoading(false); }
    };

    const updateSelectedScene = (field: keyof LessonScene, value: any) => {
        if (selectedScene) setSelectedScene({ ...selectedScene, [field]: value });
    };

    const handleSetAsStartScene = async (sceneId: string) => {
        if (!lessonId) return;
        try {
            await dbService.updateLesson(lessonId, { pathRootSceneId: sceneId });
            setLesson(prev => prev ? {...prev, pathRootSceneId: sceneId} : null);
        } catch (e) {
            console.error("Failed to set start scene", e);
        }
    };

    return (
        <div className="flex h-screen bg-[#0A2540] font-['Tajawal'] text-white" dir="rtl">
            {/* Sidebar */}
            <aside className="w-80 bg-black/20 border-l border-white/5 flex flex-col p-6">
                <button onClick={() => navigate('/admin/curriculum')} className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-2 mb-6">
                    <X size={16}/> العودة لإدارة المناهج
                </button>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white">مشاهد الدرس</h2>
                    <button onClick={handleAddNewScene} className="p-2 bg-[#fbbf24] text-black rounded-lg hover:scale-110 transition-transform"><Plus size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
                    {scenes.map(scene => {
                        const isStartScene = lesson?.pathRootSceneId === scene.id;
                        return (
                            <div key={scene.id} onClick={() => handleSelectScene(scene)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedScene?.id === scene.id ? 'border-[#fbbf24] bg-[#fbbf24]/10' : 'border-transparent bg-white/5 hover:bg-white/10'}`}>
                                <div>
                                    <p className="font-bold text-sm truncate">{scene.title}</p>
                                    <span className="text-xs text-gray-500 font-mono">#{scene.id.substring(0, 8)}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleSetAsStartScene(scene.id); }} className={`p-2 rounded-full transition-colors ${isStartScene ? 'text-amber-400' : 'text-gray-600 hover:text-amber-300'}`} title="تعيين كمشهد بداية">
                                    <Zap size={16} fill={isStartScene ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                        )
                    })}
                </div>
            </aside>

            {/* Main Editor */}
            <main className="flex-1 p-8 overflow-y-auto no-scrollbar">
                {selectedScene ? (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="flex justify-between items-center">
                            <input type="text" value={selectedScene.title} onChange={e => updateSelectedScene('title', e.target.value)} className="text-3xl font-black bg-transparent outline-none w-full focus:border-b border-dashed border-[#fbbf24] transition-all" />
                            <div className="flex gap-3">
                                <button onClick={handleSaveScene} className="px-6 py-3 bg-green-500 text-black rounded-xl font-bold text-xs flex items-center gap-2"><Save size={14}/> حفظ</button>
                                <button onClick={() => handleDeleteScene(selectedScene.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Trash2 size={16}/></button>
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-sm font-bold text-gray-400 mb-4">محتوى المشهد</h3>
                            <textarea value={selectedScene.content?.text || ''} onChange={e => updateSelectedScene('content', {...selectedScene.content, text: e.target.value})} className="w-full h-40 bg-black/40 p-4 rounded-lg text-sm" />
                            <div className="grid grid-cols-2 gap-4 mt-4">
                               <input type="text" placeholder="رابط صورة..." value={selectedScene.content?.imageUrl || ''} onChange={e => updateSelectedScene('content', {...selectedScene.content, imageUrl: e.target.value})} className="bg-black/40 p-2 rounded-lg text-xs" />
                               <input type="text" placeholder="رابط فيديو..." value={selectedScene.content?.videoUrl || ''} onChange={e => updateSelectedScene('content', {...selectedScene.content, videoUrl: e.target.value})} className="bg-black/40 p-2 rounded-lg text-xs" />
                            </div>
                        </div>

                        {/* Decisions Editor */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h3 className="text-sm font-bold text-gray-400 mb-4">قرارات الطالب</h3>
                            <div className="space-y-4">
                                {selectedScene.decisions?.map((dec, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                                        <input type="text" placeholder="نص الزر..." value={dec.text} onChange={e => {
                                            const newDecs = [...(selectedScene.decisions || [])];
                                            newDecs[idx].text = e.target.value;
                                            updateSelectedScene('decisions', newDecs);
                                        }} className="flex-1 bg-black/40 p-2 rounded text-xs"/>
                                        <span className="text-xs">»</span>
                                        <select value={dec.next_scene_id} onChange={e => {
                                            const newDecs = [...(selectedScene.decisions || [])];
                                            newDecs[idx].next_scene_id = e.target.value;
                                            updateSelectedScene('decisions', newDecs);
                                        }} className="flex-1 bg-black/40 p-2 rounded text-xs">
                                            <option value="">اختر المشهد التالي...</option>
                                            {scenes.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                        </select>
                                        <button onClick={() => {
                                             const newDecs = (selectedScene.decisions || []).filter((_, i) => i !== idx);
                                             updateSelectedScene('decisions', newDecs);
                                        }} className="p-1 text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                                <button onClick={() => updateSelectedScene('decisions', [...(selectedScene.decisions || []), {text: '', next_scene_id: ''}])} className="text-xs text-green-400">+ قرار جديد</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50">
                        <Waypoints size={64} className="mb-4" />
                        <h2 className="text-xl font-bold">محرر المسارات التفاعلية</h2>
                        <p>اختر مشهداً من القائمة للبدء، أو أنشئ مشهداً جديداً.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LessonPathBuilder;