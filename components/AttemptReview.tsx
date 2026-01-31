import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, StudentQuizAttempt, Quiz, Question } from '../types';
import { dbService } from '../services/db';
import katex from 'katex';
import { X, Check, MessageSquare, Award, RefreshCw, AlertTriangle } from 'lucide-react';

interface AttemptReviewProps {
  user: User;
}

const AttemptReview: React.FC<AttemptReviewProps> = ({ user }) => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<StudentQuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!attemptId || !user) {
        setIsLoading(false);
        return;
    };

    const loadData = async () => {
      setIsLoading(true);
      
      // FIX: Property 'getAttemptByIdSupabase' does not exist on type 'DBService'.
      const attemptData = await dbService.getAttemptById(attemptId);
      
      if (!attemptData) {
        setIsLoading(false);
        return;
      }
      setAttempt(attemptData);
      
      // FIX: Property 'getQuizWithQuestionsSupabase' does not exist on type 'DBService'. Did you mean 'getQuizWithQuestions'?
      const quizAndQuestionsData = await dbService.getQuizWithQuestions(attemptData.quizId);

      if (quizAndQuestionsData) {
        setQuiz(quizAndQuestionsData.quiz);
        setQuestions(quizAndQuestionsData.questions);
      }
      
      setIsLoading(false);
    };
    loadData();
  }, [attemptId, user]);
  
  const finalScore = useMemo(() => {
    if (!attempt) return 0;
    if (attempt.status === 'manually-graded') {
      const autoScore = questions.filter(q => q.type === 'mcq' && attempt.answers[q.id] === q.correctChoiceId).reduce((sum: number, q: Question) => sum + Number(q.score || 0), 0);
      const manualScore = Object.values(attempt.manualGrades || {}).reduce((sum: number, grade: { awardedScore: number; feedback?: string }) => sum + (grade.awardedScore || 0), 0);
      return autoScore + manualScore;
    }
    return attempt.score;
  }, [attempt, questions]);

  const renderMathText = (text: string) => {
    try {
      if (!text) return <div />;
      const html = text.replace(/\$(.*?)\$/g, (match, math) => katex.renderToString(math, { throwOnError: false }));
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <div>{text}</div>;
    }
  };

  if (isLoading) {
    return <div className="fixed inset-0 bg-[#0A2540] flex items-center justify-center text-white font-bold animate-pulse"><RefreshCw className="animate-spin mr-4" /> جاري تحميل المراجعة...</div>;
  }
  
  if (!attempt || !quiz) {
      return (
          <div className="fixed inset-0 bg-[#0A2540] flex items-center justify-center text-white font-bold p-8 text-center">
             <div className="glass-panel p-12 rounded-[50px] border-red-500/20 bg-red-500/5">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
                <h2 className="text-3xl font-black mb-4">خطأ</h2>
                <p className="text-gray-400 mb-8">لم يتم العثور على سجل هذه المحاولة.</p>
                <button onClick={() => navigate('/quiz-center')} className="bg-red-500 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">العودة</button>
            </div>
          </div>
      );
  }
  
  return (
    <div className="min-h-screen bg-geometric-pattern p-4 md:p-10 font-['Tajawal'] text-white" dir="rtl">
        <div className="max-w-4xl mx-auto">
            <div className="glass-panel p-10 md:p-16 rounded-[60px] border-white/5 bg-black/40 text-center mb-8">
                <h2 className="text-4xl font-black mb-4">مراجعة محاولة: {quiz.title}</h2>
                <p className="text-8xl font-black text-[#fbbf24] mb-4 tabular-nums">{finalScore} / {attempt.maxScore}</p>
            </div>

            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-center">مراجعة الإجابات</h3>
                {questions.map((q, idx) => {
                    const userAnswer = attempt.answers[q.id];
                    const manualGrade = attempt.manualGrades?.[q.id];

                    return (
                        <div key={q.id} className={`glass-panel p-8 rounded-[40px] border-2 border-white/5`}>
                            <p className="text-lg font-bold mb-4">({idx + 1}) {renderMathText(q.text)}</p>
                            
                            {q.type === 'mcq' && q.choices?.map(choice => {
                                const isUserChoice = userAnswer === choice.id;
                                const isCorrectChoice = q.correctChoiceId === choice.id;
                                let choiceClass = 'bg-black/20 border-white/5';
                                if (isCorrectChoice) choiceClass = 'bg-green-500/10 border-green-500/20 text-green-400';
                                if (isUserChoice && !isCorrectChoice) choiceClass = 'bg-red-500/10 border-red-500/20 text-red-400';

                                return (
                                    <div key={choice.id} className={`p-4 mb-2 rounded-2xl border ${choiceClass} flex items-center gap-4`}>
                                        {isUserChoice ? '👈' : isCorrectChoice ? '✅' : '⚪️'}
                                        <span>{choice.text}</span>
                                    </div>
                                )
                            })}
                            
                            {q.type !== 'mcq' && (
                                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20 mb-4">
                                    <p className="text-xs text-blue-400 font-bold mb-2">إجابتك:</p>
                                    <p className="text-white italic">{userAnswer || "لم تتم الإجابة"}</p>
                                </div>
                            )}

                            {manualGrade && (
                                <>
                                  <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10 mb-2">
                                      <p className="text-xs text-yellow-400 font-bold mb-2 flex items-center gap-2"><Award size={14}/> الدرجة الممنوحة من المعلم:</p>
                                      <p className="text-white font-black text-lg">{manualGrade.awardedScore} / {q.score}</p>
                                  </div>
                                  {manualGrade.feedback && (
                                    <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                                        <p className="text-xs text-purple-400 font-bold mb-2 flex items-center gap-2"><MessageSquare size={14}/> ملاحظات المعلم:</p>
                                        <p className="text-white italic">{manualGrade.feedback}</p>
                                    </div>
                                  )}
                                </>
                            )}

                            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400 italic">
                                <p><span className="font-bold text-green-400">الشرح/الإجابة النموذجية:</span> {q.solution || q.modelAnswer || 'لا يوجد شرح متوفر.'}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    </div>
  );
};

export default AttemptReview;