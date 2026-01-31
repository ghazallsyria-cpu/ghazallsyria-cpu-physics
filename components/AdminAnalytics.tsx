import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dbService } from '../services/db';
import { Lesson, LessonAnalyticsData, StudentInteractionEvent } from '../types';
import { BarChart3, Users, Clock, Eye, RefreshCw, AlertTriangle, BrainCircuit } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminAnalytics: React.FC = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [analytics, setAnalytics] = useState<LessonAnalyticsData | null>(null);
// FIX: Added state to track the number of AI help requests for the new analytics card.
    const [aiRequests, setAiRequests] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!lessonId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [lessonData, analyticsData] = await Promise.all([
                    // FIX: Property 'getLessonSupabase' does not exist on type 'DBService'.
                    dbService.getLesson(lessonId),
                    dbService.getLessonAnalytics(lessonId)
                ]);
                setLesson(lessonData);
                setAnalytics(analyticsData);
// FIX: Initialized the AI help request count from the fetched analytics data.
                setAiRequests(analyticsData.ai_help_requests || 0);
            } catch (e) {
                console.error("Failed to load analytics", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

// FIX: The real-time subscription now refetches analytics and updates all metrics, including the new AI help request count.
        const subscription = dbService.subscribeToLessonInteractions(lessonId, (payload) => {
            console.log("Real-time update received!", payload);
            // Refetch analytics to get updated aggregates
            dbService.getLessonAnalytics(lessonId!).then(data => {
                setAnalytics(data);
                setAiRequests(data.ai_help_requests || 0);
            });
        });

        return () => {
            subscription.unsubscribe();
        };

    }, [lessonId]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } },
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa', font: { size: 10 } } }
        }
    };

    const sceneVisitsData = {
        labels: analytics?.scene_visits.map(v => v.title.substring(0, 15) + '...') || [],
        datasets: [{
            label: 'Visits',
            data: analytics?.scene_visits.map(v => v.visit_count) || [],
            backgroundColor: 'rgba(0, 210, 255, 0.6)',
            borderColor: 'rgba(0, 210, 255, 1)',
            borderWidth: 1,
        }]
    };

    return (
        <div className="space-y-10 animate-fadeIn font-['Tajawal'] text-right pb-20" dir="rtl">
            <header>
                <h2 className="text-4xl font-black text-white italic">
                    التحليلات المباشرة: <span className="text-green-400">{lesson?.title}</span>
                </h2>
                <p className="text-gray-500 mt-2 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    متصل بقناة البيانات اللحظية
                </p>
            </header>

            {isLoading ? (
                <div className="py-32 text-center"><RefreshCw className="animate-spin mx-auto text-green-400" /></div>
            ) : !analytics || (analytics.scene_visits.length === 0 && analytics.decision_counts.length === 0) ? (
                 <div className="py-32 text-center glass-panel rounded-[50px] border-dashed border-white/10 opacity-50">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-bold">لا توجد بيانات تفاعل لهذا الدرس بعد.</h3>
                 </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20 text-center">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">إجمالي الطلاب</h3>
                                <p className="text-5xl font-black text-white">{new Set(analytics.live_events.map(e => e.student_id)).size}</p>
                            </div>
                            {/* FIX: Added a new analytics card to display the real-time count of AI help requests. */}
                             <div className="glass-panel p-8 rounded-[40px] border-purple-500/20 bg-purple-500/5 text-center">
                                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2"><BrainCircuit size={16}/> طلبات مساعدة AI</h3>
                                <p className="text-5xl font-black text-white">{aiRequests}</p>
                            </div>
                        </div>

                        <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Eye /> المشاهد الأكثر زيارة</h3>
                            <div className="h-96">
                                <Bar options={chartOptions} data={sceneVisitsData} />
                            </div>
                        </div>
                        <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20">
                            <h3 className="text-xl font-bold mb-6">مسارات القرارات الشائعة</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-500 uppercase">
                                        <tr>
                                            <th className="p-2 text-right">من مشهد</th>
                                            <th className="p-2 text-right">القرار</th>
                                            <th className="p-2 text-center">عدد المرات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {analytics.decision_counts.map((d, i) => (
                                        <tr key={i} className="border-t border-white/5">
                                            <td className="p-3 font-bold">{analytics.scene_visits.find(s=>s.scene_id === d.from_scene_id)?.title || '...'}</td>
                                            <td className="p-3 text-green-400 italic">"{d.decision_text}"</td>
                                            <td className="p-3 text-center font-mono text-lg">{d.choice_count}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-4">
                         <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20 sticky top-10">
                            <h3 className="text-xl font-bold mb-6">البث المباشر للأحداث</h3>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar">
                                {analytics.live_events.map(event => (
                                    <div key={event.id} className="p-4 bg-white/5 rounded-2xl animate-fadeIn text-xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-bold text-green-400">{event.student_name}</p>
                                            <p className="text-gray-500 font-mono">{new Date(event.created_at!).toLocaleTimeString()}</p>
                                        </div>
                                        <p className="text-gray-400">قرر: <span className="italic">"{event.decision_text}"</span></p>
                                    </div>
                                ))}
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnalytics;