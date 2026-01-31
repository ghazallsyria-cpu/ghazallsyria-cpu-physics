
import React, { useEffect, useState } from 'react';
// FIX: Updated undefined QuizAttempt to StudentQuizAttempt
import { User, WeeklyReport, StudentQuizAttempt } from '../types';
import { dbService } from '../services/db';

interface ProgressReportProps {
  user: User;
  // FIX: Updated undefined QuizAttempt to StudentQuizAttempt
  attempts: StudentQuizAttempt[];
}

const ProgressReport: React.FC<ProgressReportProps> = ({ user, attempts: initialAttempts }) => {
  // FIX: Updated undefined QuizAttempt to StudentQuizAttempt
  const [attempts, setAttempts] = useState<StudentQuizAttempt[]>(initialAttempts);

  useEffect(() => {
    const loadAttempts = async () => {
      // If no attempts provided (e.g. called from Sidebar), fetch them
      if (!initialAttempts || initialAttempts.length === 0) {
        const fetched = await dbService.getUserAttempts(user.uid);
        if (fetched) setAttempts(fetched);
      }
    };
    loadAttempts();
  }, [user.uid, initialAttempts]);

  const reports: WeeklyReport[] = user.weeklyReports || [
    { week: '12-19 May', completedUnits: 3, hoursSpent: 12.5, scoreAverage: 88, improvementAreas: ['قوانين نيوتن', 'المتجهات'] },
    { week: '05-12 May', completedUnits: 2, hoursSpent: 8.2, scoreAverage: 75, improvementAreas: ['الدوائر الكهربائية'] },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal']">
      <header className="flex justify-between items-center mb-16">
        <div>
           <h2 className="text-5xl font-black text-white tracking-tighter">سجل <span className="text-[#00d2ff]">التميز</span> الأكاديمي</h2>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">تاريخ التقرير</p>
           <p className="text-sm font-bold text-white uppercase">{new Date().toLocaleDateString('ar-KW')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Overviews */}
        <div className="lg:col-span-7 space-y-8">
           <h3 className="text-2xl font-black mb-6">التقارير الأسبوعية</h3>
           {reports.map((report, idx) => (
             <div key={idx} className="glass-card p-10 rounded-[50px] border-white/5 group hover:border-[#00d2ff]/20 transition-all">
                <div className="flex justify-between items-center mb-10">
                   <span className="text-xl font-black text-white">{report.week}</span>
                   <span className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest ${report.scoreAverage >= 80 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      Avg Score: {report.scoreAverage}%
                   </span>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-10">
                   <div className="text-center">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Units</p>
                      <p className="text-2xl font-black text-[#00d2ff]">{report.completedUnits}</p>
                   </div>
                   <div className="text-center border-x border-white/5">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Hours</p>
                      <p className="text-2xl font-black text-white">{report.hoursSpent}h</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Progress</p>
                      <p className="text-2xl font-black text-purple-500">+12%</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">تحتاج لتركيز أكثر في:</p>
                   <div className="flex flex-wrap gap-2">
                      {report.improvementAreas.map((area, i) => (
                        <span key={i} className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold border border-white/5 group-hover:border-[#00d2ff]/20 transition-all">{area}</span>
                      ))}
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Recent Exams & Badges Summary */}
        <div className="lg:col-span-5 space-y-8">
           <div className="glass-card p-10 rounded-[50px] border-white/5">
              <h3 className="text-xl font-black mb-8">آخر الاختبارات</h3>
              <div className="space-y-6">
                 {attempts.length > 0 ? attempts.slice(0, 5).map(att => (
                   <div key={att.id || Math.random()} className="flex justify-between items-center p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                      <div className="text-right">
                         <p className="text-[10px] font-black text-[#00d2ff] uppercase mb-1">Exam Entry</p>
                         <p className="text-sm font-bold text-white"># {att.quizId.split('-')[1] || 'Official'}</p>
                      </div>
                      <div className="text-center">
                         <p className="text-[8px] text-gray-600 uppercase mb-1">{att.completedAt ? att.completedAt.split('T')[0] : 'N/A'}</p>
                         <p className="text-lg font-black tabular-nums">{att.score} <span className="text-[10px] text-gray-500">/ {att.maxScore}</span></p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${att.score / att.maxScore >= 0.9 ? 'bg-green-500' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]'}`}></div>
                   </div>
                 )) : (
                   <div className="py-20 text-center opacity-30 italic text-xs">لا توجد محاولات مسجلة بعد.</div>
                 )}
              </div>
           </div>

           <div className="glass-panel p-10 rounded-[50px] border-[#00d2ff]/20 bg-gradient-to-br from-[#00d2ff]/5 to-transparent">
              <h3 className="text-xl font-black mb-6">تحليل الذكاء الاصطناعي 🤖</h3>
              <p className="text-xs text-gray-400 leading-relaxed italic">
                "بناءً على نتائجك الأخيرة في 'قانون أوم'، أنصحك بمشاهدة فيديو Veo لمحاكاة حركة الإلكترونات قبل المحاولة القادمة. مستواك العام يتحسن بنسبة 8% أسبوعياً!"
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressReport;
