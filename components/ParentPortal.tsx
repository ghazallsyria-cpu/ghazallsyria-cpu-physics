
import React, { useState, useEffect } from 'react';
import { User, WeeklyReport, AppNotification } from '../types';
import { dbService } from '../services/db';

const ParentPortal: React.FC<{ user: User }> = ({ user }) => {
  const [linkedStudents, setLinkedStudents] = useState<User[]>([]);
  const [studentReports, setStudentReports] = useState<Record<string, WeeklyReport | null>>({});
  const [studentNotifications, setStudentNotifications] = useState<Record<string, AppNotification[]>>({});
  const [selectedStudentUid, setSelectedStudentUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAllStudentData = async () => {
      setIsLoading(true);
      const studentUids = user.linkedStudentUids || [];
      if (studentUids.length > 0) {
          try {
              const studentDataPromises = studentUids.map(uid => 
                  Promise.all([
                      dbService.getStudentProgressForParent(uid),
                      dbService.getNotifications(uid)
                  ])
              );
              
              const results = await Promise.all(studentDataPromises);

              const students: User[] = [];
              const reports: Record<string, WeeklyReport | null> = {};
              const notifications: Record<string, AppNotification[]> = {};

              results.forEach((result, index) => {
                  const uid = studentUids[index];
                  const { user: student, report: weekReport } = result[0];
                  const studentNotes = result[1];
                  
                  if (student) {
                      students.push(student);
                      reports[uid] = weekReport;
                      notifications[uid] = studentNotes;
                  }
              });

              setLinkedStudents(students);
              setStudentReports(reports);
              setStudentNotifications(notifications);
              setSelectedStudentUid(students[0]?.uid || null);

          } catch (error) {
              console.error("Failed to load data for linked students:", error);
          }
      }
      setIsLoading(false);
    };

    loadAllStudentData();
  }, [user]);

  if (isLoading) return <div className="p-32 text-center text-gray-500 animate-pulse font-['Tajawal']">جاري تأمين الاتصال بنطاق الطالب...</div>;

  const selectedStudent = linkedStudents.find(s => s.uid === selectedStudentUid);
  const selectedReport = selectedStudentUid ? studentReports[selectedStudentUid] : null;
  const selectedNotifications = selectedStudentUid ? studentNotifications[selectedStudentUid] || [] : [];

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-16 border-r-4 border-[#00d2ff] pr-8">
        <h2 className="text-5xl font-black mb-2 tracking-tighter italic">بوابة <span className="text-[#00d2ff]">المتابعة الأكاديمية</span></h2>
        <p className="text-gray-500 text-xl font-medium">مستقبلك يبدأ هنا.. رؤية شفافة لتقدم ابنكم العلمي.</p>
      </header>
      
      {linkedStudents.length > 1 && (
        <div className="mb-12 glass-panel p-6 rounded-[40px] border-white/5">
            <h3 className="text-lg font-black mb-4 text-gray-300 pr-2">اختر الطالب لعرض تقريره:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {linkedStudents.map(student => (
                    <button
                        key={student.uid}
                        onClick={() => setSelectedStudentUid(student.uid)}
                        className={`flex items-center gap-4 p-4 rounded-[25px] transition-all border-2 ${selectedStudentUid === student.uid ? 'bg-[#00d2ff] text-black border-transparent shadow-lg' : 'bg-white/5 text-white hover:bg-white/10 border-transparent'}`}
                    >
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${student.name}`} alt={student.name} className="w-10 h-10 rounded-full bg-white/10 p-1"/>
                        <span className="font-bold text-sm">{student.name.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
      )}

      {!selectedStudent ? (
        <div className="py-32 text-center glass-panel rounded-[60px] border-dashed border-white/10 opacity-50">
           <span className="text-6xl mb-8 block">🗝️</span>
           <h3 className="text-2xl font-black mb-4 uppercase tracking-widest">بانتظار ربط بيانات الطالب</h3>
           <p className="text-gray-500 max-w-md mx-auto italic">يرجى استخدام كود الربط المقدم من الإدارة لتفعيل البوابة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
             {/* Weekly Insights */}
             <div className="glass-panel p-12 rounded-[70px] border-[#00d2ff]/20 bg-gradient-to-br from-[#00d2ff]/5 to-transparent">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-3xl font-black">تقرير الأداء الذكي</h3>
                   <span className="bg-[#fbbf24] text-black px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">تحليل سقراط AI</span>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-12">
                   <div className="text-center p-8 bg-black/40 rounded-[40px] border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 mb-2 uppercase">معدل التحصيل</p>
                      <p className="text-4xl font-black text-[#00d2ff]">{selectedReport?.scoreAverage.toFixed(1) || 'N/A'}%</p>
                   </div>
                   <div className="text-center p-8 bg-black/40 rounded-[40px] border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 mb-2 uppercase">ساعات المذاكرة</p>
                      <p className="text-4xl font-black text-white">{selectedReport?.hoursSpent || 0}h</p>
                   </div>
                   <div className="text-center p-8 bg-black/40 rounded-[40px] border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 mb-2 uppercase">الأهداف المحققة</p>
                      <p className="text-4xl font-black text-green-500">{selectedReport?.completedUnits || 0}</p>
                   </div>
                </div>

                <div className="p-8 bg-white/5 rounded-[40px] border border-white/5">
                   <h4 className="text-lg font-black text-[#fbbf24] mb-4">ملاحظة الخبير:</h4>
                   <p className="text-gray-300 leading-relaxed italic">"{selectedReport?.parentNote || 'لا توجد ملاحظات جديدة لهذا الأسبوع.'}"</p>
                </div>
             </div>

             {/* Academic Notifications */}
             <div className="glass-panel p-10 rounded-[60px] border-white/5">
                <h4 className="text-xl font-black mb-8 border-r-4 border-[#fbbf24] pr-4">آخر التحديثات</h4>
                <div className="space-y-4">
                   {selectedNotifications.length > 0 ? selectedNotifications.map(note => (
                     <div key={note.id} className="flex gap-6 items-start p-6 bg-black/40 rounded-[35px] border border-white/5 group hover:border-[#fbbf24]/30 transition-all">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${note.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                           {note.type === 'success' ? '✅' : '🔔'}
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-bold text-white mb-1">{note.title}</p>
                           <p className="text-sm text-gray-400 italic mb-2">"{note.message}"</p>
                           <span className="text-[9px] font-black text-gray-600 uppercase tabular-nums">{new Date(note.timestamp).toLocaleTimeString('ar-SY')}</span>
                        </div>
                     </div>
                   )) : (
                     <div className="py-10 text-center text-gray-500 italic">لا توجد إشعارات حالياً.</div>
                   )}
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <div className="glass-panel p-10 rounded-[60px] border-white/5 text-center sticky top-10">
                <div className="w-32 h-32 rounded-full border-4 border-[#00d2ff] overflow-hidden mx-auto mb-8 shadow-2xl relative">
                   <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedStudent.name}`} alt={selectedStudent.name} />
                </div>
                <h3 className="text-3xl font-black mb-2">{selectedStudent.name}</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mb-8">الصف {selectedStudent.grade}</p>
                
                <div className="space-y-4 pt-8 border-t border-white/5">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">حالة الاشتراك:</span>
                      <span className={`font-black ${selectedStudent.subscription !== 'free' ? 'text-green-500' : 'text-orange-500'}`}>
                         {selectedStudent.subscription === 'free' ? 'مجاني' : 'بريميوم ⚡'}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">آخر ظهور:</span>
                      <span className="font-bold text-white">{selectedStudent.progress.lastActivity ? new Date(selectedStudent.progress.lastActivity).toLocaleDateString('ar-SY') : 'قيد الانتظار'}</span>
                   </div>
                </div>
                
                <button className="w-full mt-10 py-5 bg-[#00d2ff] text-black rounded-[25px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">تصدير تقرير PDF</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentPortal;
