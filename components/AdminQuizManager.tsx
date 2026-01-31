import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, Question, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';
import { 
  PlusCircle, Edit, Trash2, X, Save, RefreshCw, BarChart, 
  Check, Award, MessageSquare, ExternalLink, FileText, 
  Image as ImageIcon, Download, Search, Clock, GraduationCap, 
  Layers, ShieldCheck, AlertCircle 
} from 'lucide-react';
import QuestionEditor from './QuestionEditor';
import katex from 'katex';

const AdminQuizManager: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [filterGrade, setFilterGrade] = useState<'all' | '10' | '11' | '12' | 'uni'>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const [viewingAttemptsFor, setViewingAttemptsFor] = useState<Quiz | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<StudentQuizAttempt[]>([]);
  const [reviewingAttempt, setReviewingAttempt] = useState<StudentQuizAttempt | null>(null);
  const [manualGrades, setManualGrades] = useState<Record<string, { awardedScore: number; feedback?: string }>>({});

  useEffect(() => {
    loadData();
  }, []);

  const filteredQuizzes = useMemo(() => {
    if (filterGrade === 'all') return quizzes;
    return quizzes.filter(q => q.grade === filterGrade);
  }, [quizzes, filterGrade]);

  const loadData = async () => {
    setIsLoading(true);
    const [quizData, questionData] = await Promise.all([
      // FIX: Property 'getQuizzesSupabase' does not exist on type 'DBService'.
      dbService.getQuizzes(),
      // FIX: Property 'getAllQuestionsSupabase' does not exist on type 'DBService'.
      dbService.getAllQuestions(),
    ]);
    setQuizzes(quizData);
    setAllQuestions(questionData);
    setIsLoading(false);
  };
  
  const handleViewAttempts = async (quiz: Quiz) => {
    setIsLoading(true);
    // FIX: Property 'getAttemptsForQuizSupabase' does not exist on type 'DBService'. Did you mean 'getAttemptsForQuiz'?
    const attempts = await dbService.getAttemptsForQuiz(quiz.id);
    setQuizAttempts(attempts);
    setViewingAttemptsFor(quiz);
    setIsLoading(false);
  };
  
  const handleReviewAttempt = (attempt: StudentQuizAttempt) => {
    const questionsForQuiz = allQuestions.filter(q => viewingAttemptsFor?.questionIds.includes(q.id));
    setQuizQuestions(questionsForQuiz);
    setReviewingAttempt(attempt);
    setManualGrades(attempt.manualGrades || {});
  };

  const handleSaveReview = async () => {
    if (!reviewingAttempt || !viewingAttemptsFor) return;
    
    const autoScore = quizQuestions.filter(q => q.type === 'mcq' && reviewingAttempt.answers[q.id] === q.correctChoiceId).reduce((sum: number, q: Question) => sum + Number(q.score || 0), 0);
    const manualScore = Object.values(manualGrades || {}).reduce((sum: number, grade: { awardedScore: number; feedback?: string }) => sum + (grade.awardedScore || 0), 0);
    const finalScore = autoScore + manualScore;

    const updatedAttempt: StudentQuizAttempt = {
        ...reviewingAttempt,
        score: finalScore,
        manualGrades,
        status: 'manually-graded',
    };

    setIsLoading(true);
    // FIX: Property 'updateAttemptSupabase' does not exist on type 'DBService'.
    await dbService.updateAttempt(updatedAttempt.id, updatedAttempt);
    
    await dbService.createNotification({
        userId: updatedAttempt.studentId,
        title: "تم تصحيح اختبارك!",
        message: `تم تصحيح اختبار "${viewingAttemptsFor.title}". نتيجتك النهائية هي ${finalScore}/${updatedAttempt.maxScore}.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'success',
        category: 'academic'
    });
    
    setQuizAttempts(prev => prev.map(a => a.id === updatedAttempt.id ? updatedAttempt : a));
    setReviewingAttempt(null);
    setIsLoading(false);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    const questionsForQuiz = allQuestions.filter(q => quiz.questionIds.includes(q.id));
    setQuizQuestions(questionsForQuiz);
  };

  const handleCreateNewQuiz = () => {
    setEditingQuiz({
      id: `quiz_${Date.now()}`, 
      title: '', 
      description: '', 
      grade: '12', 
      subject: 'Physics',
      category: 'اختبار تجريبي',
      questionIds: [], 
      duration: 30, 
      totalScore: 0, 
      isPremium: false,
    });
    setQuizQuestions([]);
  };

  const handleSaveQuiz = async () => {
    if (!editingQuiz || !editingQuiz.title) {
        alert("يرجى إدخال عنوان للاختبار.");
        return;
    }
    setIsLoading(true);
    const finalQuiz: Quiz = {
        ...editingQuiz,
        questionIds: quizQuestions.map(q => q.id),
        totalScore: quizQuestions.reduce((sum: number, q: Question) => sum + Number(q.score || 0), 0)
    } as Quiz;
    
    // FIX: Property 'saveQuizSupabase' does not exist on type 'DBService'.
    await dbService.saveQuiz(finalQuiz);
    setEditingQuiz(null);
    setQuizQuestions([]);
    await loadData();
    setIsLoading(false);
  };
  
  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
      // FIX: Property 'deleteQuizSupabase' does not exist on type 'DBService'.
      await dbService.deleteQuiz(quizId);
      await loadData();
    }
  };

  const handleSaveQuestion = async (question: Question) => {
    const isNew = !question.id || !allQuestions.some(q => q.id === question.id);
    // FIX: Property 'saveQuestionSupabase' does not exist on type 'DBService'.
    const savedQuestion = await dbService.saveQuestion(question);
    
    await loadData();
    
    setQuizQuestions(prev => {
        if(isNew) return [...prev, savedQuestion];
        return prev.map(q => q.id === savedQuestion.id ? savedQuestion : q);
    });

    setEditingQuestion(null);
  };
  
  const addQuestionToQuiz = (question: Question) => { if (!quizQuestions.some(q => q.id === question.id)) setQuizQuestions(prev => [...prev, question]); };
  const removeQuestionFromQuiz = (questionId: string) => setQuizQuestions(prev => prev.filter(q => q.id !== questionId));
  const renderMathText = (text: string) => { try { if (!text) return <div/>; const html = text.replace(/\$(.*?)\$/g, (match, math) => katex.renderToString(math, { throwOnError: false })); return <div dangerouslySetInnerHTML={{ __html: html }} />; } catch { return <div>{text}</div>; }};

  const renderAnswerContent = (answer: any) => {
    if (!answer) return <span className="text-gray-600 italic">لم تتم الإجابة</span>;
    const isUrl = typeof answer === 'string' && (answer.startsWith('http') || answer.includes('supabase.co'));
    if (isUrl) {
        const isImage = answer.match(/\.(jpeg|jpg|gif|png|webp)$/i) || answer.includes('image');
        return (
            <div className="mt-4 flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center gap-4 bg-blue-500/10 p-5 rounded-[25px] border border-blue-500/30">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center">
                        {isImage ? <ImageIcon size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">ملف مرفق من الطالب</p>
                        <p className="text-xs text-gray-400 truncate">{answer}</p>
                    </div>
                    <div className="flex gap-2">
                        <a href={answer} target="_blank" rel="noreferrer" className="p-3 bg-white text-black rounded-xl hover:scale-110 transition-all"><ExternalLink size={18} /></a>
                        <a href={answer} download className="p-3 bg-blue-600 text-white rounded-xl hover:scale-110 transition-all"><Download size={18} /></a>
                    </div>
                </div>
                {isImage && <img src={answer} alt="Student Solution" className="rounded-[30px] border-2 border-white/5 max-w-md shadow-2xl cursor-zoom-in" onClick={() => window.open(answer, '_blank')} />}
            </div>
        );
    }
    return <p className="text-lg text-cyan-200 mt-2 leading-loose whitespace-pre-wrap">"{answer}"</p>;
  };

  // --- واجهة المراجعة (Review Attempt) ---
  if (reviewingAttempt && viewingAttemptsFor) {
    return (
        <div className="animate-fadeIn font-['Tajawal'] text-right pb-20" dir="rtl">
            <button onClick={() => setReviewingAttempt(null)} className="flex items-center gap-2 px-6 py-3 mb-8 bg-white/5 text-white rounded-xl text-xs font-black border border-white/10">← العودة للقائمة</button>
            <div className="glass-panel p-8 md:p-14 rounded-[60px] border-white/5 bg-black/40">
                <header className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-10 gap-6">
                    <div>
                        <h3 className="text-3xl font-black text-white">مراجعة: <span className="text-[#fbbf24]">{reviewingAttempt.studentName}</span></h3>
                        <p className="text-gray-500 text-sm mt-2 italic">اختبار: {viewingAttemptsFor.title} • محاولة رقم {reviewingAttempt.attemptNumber}</p>
                    </div>
                    <div className="text-left bg-white/5 p-4 rounded-3xl border border-white/5 min-w-[200px]">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">وقت التسليم</p>
                        <p className="text-sm font-bold text-white tabular-nums">{new Date(reviewingAttempt.completedAt).toLocaleString('ar-KW')}</p>
                    </div>
                </header>
                <div className="space-y-12">
                    {quizQuestions.map((q, idx) => {
                      const userAnswer = reviewingAttempt.answers[q.id];
                      const gradeInfo = manualGrades[q.id] || { awardedScore: 0, feedback: '' };
                      return (
                        <div key={q.id} className="p-8 md:p-12 bg-black/60 rounded-[50px] border border-white/5">
                           <div className="flex items-start gap-6 mb-8">
                                <span className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-2xl text-[#fbbf24]">{idx+1}</span>
                                <div>
                                    <h4 className="text-2xl font-bold text-white leading-relaxed">{renderMathText(q.text)}</h4>
                                    <span className="inline-block mt-4 px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-gray-500 uppercase">{q.type} • الحد الأقصى: {q.score} pts</span>
                                </div>
                           </div>
                           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-10">
                                <div className="lg:col-span-7 space-y-6">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">إجابة الطالب:</label>
                                    <div className="bg-black/40 p-8 rounded-[40px] border-2 border-white/5 min-h-[150px] shadow-inner">{renderAnswerContent(userAnswer)}</div>
                                </div>
                                <div className="lg:col-span-5 space-y-8 bg-white/[0.02] p-8 rounded-[40px] border border-white/5">
                                    <label className="text-[10px] font-black text-[#fbbf24] uppercase tracking-widest block italic">التقييم والدرجة المستحقة:</label>
                                    <div className="space-y-6">
                                        <div className="relative">
                                            <input type="number" max={q.score} value={gradeInfo.awardedScore} onChange={e => setManualGrades({...manualGrades, [q.id]: {...gradeInfo, awardedScore: Math.min(q.score, Number(e.target.value)) }})} className="w-full bg-black/80 border-2 border-white/10 rounded-2xl px-8 py-6 text-white outline-none focus:border-[#fbbf24] font-black text-4xl tabular-nums text-center" />
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-black text-lg">/ {q.score}</span>
                                        </div>
                                        <textarea value={gradeInfo.feedback} onChange={e => setManualGrades({...manualGrades, [q.id]: {...gradeInfo, feedback: e.target.value }})} className="w-full bg-black/80 border border-white/10 rounded-2xl p-6 text-sm text-gray-300 outline-none focus:border-[#fbbf24] h-32" placeholder="أضف ملاحظاتك التصحيحية للطالب هنا..." />
                                    </div>
                                </div>
                           </div>
                        </div>
                      )
                    })}
                </div>
                <div className="mt-20 p-10 bg-[#fbbf24] rounded-[50px] flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl">
                    <div className="text-right">
                        <h4 className="text-3xl font-black text-black italic leading-none">اعتماد التصحيح النهائي</h4>
                        <p className="text-black/60 font-bold mt-2">سيتم إرسال إشعار فوري للطالب بالنتيجة والملاحظات.</p>
                    </div>
                    <button onClick={handleSaveReview} disabled={isLoading} className="w-full md:w-auto bg-black text-[#fbbf24] px-16 py-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4">
                        {isLoading ? <RefreshCw className="animate-spin" /> : <Save size={20}/>} حفظ المراجعة ونشر النتيجة
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // --- واجهة عرض المحاولات (View Attempts) ---
  if (viewingAttemptsFor) {
    return (
        <div className="animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white">سجل محاولات: <span className="text-[#fbbf24]">{viewingAttemptsFor.title}</span></h2>
                    <p className="text-gray-500 font-medium">{quizAttempts.length} محاولة تحتاج للمراجعة</p>
                </div>
                <button onClick={() => setViewingAttemptsFor(null)} className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-lg text-xs font-bold border border-white/10">عودة</button>
            </div>
            <div className="glass-panel p-6 rounded-[40px] border-white/5 bg-black/40 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="border-b border-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest"><tr><th className="p-6">اسم الطالب</th><th className="p-6 text-center">النتيجة</th><th className="p-6 text-center">الحالة</th><th className="p-6 text-center">الإجراء</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                        {quizAttempts.map(att => (
                            <tr key={att.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-6 font-bold text-white">{att.studentName}</td>
                                <td className="p-6 text-center font-mono font-black text-[#fbbf24] text-lg">{att.score} / {att.maxScore}</td>
                                <td className="p-6 text-center">
                                    <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase ${att.status === 'pending-review' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : att.status === 'manually-graded' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400'}`}>{att.status}</span>
                                </td>
                                <td className="p-6 text-center">
                                    <button onClick={() => handleReviewAttempt(att)} className="text-[10px] font-black bg-white text-black px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl uppercase">مراجعة وتصحيح</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {quizAttempts.length === 0 && <div className="text-center py-32 opacity-20"><Search size={48} className="mx-auto mb-4" /><p className="font-black text-lg uppercase tracking-widest">لا توجد محاولات لهذا الاختبار حالياً</p></div>}
            </div>
        </div>
    );
  }

  // --- واجهة إنشاء وتعديل الاختبار (Quiz Editor) ---
  if (editingQuiz) {
    return (
      <div className="animate-fadeIn font-['Tajawal'] text-right pb-20" dir="rtl">
        {editingQuestion && ( <QuestionEditor question={editingQuestion} onSave={handleSaveQuestion} onCancel={() => setEditingQuestion(null)} /> )}
        
        <header className="flex justify-between items-center mb-10">
           <div>
             <h2 className="text-4xl font-black text-white">{editingQuiz.id?.startsWith('quiz_') ? 'إنشاء اختبار جديد' : 'تعديل الاختبار'}</h2>
             <p className="text-gray-500 mt-2">إعداد العناوين، المحاولات، واختيار الأسئلة من البنك.</p>
           </div>
           <div className="flex gap-4">
              <button onClick={() => setEditingQuiz(null)} className="flex items-center gap-2 px-8 py-4 bg-white/5 text-white rounded-2xl text-xs font-black uppercase border border-white/10 hover:bg-white/10 transition-all">إلغاء</button>
              <button onClick={handleSaveQuiz} disabled={isLoading} className="flex items-center gap-2 px-8 py-4 bg-green-500 text-black rounded-2xl text-xs font-black uppercase shadow-lg hover:scale-105 transition-all">
                {isLoading ? <RefreshCw className="animate-spin"/> : <Save size={16}/>} حفظ ونشر الاختبار
              </button>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* الإعدادات العامة */}
            <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/40 space-y-6">
                    <h3 className="text-lg font-black text-[#fbbf24] border-r-4 border-[#fbbf24] pr-3">إعدادات عامة</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">عنوان الاختبار</label>
                            <input type="text" placeholder="عنوان الاختبار" value={editingQuiz.title || ''} onChange={e => setEditingQuiz({...editingQuiz, title: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#fbbf24]"/>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">الوصف</label>
                            <textarea placeholder="وصف موجز للاختبار" value={editingQuiz.description || ''} onChange={e => setEditingQuiz({...editingQuiz, description: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#fbbf24] h-24"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">الصف</label>
                                <select value={editingQuiz.grade} onChange={e => setEditingQuiz({...editingQuiz, grade: e.target.value as any})} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white outline-none">
                                    <option value="10">الصف 10</option>
                                    <option value="11">الصف 11</option>
                                    <option value="12">الصف 12</option>
                                    <option value="uni">جامعي</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">المدة (دقائق)</label>
                                <input type="number" value={editingQuiz.duration || 30} onChange={e => setEditingQuiz({...editingQuiz, duration: parseInt(e.target.value)})} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white outline-none"/>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-amber-400" size={18}/>
                                <span className="font-bold text-sm text-white">Premium Only؟</span>
                            </div>
                            <button onClick={() => setEditingQuiz({...editingQuiz, isPremium: !editingQuiz.isPremium})} className={`w-14 h-7 rounded-full p-1 transition-all ${editingQuiz.isPremium ? 'bg-amber-500' : 'bg-gray-700'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${editingQuiz.isPremium ? 'translate-x-7' : 'translate-x-0'}`}/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/40">
                    <h3 className="text-lg font-black text-[#00d2ff] border-r-4 border-[#00d2ff] pr-3 mb-6">إضافة من بنك الأسئلة</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                        {allQuestions.filter(q => q.grade === editingQuiz.grade).map(q => (
                            <div key={q.id} onClick={() => addQuestionToQuiz(q)} className="p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all flex justify-between items-start group">
                                <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-2">{q.text}</p>
                                <PlusCircle className="text-gray-600 group-hover:text-green-400 shrink-0" size={14}/>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* قائمة الأسئلة المضافة */}
            <div className="lg:col-span-8 glass-panel p-8 md:p-10 rounded-[50px] border-white/5 bg-[#0a1118]/80">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                    <h3 className="text-2xl font-black text-white">أسئلة الاختبار الحالي ({quizQuestions.length})</h3>
                    <button onClick={() => setEditingQuestion({ score: 5, grade: editingQuiz.grade as any, subject: editingQuiz.subject as any, unit: '', type: 'mcq', text: '' })} className="bg-green-500/10 text-green-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-green-500 hover:text-black transition-all">
                        <PlusCircle size={14}/> إنشاء سؤال جديد للبنك
                    </button>
                </div>

                <div className="space-y-4">
                    {quizQuestions.length > 0 ? quizQuestions.map((q, idx) => (
                        <div key={q.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-[30px] flex items-center justify-between group">
                            <div className="flex items-center gap-6">
                                <span className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center font-black text-gray-500">{idx+1}</span>
                                <div>
                                    <p className="text-gray-200 font-bold text-sm line-clamp-1">{q.text}</p>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-[9px] text-blue-400 font-black uppercase">{q.type}</span>
                                        <span className="text-[9px] text-amber-500 font-black uppercase">{q.score} pts</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingQuestion(q)} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"><Edit size={16}/></button>
                                <button onClick={() => removeQuestionFromQuiz(q.id)} className="p-3 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    )) : (
                        <div className="py-32 text-center opacity-20">
                            <Layers size={64} className="mx-auto mb-4" />
                            <p className="font-black text-xl uppercase tracking-widest">لا توجد أسئلة مضافة بعد</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- الواجهة الرئيسية (Dashboard View) ---
  return (
    <div className="animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">إدارة <span className="text-[#fbbf24]">الاختبارات وبنوك الأسئلة</span></h2>
            <p className="text-gray-500 font-medium mt-2">تحديث الاختبارات، مراجعة محاولات الطلاب، والتحكم في بنك الأسئلة المركزي.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={loadData} className="p-4 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all border border-white/10"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button>
            <button onClick={handleCreateNewQuiz} className="bg-[#fbbf24] text-black px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-2"><PlusCircle size={20} /> إنشاء اختبار جديد</button>
          </div>
      </header>
      
      <div className="bg-black/40 p-2 rounded-[25px] flex gap-2 border border-white/5 max-w-md mb-12">{(['all', '12', '11', '10', 'uni'] as const).map(g => (<button key={g} onClick={() => setFilterGrade(g)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterGrade === g ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>{g === 'all' ? 'الكل' : (g === 'uni' ? 'جامعي' : `صف ${g}`)}</button>))}</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredQuizzes.map(quiz => (
          <div key={quiz.id} className="glass-panel p-8 rounded-[50px] border border-white/5 flex flex-col hover:border-[#fbbf24]/30 transition-all group relative overflow-hidden bg-black/40">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-7xl pointer-events-none select-none italic font-black">QUIZ</div>
            <h3 className="font-black text-2xl mb-2 text-white group-hover:text-[#fbbf24] transition-colors">{quiz.title}</h3>
            <div className="flex gap-2 mb-6"><span className="text-[9px] bg-white/5 px-3 py-1 rounded-lg text-gray-500 font-black uppercase">الصف {quiz.grade}</span><span className="text-[9px] bg-[#fbbf24]/10 text-[#fbbf24] px-3 py-1 rounded-lg font-black uppercase">{quiz.subject}</span>{quiz.isPremium && <span className="text-[9px] bg-amber-500 text-black font-black px-3 py-1 rounded-lg uppercase">PREMIUM</span>}</div>
            <p className="text-xs text-gray-500 flex-1 mb-8 leading-relaxed italic line-clamp-2">"{quiz.description || 'لا يوجد وصف متاح لهذا الاختبار.'}"</p>
            <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-white/5">
                <button onClick={() => handleViewAttempts(quiz)} className="col-span-2 py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"><BarChart size={16}/> عرض ومراجعة المحاولات</button>
                <button onClick={() => handleEditQuiz(quiz)} className="flex-1 text-[9px] font-black py-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-all uppercase">تعديل</button>
                <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQuizManager;