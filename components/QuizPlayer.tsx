import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Quiz, Question, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';
import { UploadCloud, Check, X, ArrowRight, ArrowLeft, AlertTriangle, Loader2, FileIcon, ExternalLink, RefreshCw } from 'lucide-react';
import katex from 'katex';

interface QuizPlayerProps {
  user: User;
  onFinish: () => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ user, onFinish }) => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [uploadingQuestions, setUploadingQuestions] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [finalAttempt, setFinalAttempt] = useState<StudentQuizAttempt | null>(null);

  useEffect(() => {
    if (!quizId) {
        setIsLoading(false);
        return;
    };

    const loadQuizData = async () => {
      setIsLoading(true);
      // FIX: Property 'getQuizWithQuestionsSupabase' does not exist on type 'DBService'. Did you mean 'getQuizWithQuestions'?
      const data = await dbService.getQuizWithQuestions(quizId);
      if (data) {
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setTimeLeft(data.quiz.duration * 60);
      }
      setIsLoading(false);
    };
    loadQuizData();
  }, [quizId]);

  useEffect(() => {
    if (!isFinished && timeLeft > 0 && !isLoading && quiz) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isFinished, timeLeft, isLoading, quiz]);

  const handleFileUpload = async (questionId: string, file: File) => {
    if (!file) return;
    setUploadingQuestions(prev => ({ ...prev, [questionId]: true }));
    try {
      // FIX: Expected 1 arguments, but got 2.
      const asset = await dbService.uploadAsset(file); // Use Supabase
      if (asset && asset.url) {
        setUserAnswers(prev => ({ ...prev, [questionId]: asset.url }));
      } else {
        throw new Error("لم يتم استلام رابط صالح من السحابة.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("فشل رفع الملف. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
    } finally {
      setUploadingQuestions(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSubmit = async () => {
    if (isFinished || !quiz) return;
    
    const isStillUploading = Object.values(uploadingQuestions).some(val => val === true);
    if (isStillUploading) {
        alert("يرجى الانتظار حتى اكتمال رفع ملفات الإجابة بنسبة 100%.");
        return;
    }

    setIsFinished(true);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    // FIX: Property 'getUserAttemptsSupabase' does not exist on type 'DBService'.
    const userAttempts = await dbService.getUserAttempts(user.uid, quiz.id);

    const attempt: StudentQuizAttempt = {
      id: '', // Will be set by Supabase
      studentId: user.uid,
      studentName: user.name,
      quizId: quiz.id,
      score: 0, 
      totalQuestions: questions.length,
      maxScore: quiz.totalScore || questions.reduce((s, q) => s + q.score, 0),
      completedAt: new Date().toISOString(),
      answers: userAnswers,
      timeSpent: timeSpent,
      attemptNumber: userAttempts.length + 1,
      status: 'pending-review',
    };

    // FIX: Property 'saveAttemptSupabase' does not exist on type 'DBService'.
    const savedAttempt = await dbService.saveAttempt(attempt);
    setFinalAttempt(savedAttempt);
    
    await dbService.createNotification({
        userId: user.uid,
        title: "تم تسليم الاختبار",
        message: `تم استلام إجاباتك بنجاح لاختبار "${quiz.title}".`,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'success',
        category: 'academic'
    });
  };

  const renderMathText = (text: string) => {
    try {
      if (!text) return <div></div>;
      const html = text.replace(/\$(.*?)\$/g, (match, math) => katex.renderToString(math, { throwOnError: false }));
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <div>{text}</div>;
    }
  };

  if (isLoading) {
    return <div className="fixed inset-0 bg-[#0A2540] flex items-center justify-center text-white font-bold animate-pulse"><RefreshCw className="animate-spin mr-4" /> جاري تحضير الاختبار...</div>;
  }
  
  if (!isLoading && (!quiz || questions.length === 0)) {
    return (
        <div className="fixed inset-0 bg-[#0A2540] flex flex-col items-center justify-center text-white text-center p-8 font-['Tajawal']" dir="rtl">
            <div className="glass-panel p-12 rounded-[50px] border-red-500/20 bg-red-500/5">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
                <h2 className="text-3xl font-black mb-4">خطأ تقني</h2>
                <p className="text-gray-400 mb-8">عذراً، لم نتمكن من العثور على هذا الاختبار. قد يكون قد تم حذفه.</p>
                <button onClick={onFinish} className="bg-red-500 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">العودة</button>
            </div>
        </div>
    );
  }
  
  if(isFinished && finalAttempt) {
    return (
        <div className="min-h-screen bg-geometric-pattern p-4 md:p-10 font-['Tajawal'] text-white flex items-center justify-center" dir="rtl">
            <div className="max-w-2xl mx-auto">
                <div className="glass-panel p-10 md:p-16 rounded-[60px] border-white/5 bg-black/40 text-center animate-fadeIn">
                    <div className="w-24 h-24 bg-green-500/10 border-2 border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 text-5xl shadow-[0_0_30px_rgba(34,197,94,0.2)]">✓</div>
                    <h2 className="text-4xl font-black mb-4">تم الإرسال بنجاح!</h2>
                    <p className="text-gray-400 mb-10 max-w-md mx-auto text-lg italic">تم حفظ إجاباتك ومرفقاتك في السحابة. سيقوم المعلم بمراجعة الحل اليدوي قريباً.</p>
                    <button onClick={onFinish} className="bg-[#fbbf24] text-black px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">العودة لمركز الاختبارات</button>
                </div>
            </div>
        </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-[#0A2540] flex flex-col font-['Tajawal'] text-white overflow-y-auto no-scrollbar" dir="rtl">
        <header className="sticky top-0 z-20 bg-[#0A2540]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold truncate max-w-[200px] md:max-w-none">{quiz.title}</h2>
            <div className="flex items-center gap-4 md:gap-8">
                <div className={`text-xl md:text-3xl font-mono font-black tabular-nums ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-[#00d2ff]'}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <div className="hidden md:block w-48 h-2 bg-white/10 rounded-full">
                    <div className="h-full bg-[#fbbf24] rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
            </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12">
            <div className="w-full max-w-4xl">
                <div className="glass-panel p-6 md:p-12 rounded-[50px] border-white/10 mb-10 shadow-2xl min-h-[300px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-9xl pointer-events-none select-none italic font-black">SSC</div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">السؤال {currentIndex + 1} • {currentQuestion.score} درجات</p>
                    <div className="text-2xl md:text-3xl font-bold leading-relaxed mb-12 text-right">{renderMathText(currentQuestion.text)}</div>
                    
                    <div className="space-y-4">
                        {currentQuestion.type === 'mcq' && currentQuestion.choices?.map((choice) => (
                            <button key={choice.id} onClick={() => setUserAnswers({...userAnswers, [currentQuestion.id]: choice.id})} className={`w-full text-right p-6 rounded-2xl border-2 transition-all flex justify-between items-center ${userAnswers[currentQuestion.id] === choice.id ? 'bg-[#fbbf24]/10 border-[#fbbf24] text-[#fbbf24]' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                                <span className="font-bold text-lg">{choice.text}</span>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${userAnswers[currentQuestion.id] === choice.id ? 'border-[#fbbf24]' : 'border-white/10'}`}>
                                    {userAnswers[currentQuestion.id] === choice.id && <div className="w-3 h-3 bg-[#fbbf24] rounded-full"></div>}
                                </div>
                            </button>
                        ))}

                         {currentQuestion.type === 'file_upload' && (
                            <div className={`p-8 md:p-12 border-4 border-dashed rounded-[40px] transition-all flex flex-col items-center justify-center text-center ${userAnswers[currentQuestion.id] ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                                {uploadingQuestions[currentQuestion.id] ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <Loader2 className="w-16 h-16 text-[#fbbf24] animate-spin" />
                                        <div>
                                            <p className="text-[#fbbf24] font-black text-lg uppercase tracking-widest">جاري الرفع...</p>
                                            <p className="text-gray-500 text-xs mt-1">يتم تأمين ملفك في الخادم السحابي.</p>
                                        </div>
                                    </div>
                                ) : userAnswers[currentQuestion.id] ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-20 h-20 bg-green-500 text-black rounded-3xl flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(34,197,94,0.3)]">✓</div>
                                        <div>
                                            <p className="text-white font-black text-xl mb-1">تم الرفع بنجاح!</p>
                                            <div className="flex items-center gap-2 justify-center mb-4">
                                                <FileIcon size={14} className="text-gray-500" />
                                                <a href={userAnswers[currentQuestion.id]} target="_blank" rel="noreferrer" className="text-blue-400 text-[10px] font-bold underline flex items-center gap-1">معاينة الملف المرفوع <ExternalLink size={10}/></a>
                                            </div>
                                            <button onClick={() => setUserAnswers(prev => ({...prev, [currentQuestion.id]: undefined}))} className="text-red-400 text-xs font-bold hover:underline bg-red-500/10 px-4 py-2 rounded-xl">إزالة ورفع ملف جديد</button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer group flex flex-col items-center w-full">
                                        <div className="w-24 h-24 bg-white/5 rounded-[30px] flex items-center justify-center text-gray-500 mb-6 group-hover:bg-[#fbbf24]/10 group-hover:text-[#fbbf24] transition-all group-hover:scale-110">
                                            <UploadCloud size={48}/>
                                        </div>
                                        <p className="text-xl font-bold text-gray-400 group-hover:text-white transition-colors">اضغط لرفع صورة الحل أو ملف PDF</p>
                                        <p className="text-xs text-gray-600 mt-4 font-medium max-w-xs leading-relaxed italic">يرجى الانتظار حتى تظهر علامة "✓" الخضراء قبل الانتقال للسؤال التالي.</p>
                                        <input type="file" className="hidden" onChange={(e) => e.target.files && handleFileUpload(currentQuestion.id, e.target.files[0])}/>
                                    </label>
                                )}
                            </div>
                         )}

                         {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
                            <div className="space-y-4">
                                <textarea
                                    value={userAnswers[currentQuestion.id] || ''}
                                    onChange={e => setUserAnswers({...userAnswers, [currentQuestion.id]: e.target.value})}
                                    placeholder="اكتب إجابتك التفصيلية هنا..."
                                    className="w-full h-48 bg-black/40 border-2 border-white/5 rounded-[30px] p-6 text-white outline-none focus:border-[#fbbf24] text-lg leading-relaxed placeholder:text-gray-700"
                                />
                                <p className="text-[10px] text-gray-600 italic">سيتم تصحيح هذا السؤال يدوياً من قبل المعلم.</p>
                            </div>
                         )}
                    </div>
                </div>

                <div className="flex justify-between items-center px-4 mb-10">
                    <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="flex items-center gap-3 text-gray-500 font-black text-xs uppercase tracking-widest disabled:opacity-20 hover:text-white transition-colors group">
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> السابق
                    </button>
                    {currentIndex === questions.length - 1 ? (
                        <button onClick={handleSubmit} disabled={Object.values(uploadingQuestions).some(v => v)} className="bg-emerald-500 text-black px-12 py-5 rounded-[25px] font-black text-xs uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50">إنهاء وتسليم</button>
                    ) : (
                        <button onClick={() => setCurrentIndex(p => Math.min(questions.length - 1, p + 1))} className="flex items-center gap-3 text-[#fbbf24] font-black text-xs uppercase tracking-widest hover:translate-x-[-5px] transition-all group">
                            التالي <ArrowLeft size={20} className="group-hover:translate-x-[-5px] transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </main>
    </div>
  );
};

export default QuizPlayer;