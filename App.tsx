
import React, { useState, useEffect, Suspense, lazy, createContext } from 'react';
import { Routes, Route, Outlet, useNavigate, useLocation, Navigate, NavLink } from 'react-router-dom';
import { User, AppBranding, MaintenanceSettings, ViewState } from './types';
import { dbService } from './services/db';
import { supabase } from './services/supabase';
import ProtectedRoute, { AuthContext } from './components/ProtectedRoute';
import { Bell, ArrowRight, Menu, RefreshCw, LayoutDashboard, ShieldAlert, Database } from 'lucide-react';

// Core Components
import Sidebar from './components/Sidebar';
import PWAPrompt from './components/PWAPrompt';
import NotificationPanel from './components/NotificationPanel';
import MaintenanceMode from './components/MaintenanceMode';
import FloatingNav from './components/FloatingNav';
import LandingPage from './components/LandingPage'; 
import Auth from './components/Auth'; 

// Lazy-loaded Components
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const AiTutor = lazy(() => import('./components/PhysicsChat'));
const CurriculumBrowser = lazy(() => import('./components/CurriculumBrowser'));
const LessonViewer = lazy(() => import('./components/LessonViewer'));
const QuizCenter = lazy(() => import('./components/QuizCenter'));
const QuizPlayer = lazy(() => import('./components/QuizPlayer'));
const AttemptReview = lazy(() => import('./components/AttemptReview'));
const BillingCenter = lazy(() => import('./components/BillingCenter'));
const Forum = lazy(() => import('./components/Forum'));
const AdminCurriculumManager = lazy(() => import('./components/AdminCurriculumManager'));
const AdminStudentManager = lazy(() => import('./components/AdminStudentManager'));
const InteractiveLessonBuilder = lazy(() => import('./components/InteractiveLessonBuilder'));
const PhysicsJourneyMap = lazy(() => import('./components/PhysicsJourneyMap'));
const UniversalLesson = lazy(() => import('./components/UniversalLesson'));
const AdminQuizManager = lazy(() => import('./components/AdminQuizManager'));
const AdminLabManager = lazy(() => import('./components/AdminLabManager'));
const AdminRecommendationManager = lazy(() => import('./components/AdminRecommendationManager'));
const AdminContentManager = lazy(() => import('./components/AdminContentManager'));
const AdminPaymentManager = lazy(() => import('./components/AdminPaymentManager'));
const AdminTeacherManager = lazy(() => import('./components/AdminTeacherManager'));
const AdminManager = lazy(() => import('./components/AdminManager'));
const AdminForumManager = lazy(() => import('./components/AdminForumManager'));
const AdminForumPostManager = lazy(() => import('./components/AdminForumPostManager'));
const FirestoreRulesFixer = lazy(() => import('./components/FirestoreRulesFixer'));
const AdminLiveSessions = lazy(() => import('./components/AdminLiveSessions'));
const AdminAssetManager = lazy(() => import('./components/AdminAssetManager'));
const AdminSettings = lazy(() => import('./components/AdminSettings'));
const LabHub = lazy(() => import('./components/LabHub'));
const LessonPathViewer = lazy(() => import('./components/LessonPathViewer'));
const LessonPathBuilder = lazy(() => import('./components/LessonPathBuilder'));
const AdminAnalytics = lazy(() => import('./components/AdminAnalytics'));
const MarketingBrochure = lazy(() => import('./components/MarketingBrochure'));
const AdminBrochureManager = lazy(() => import('./components/AdminBrochureManager'));

const AppLayout: React.FC<{ user: User; branding: AppBranding; onLogout: () => void; }> = ({ user, branding, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#0A2540] text-right font-['Tajawal'] flex flex-col lg:flex-row relative overflow-hidden" dir="rtl">
            <Sidebar 
                user={user} 
                branding={branding}
                onLogout={onLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 lg:mr-72`}>
                <header className="sticky top-0 z-[100] bg-[#0A2540]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center shadow-2xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-white bg-white/5 rounded-2xl"><Menu size={24} /></button>
                        {location.pathname !== '/dashboard' && !location.pathname.startsWith('/admin') && (
                             <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-[20px] transition-all border border-white/10 group">
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                <span className="font-bold text-sm">رجوع</span>
                            </button>
                        )}
                    </div>
                </header>
                <main className={`flex-1 w-full max-w-screen-2xl mx-auto overflow-x-hidden relative p-4 md:p-8 lg:p-12`}>
                    <Suspense fallback={<div className="flex flex-col items-center justify-center h-[50vh] gap-4"><RefreshCw className="w-12 h-12 text-amber-400 animate-spin" /></div>}>
                        <Outlet /> 
                    </Suspense>
                    {user?.role === 'student' && <FloatingNav />}
                </main>
            </div>
            <PWAPrompt user={user} logoUrl={branding.logoUrl} />
        </div>
    );
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [branding] = useState<AppBranding>({ logoUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063206.png', appName: 'المركز السوري للعلوم' });
    const [schemaError, setSchemaError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSession = async (session: any) => {
        if (session?.user) {
            // محاولة جلب ملف المستخدم
            let userProfile = await dbService.getUser(session.user.id);

            // إصلاح مشكلة Google Auth: إذا تم الدخول ولكن لم يتم إنشاء الملف الشخصي بعد
            // نقوم بإنشائه يدوياً من التطبيق لضمان العمل
            if (!userProfile) {
                const { user } = session;
                const newProfile: User = {
                    uid: user.id,
                    email: user.email!,
                    name: user.user_metadata.full_name || user.user_metadata.name || 'مستخدم جديد',
                    photoURL: user.user_metadata.avatar_url || user.user_metadata.picture,
                    phone: user.user_metadata.phone,
                    role: 'student',
                    grade: '12', 
                    subscription: 'free',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    progress: { completedLessonIds: [], points: 0, achievements: [] }
                };
                
                try {
                    await dbService.saveUser(newProfile);
                    userProfile = newProfile;
                } catch (e: any) {
                    console.error("Failed to auto-create profile for OAuth user", e);
                    // Check for missing table error
                    if (e.message?.includes("Could not find the table") || e.message?.includes("relation \"public.profiles\" does not exist")) {
                        setSchemaError(true);
                        setIsAuthLoading(false);
                        return;
                    }
                }
            }

            // الاشتراك في التحديثات
            dbService.subscribeToUser(session.user.id, (updatedUser) => {
                setUser(updatedUser || userProfile);
                setIsAuthLoading(false);
            });
        } else {
            setUser(null);
            setIsAuthLoading(false);
        }
    };

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        navigate(loggedInUser.role === 'admin' || loggedInUser.role === 'teacher' ? '/admin/dashboard' : '/dashboard');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        navigate('/login');
    };

    if (schemaError) {
        return (
            <div className="min-h-screen bg-[#0A2540] flex flex-col items-center justify-center p-6 text-right font-['Tajawal']" dir="rtl">
                <div className="max-w-4xl w-full animate-fadeIn">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[30px] mb-8 flex items-center gap-4 text-amber-400">
                        <Database size={32} />
                        <div>
                            <h2 className="text-xl font-black">قاعدة البيانات غير مهيأة</h2>
                            <p className="text-sm">لم يتم العثور على الجداول المطلوبة في Supabase. يرجى تشغيل كود التهيئة أدناه.</p>
                        </div>
                    </div>
                    <Suspense fallback={<div className="text-center text-white">جاري تحميل أداة التهيئة...</div>}>
                        <FirestoreRulesFixer />
                    </Suspense>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-8 w-full bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} /> تحديث الصفحة بعد تشغيل الكود
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, isLoading: isAuthLoading }}>
            <Routes>
                <Route path="/" element={<LandingPage onStart={() => navigate(user ? '/dashboard' : '/login')} />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth onLogin={handleLogin} onBack={() => navigate('/')} />} />
                <Route path="/brochure" element={<MarketingBrochure />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout user={user!} branding={branding} onLogout={handleLogout} />}>
                        <Route path="/dashboard" element={
                            user?.role === 'admin' ? <AdminDashboard /> :
                            user?.role === 'teacher' ? <TeacherDashboard user={user} /> :
                            <StudentDashboard user={user!} />
                        } />
                        <Route path="/curriculum" element={<CurriculumBrowser user={user!} subject="Physics" />} />
                        <Route path="/lesson/:lessonId" element={<LessonViewer user={user!} />} />
                        <Route path="/lesson/:lessonId/path/:sceneId" element={<LessonPathViewer user={user!} />} />
                        <Route path="/quiz-center" element={<QuizCenter user={user!} />} />
                        <Route path="/quiz/:quizId" element={<QuizPlayer user={user!} onFinish={() => navigate('/quiz-center')} />} />
                        <Route path="/review/:attemptId" element={<AttemptReview user={user!} />} />
                        <Route path="/discussions" element={<Forum user={user} />} />
                        <Route path="/ai-chat" element={<AiTutor grade={user?.grade || '12'} subject="Physics" />} />
                        <Route path="/subscription" element={<BillingCenter user={user!} onUpdateUser={setUser} />} />
                        <Route path="/journey-map" element={<PhysicsJourneyMap user={user!} />} />
                        <Route path="/template-demo" element={<UniversalLesson onBack={() => navigate('/dashboard')} />} />
                        <Route path="/lab-hub" element={<LabHub user={user!} />} />
                    </Route>
                </Route>
                
                <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
                     <Route path="/admin" element={<AppLayout user={user!} branding={branding} onLogout={handleLogout} />}>
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="curriculum" element={<AdminCurriculumManager />} />
                        <Route path="students" element={<AdminStudentManager />} />
                        <Route path="quizzes" element={<AdminQuizManager />} />
                        <Route path="labs" element={<AdminLabManager />} />
                        <Route path="recommendations" element={<AdminRecommendationManager />} />
                        <Route path="content" element={<AdminContentManager />} />
                        <Route path="brochure" element={<AdminBrochureManager />} />
                        <Route path="payment-manager" element={<AdminPaymentManager />} />
                        <Route path="teachers" element={<AdminTeacherManager />} />
                        <Route path="managers" element={<AdminManager />} />
                        <Route path="forums" element={<AdminForumManager />} />
                        <Route path="forum-posts" element={<AdminForumPostManager />} />
                        <Route path="security-fix" element={<FirestoreRulesFixer />} />
                        <Route path="live-sessions" element={<AdminLiveSessions />} />
                        <Route path="assets" element={<AdminAssetManager />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="lesson/:lessonId/analytics" element={<AdminAnalytics />} />
                    </Route>
                    <Route path="/lesson-builder" element={<InteractiveLessonBuilder />} />
                    <Route path="/lesson-builder/:lessonId" element={<InteractiveLessonBuilder />} />
                    <Route path="/admin/lesson/:lessonId/path-builder" element={<LessonPathBuilder />} />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </AuthContext.Provider>
    );
};

export default App;
