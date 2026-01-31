
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { 
  Search, User as UserIcon, Zap, Save, RefreshCw, GraduationCap, 
  Mail, Phone, School, PlusCircle, X, KeyRound, Trash2, AlertCircle, BarChart
} from 'lucide-react';
import ActivityStats from './ActivityStats';

const AdminStudentManager: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Notice: Student creation doesn't use firebase auth here usually, but if needed, use secondaryAuth as well.
  // The current implementation seems to just edit profile data. Assuming no auth creation logic needed here for now.

  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = dbService.subscribeToUsers((updatedStudents) => {
        setStudents(updatedStudents);
        setIsLoading(false);
    }, 'student');

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredStudents(students.filter(s => 
        s.name.toLowerCase().includes(lower) || 
        s.email.toLowerCase().includes(lower) ||
        (s.phone && s.phone.includes(lower))
      ));
    }
  }, [searchQuery, students]);

  const groupedStudents = useMemo(() => {
    return filteredStudents.reduce((acc, student) => {
      const grade = student.grade || 'uni';
      if (!acc[grade]) {
        acc[grade] = [];
      }
      acc[grade].push(student);
      return acc;
    }, {} as Record<User['grade'], User[]>);
  }, [filteredStudents]);

  const gradeOrder: User['grade'][] = ['12', '11', '10', 'uni'];

  const handleSelectStudent = (student: User) => {
    setSelectedStudent(student);
    setEditForm({ ...student });
    setMessage(null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedStudent(null);
      setEditForm({});
      setMessage(null);
  };

  const handleSave = async () => {
    if (!editForm.name?.trim() || !editForm.email?.trim()) {
        setMessage({ text: 'يرجى تعبئة جميع الحقول المطلوبة (الاسم والبريد)', type: 'error' });
        return;
    }
    
    setIsLoading(true);
    setMessage(null);

    try {
        let updatedUser = { 
            ...selectedStudent, 
            ...editForm,
            progress: selectedStudent?.progress || { completedLessonIds: [], points: 0 } 
        } as User;
        
        // مزامنة تغيير الاشتراك إذا حدث يدوياً
        if (selectedStudent && selectedStudent.uid !== 'new_entry' && selectedStudent.subscription !== editForm.subscription) {
            await dbService.updateStudentSubscription(selectedStudent.uid, editForm.subscription as 'free' | 'premium', 35);
            const { subscription, ...otherFields } = editForm;
            await dbService.saveUser({ ...updatedUser, ...otherFields } as User);
        } else {
            await dbService.saveUser(updatedUser);
        }

        setMessage({ text: 'تم حفظ البيانات بنجاح ✅', type: 'success' });
        setTimeout(handleCloseModal, 1000);
    } catch (e: any) {
        setMessage({ text: e.message || 'حدث خطأ غير متوقع.', type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="font-['Tajawal'] text-right animate-fadeIn" dir="rtl">
        <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-[#0a1118]/80 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <h2 className="text-3xl font-black text-white">إدارة <span className="text-[#fbbf24]">الطلاب</span> ({students.length})</h2>
            </div>
            
            <div className="relative mb-8">
                <Search className="absolute top-1/2 right-5 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type="text" placeholder="بحث بالاسم، الإيميل، أو رقم الموبايل..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl pr-14 pl-6 py-5 text-white outline-none focus:border-[#fbbf24] transition-all font-bold" />
            </div>

            <div className="space-y-8">
                {gradeOrder.map(grade => groupedStudents[grade] && (
                    <div key={grade}>
                        <h3 className="text-xl font-bold text-white mb-4 border-r-4 border-[#fbbf24] pr-4">
                            الصف {grade === 'uni' ? 'الجامعي' : grade} ({groupedStudents[grade].length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedStudents[grade].map(student => {
                                return (
                                <div key={student.uid} onClick={() => handleSelectStudent(student)} className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-all flex items-center gap-4 group">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-black/40 p-1 border border-white/10 overflow-hidden flex items-center justify-center">
                                            {student.photoURL ? <img src={student.photoURL} alt="a" /> : (student.gender === 'female' ? '👩' : '👨')}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white truncate">{student.name}</h4>
                                        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5">
                                            <span>{student.phone || 'بدون رقم'}</span>
                                            <span className="opacity-50">•</span>
                                            <span>{student.subscription}</span>
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${student.subscription === 'premium' ? 'bg-[#fbbf24] shadow-[0_0_10px_#fbbf24]' : 'bg-gray-700'}`}></div>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </div>
        </div>

      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0a1118] border border-white/10 w-full max-w-2xl rounded-[50px] p-10 relative shadow-3xl animate-slideUp overflow-hidden">
            <button onClick={handleCloseModal} className="absolute top-8 left-8 text-gray-500 hover:text-white bg-white/5 p-2 rounded-full"><X size={20}/></button>
            
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-[#fbbf24] rounded-[25px] flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl">
                    🎓
                </div>
                <h3 className="text-3xl font-black text-white">تعديل بيانات الطالب</h3>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">الاسم الكامل</label>
                        <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24]" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">رقم الموبايل</label>
                        <input type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#fbbf24] text-left ltr" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">الجنس</label>
                        <select value={editForm.gender || 'male'} onChange={e => setEditForm({...editForm, gender: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none">
                            <option value="male">ذكر</option>
                            <option value="female">أنثى</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">الصف الدراسي</label>
                        <select value={editForm.grade || '12'} onChange={e => setEditForm({...editForm, grade: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none">
                            <option value="10">الصف 10</option>
                            <option value="11">الصف 11</option>
                            <option value="12">الصف 12</option>
                            <option value="uni">جامعي</option>
                        </select>
                    </div>
                </div>
                
                <div className="pt-6 border-t border-white/5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2 mb-4 block">حالة الاشتراك</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setEditForm({...editForm, subscription: 'free'})} className={`py-4 rounded-2xl font-bold transition-all border ${editForm.subscription === 'free' ? 'bg-white/10 border-white text-white' : 'bg-transparent border-white/10 text-gray-500'}`}>مجاني</button>
                        <button onClick={() => setEditForm({...editForm, subscription: 'premium'})} className={`py-4 rounded-2xl font-bold transition-all border ${editForm.subscription === 'premium' ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24]' : 'bg-transparent border-white/10 text-gray-500'}`}>بريميوم ⚡</button>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 flex flex-col gap-4">
                {message && (
                    <div className={`p-4 rounded-2xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {message.text}
                    </div>
                )}
                <button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    className="w-full bg-[#fbbf24] text-black py-5 rounded-[25px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isLoading ? <RefreshCw className="animate-spin" /> : <Save size={18} />} حفظ التعديلات
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentManager;
