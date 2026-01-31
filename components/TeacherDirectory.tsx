
import React, { useState, useEffect } from 'react';
import { Review, User, TeacherMessage } from '../types';
import { dbService } from '../services/db';
import { contentFilter } from '../services/contentFilter'; // استيراد نظام الرقابة

interface TeacherDirectoryProps {
  user: User | null;
}

const TeacherDirectory: React.FC<TeacherDirectoryProps> = ({ user }) => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageStatus, setMessageStatus] = useState('');

  useEffect(() => {
    loadTeachers();
  }, [user]);

  const loadTeachers = async () => {
    const data = await dbService.getTeachers();
    if (user) {
      const relevantTeachers = data.filter(teacher => 
          teacher.gradesTaught?.includes(user.grade)
      );
      setTeachers(relevantTeachers);
    } else {
      setTeachers(data);
    }
  };

  const handleSelectTeacher = async (teacher: User) => {
    setSelectedTeacher(teacher);
    setNewReview({ rating: 5, comment: '' });
    const reviewData = await dbService.getTeacherReviews(teacher.uid);
    setReviews(reviewData);
  };

  const handleSubmitReview = async () => {
    if (!user) { alert('يجب تسجيل الدخول لتقييم المعلم.'); return; }
    if (!newReview.comment.trim()) { alert('الرجاء كتابة تعليق.'); return; }
    
    // فحص التقييم
    const checkReview = contentFilter.filter(newReview.comment);
    if (!checkReview.isClean) {
        alert("⚠️ عذراً، تقييمك يحتوي على كلمات غير لائقة. يرجى تعديله.");
        return;
    }

    if (!selectedTeacher) return;

    setIsSubmitting(true);
    const review: Review = {
      id: `rev_${Date.now()}`,
      teacherId: selectedTeacher.uid,
      studentName: user.name,
      rating: newReview.rating,
      comment: newReview.comment,
      timestamp: new Date().toISOString()
    };

    await dbService.addReview(review);
    const updatedReviews = await dbService.getTeacherReviews(selectedTeacher.uid);
    setReviews(updatedReviews);
    setNewReview({ rating: 5, comment: '' });
    setIsSubmitting(false);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !selectedTeacher) return;
    
    // فحص الرسالة عبر النظام المركزي (الكلمات النابية + بيانات الاتصال)
    const checkMsg = contentFilter.filter(messageText, { blockSensitive: true });
    
    if (!contentFilter.isSafe(messageText)) {
        setMessageStatus('⚠️ تنبيه: تم رصد محتوى غير لائق في رسالتك. يرجى الالتزام بالمعايير التربوية.');
        return;
    }

    let content = checkMsg.cleanedText;
    const isRedacted = checkMsg.detectedWords.includes('رقم هاتف') || checkMsg.detectedWords.includes('بريد إلكتروني');

    if (isRedacted) {
        setMessageStatus('ℹ️ تنبيه: يمنع تبادل البيانات الشخصية خارج المنصة. تم حجب المعلومات تلقائياً.');
    } else {
        setMessageStatus('جاري الإرسال...');
    }
    
    const newMessage: TeacherMessage = {
        id: `msg_${Date.now()}`, studentId: user.uid, studentName: user.name,
        teacherId: selectedTeacher.uid, teacherName: selectedTeacher.name,
        content: content, timestamp: new Date().toISOString(), isRedacted: isRedacted
    };

    await dbService.saveTeacherMessage(newMessage);

    setTimeout(() => {
        setMessageStatus('✅ تم إرسال الرسالة عبر نظام المنصة الآمن.');
        setTimeout(() => {
            setShowMessageModal(false); setMessageText(''); setMessageStatus('');
        }, 2000);
    }, 1000);
  };

  const calculateAverageRating = (teacherReviews: Review[]) => {
    if (teacherReviews.length === 0) return 0;
    const sum = teacherReviews.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / teacherReviews.length).toFixed(1);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <header className="mb-12 border-r-4 border-[#00d2ff] pr-8">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">دليل <span className="text-[#00d2ff]">المعلمين</span></h2>
        <p className="text-gray-500 text-xl font-medium">تعرف على نخبة مدرسي الفيزياء، تصفح تقييمات الطلاب، وتواصل معهم بأمان.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teachers.map(teacher => (
          <div key={teacher.uid} className="glass-panel p-8 rounded-[40px] border border-white/5 hover:border-[#00d2ff]/30 transition-all group relative overflow-hidden flex flex-col items-center text-center">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#00d2ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="flex-1 w-full flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-110 transition-transform relative z-10 mb-6">
                    {teacher.photoURL ? ( <img src={teacher.photoURL} alt={teacher.name} className="w-full h-full object-cover" /> ) : ( <span className="text-5xl">{teacher.avatar}</span> )}
                </div>
                <h3 className="text-2xl font-black text-white group-hover:text-[#00d2ff] transition-colors">{teacher.name}</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 mb-4">{teacher.specialization}</p>
                <div className="flex gap-2 mb-6">
                    {teacher.gradesTaught?.map(g => ( <span key={g} className="text-[9px] bg-white/5 px-2 py-1 rounded text-gray-300 font-bold border border-white/5">{g === 'uni' ? 'جامعة' : `صف ${g}`}</span> ))}
                </div>
             </div>
             <div className="mt-auto w-full pt-6 border-t border-white/10 space-y-3">
                <button onClick={() => handleSelectTeacher(teacher)} className="w-full bg-white/5 border border-white/10 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00d2ff] hover:text-black hover:border-[#00d2ff] transition-all">
                    عرض الملف
                </button>
                <button 
                    onClick={(e) => {
                        if (user) {
                            setSelectedTeacher(teacher);
                            setShowMessageModal(true);
                        } else {
                            alert("يرجى تسجيل الدخول أولاً لمراسلة المعلم.");
                        }
                    }}
                    className="w-full bg-[#fbbf24]/10 text-[#fbbf24] py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#fbbf24]/20 transition-colors"
                >
                    تواصل مع المعلم
                </button>
            </div>
          </div>
        ))}
      </div>

      {selectedTeacher && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-[#0a1118] border border-white/10 w-full max-w-4xl rounded-[50px] overflow-hidden flex flex-col max-h-[90vh] shadow-3xl animate-slideUp">
              <div className="p-8 md:p-10 border-b border-white/10 flex justify-between items-start bg-white/[0.02]">
                 <div className="flex gap-6 items-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#00d2ff] to-blue-600 flex items-center justify-center overflow-hidden shadow-lg border border-white/10">
                        {selectedTeacher.photoURL ? ( <img src={selectedTeacher.photoURL} alt={selectedTeacher.name} className="w-full h-full object-cover" /> ) : ( <span className="text-4xl">{selectedTeacher.avatar}</span> )}
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-white">{selectedTeacher.name}</h3>
                       <p className="text-gray-400 text-sm">{selectedTeacher.specialization}</p>
                       <div className="flex items-center gap-2 mt-2">
                          <span className="text-[#fbbf24]">★</span>
                          <span className="font-bold text-white">{calculateAverageRating(reviews)}</span>
                          <span className="text-xs text-gray-500">({reviews.length} تقييم)</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => { if (user) { setShowMessageModal(true); } else { alert("يرجى تسجيل الدخول أولاً لمراسلة المعلم."); } }} className="bg-[#00d2ff] text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                        <span>✉️</span> مراسلة المعلم
                    </button>
                    <button onClick={() => setSelectedTeacher(null)} className="p-3 bg-white/5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-all text-xl font-bold">✕</button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-12">
                 <div className="md:col-span-5 p-8 border-l border-white/10 space-y-8 bg-black/20">
                    <div>
                       <h4 className="text-[10px] font-black text-[#00d2ff] uppercase tracking-widest mb-4">نبذة عن المعلم</h4>
                       <p className="text-gray-300 text-sm leading-relaxed italic">"{selectedTeacher.bio}"</p>
                       <div className="mt-4 flex flex-wrap gap-4">
                          <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                             <span className="block text-[9px] text-gray-500 font-black uppercase">الخبرة</span>
                             <span className="font-bold text-white">{selectedTeacher.yearsExperience} سنوات</span>
                          </div>
                          <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                             <span className="block text-[9px] text-gray-500 font-black uppercase">الصفوف</span>
                             <div className="flex gap-1 mt-1">{selectedTeacher.gradesTaught?.map(g => ( <span key={g} className="text-[8px] bg-white/10 px-1.5 rounded">{g}</span> ))}</div>
                          </div>
                       </div>
                    </div>
                    <div className="pt-8 border-t border-white/10">
                       <h4 className="text-lg font-black text-white mb-6">أضف تقييمك</h4>
                       <div className="space-y-4">
                          <div className="flex gap-2 justify-center bg-white/5 p-4 rounded-2xl">{[1, 2, 3, 4, 5].map(star => ( <button key={star} onClick={() => setNewReview({...newReview, rating: star})} className={`text-2xl transition-transform hover:scale-125 ${star <= newReview.rating ? 'text-[#fbbf24]' : 'text-gray-600'}`}>★</button> ))}</div>
                          <textarea value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} placeholder="اكتب تجربتك مع المعلم..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#00d2ff] transition-all" />
                          <button onClick={handleSubmitReview} disabled={isSubmitting} className="w-full py-4 bg-[#00d2ff] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg">{isSubmitting ? 'جاري الإرسال...' : 'نشر التقييم'}</button>
                       </div>
                    </div>
                 </div>
                 <div className="md:col-span-7 p-8">
                    <h4 className="text-xl font-black text-white mb-6 flex items-center gap-3">آراء الطلاب <span className="bg-white/10 text-xs px-2 py-1 rounded-lg text-gray-400">{reviews.length}</span></h4>
                    <div className="space-y-4">{reviews.length > 0 ? reviews.map(review => ( <div key={review.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl animate-slideUp"> <div className="flex justify-between items-start mb-3"> <div className="flex items-center gap-3"> <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold text-white">{review.studentName.charAt(0)}</div> <span className="font-bold text-sm text-gray-200">{review.studentName}</span> </div> <div className="flex text-[#fbbf24] text-xs">{Array.from({ length: 5 }).map((_, i) => ( <span key={i}>{i < review.rating ? '★' : '☆'}</span> ))}</div> </div> <p className="text-gray-400 text-sm leading-relaxed">{review.comment}</p> <p className="text-[9px] text-gray-600 mt-4 text-left">{new Date(review.timestamp).toLocaleDateString('ar-KW')}</p> </div> )) : ( <div className="py-20 text-center opacity-30"><span className="text-6xl mb-4 block">💬</span><p className="font-bold text-sm">كن أول من يقيم هذا المعلم</p></div> )}</div>
                 </div>
              </div>
           </div>
        </div>
      )}
      {showMessageModal && selectedTeacher && ( <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#0a1118] border border-white/10 w-full max-w-md rounded-[40px] p-8 relative shadow-3xl animate-fadeIn">
            <button onClick={() => setShowMessageModal(false)} className="absolute top-6 left-6 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xl font-black text-white mb-2">رسالة خاصة</h3>
            <p className="text-xs text-gray-400 mb-6">إلى: {selectedTeacher.name}</p>
            <div className="bg-[#00d2ff]/5 border border-[#00d2ff]/20 p-4 rounded-2xl mb-6">
                <p className="text-[10px] font-bold text-[#00d2ff] leading-relaxed">🔒 الحماية النشطة: سيتم حجب أي أرقام هواتف أو ألفاظ غير لائقة تلقائياً لضمان سلامة البيئة التعليمية.</p>
            </div>
            <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="اكتب استفسارك هنا..." className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#00d2ff] mb-4" />
            {messageStatus && ( <p className={`text-xs font-bold mb-4 ${messageStatus.includes('⚠️') ? 'text-red-400' : 'text-green-400'}`}>{messageStatus}</p> )}
            <button onClick={handleSendMessage} className="w-full py-4 bg-[#00d2ff] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg">إرسال آمن</button>
        </div>
      </div> )}
    </div>
  );
};

export default TeacherDirectory;
