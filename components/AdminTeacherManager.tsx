
import React, { useState, useEffect, useRef } from 'react';
import { User, TeacherMessage, TeacherPermission } from '../types';
import { dbService } from '../services/db';
import { secondaryAuth } from '../services/firebase';
import { 
  Search, User as UserIcon, Shield, MessageSquare, Trash2, Save, 
  PlusCircle, UserPlus, Briefcase, GraduationCap, CheckCircle,
  FileText, Lock, RefreshCw, KeyRound, Mail, AlertCircle, BarChart
} from 'lucide-react';
import ActivityStats from './ActivityStats';

const AdminTeacherManager: React.FC = () => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PERMISSIONS' | 'MESSAGES' | 'ACTIVITY'>('PROFILE');
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [password, setPassword] = useState('');

  const [editForm, setEditForm] = useState<Partial<User>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = dbService.subscribeToUsers((updatedTeachers) => {
        setTeachers(updatedTeachers);
        setIsLoading(false);
    }, 'teacher');

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setFilteredTeachers(
      searchQuery.trim() === ''
        ? teachers
        : teachers.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, teachers]);

  useEffect(() => {
    if (selectedTeacher && selectedTeacher.uid !== 'new_entry' && activeTab === 'MESSAGES') {
      loadMessages(selectedTeacher.uid);
    }
  }, [selectedTeacher, activeTab]);

  const calculateWeeklyActivity = (activityLog?: Record<string, number>): number => {
    if (!activityLog) return 0;
    const today = new Date();
    let totalMinutes = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        totalMinutes += activityLog[dateString] || 0;
    }
    return totalMinutes;
  };

  const loadMessages = async (teacherId: string) => {
    const msgs = await dbService.getAllTeacherMessages(teacherId);
    setMessages(msgs);
  };

  const handleSelectTeacher = (teacher: User) => {
    setSelectedTeacher(teacher);
    setEditForm({ ...teacher });
    setActiveTab('PROFILE');
    setMessage(null);
    setPassword('');
  };

  const handleCreateNewMode = () => {
    setSearchQuery('');
    const newTeacherTemplate: User = {
        uid: 'new_entry', 
        name: '', 
        email: '', 
        role: 'teacher',
        grade: '12', 
        subscription: 'premium', 
        progress: { completedLessonIds: [], points: 0, achievements: [] },
        status: 'active', 
        createdAt: new Date().toISOString(),
        specialization: 'فيزياء', 
        yearsExperience: 0, 
        bio: '', 
        avatar: '👨‍🏫',
        gradesTaught: [], 
        permissions: ['create_content', 'reply_messages']
    };
    setSelectedTeacher(newTeacherTemplate);
    setEditForm(newTeacherTemplate);
    setActiveTab('PROFILE');
    setMessage(null);
    setPassword('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleGrade = (grade: string) => {
    const current = editForm.gradesTaught || [];
    setEditForm({ ...editForm, gradesTaught: current.includes(grade) ? current.filter(g => g !== grade) : [...current, grade] });
  };

  const togglePermission = (perm: TeacherPermission) => {
    const current = editForm.permissions || [];
    setEditForm({ ...editForm, permissions: current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm] });
  };

  const handleSave = async () => {
    if (!editForm.name?.trim() || !editForm.email?.trim()) {
        setMessage({ text: 'يرجى تعبئة الاسم والبريد الإلكتروني', type: 'error' });
        return;
    }

    if (selectedTeacher?.uid === 'new_entry' && (!password || password.length < 6)) {
        setMessage({ text: 'يرجى إدخال كلمة مرور مؤقتة (6 أحرف على الأقل)', type: 'error' });
        return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
        let teacherToSave = { 
            ...selectedTeacher, 
            ...editForm,
            gradesTaught: editForm.gradesTaught || [],
            permissions: editForm.permissions || []
        } as User;
        
        if (selectedTeacher?.uid === 'new_entry') {
            if (!secondaryAuth) {
              throw new Error("نظام التوثيق الثانوي غير متاح. تأكد من تفعيل Firebase Auth.");
            }
            try {
                // v8 syntax
                const userCredential = await secondaryAuth.createUserWithEmailAndPassword(teacherToSave.email, password);
                teacherToSave.uid = userCredential.user!.uid;
            } catch (authError: any) {
                console.error("Auth Error Code:", authError.code);
                let authMsg = 'فشل إنشاء الحساب.';
                if (authError.code === 'auth/email-already-in-use') authMsg = 'هذا البريد الإلكتروني مسجل مسبقاً.';
                if (authError.code === 'auth/invalid-email') authMsg = 'البريد الإلكتروني غير صالح.';
                if (authError.code === 'auth/weak-password') authMsg = 'كلمة المرور ضعيفة جداً.';
                if (authError.code === 'auth/operation-not-allowed') authMsg = 'مزود "البريد وكلمة المرور" غير مفعل في Firebase Console.';
                throw new Error(authMsg);
            }
        }

        await dbService.saveUser(teacherToSave);
        // No need to loadTeachers, subscription will update state
        setSelectedTeacher(teacherToSave);
        setMessage({ text: 'تم حفظ بيانات المعلم بنجاح ✅', type: 'success' });
        setPassword('');
        
    } catch (e: any) {
        console.error("Save Error:", e);
        setMessage({ text: e.message || 'حدث خطأ أثناء محاولة الحفظ.', type: 'error' });
    } finally {
        setIsLoading(false);
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async () => {
    if (!selectedTeacher || selectedTeacher.uid === 'new_entry') return;
    if (!confirm('⚠️ تحذير: سيتم حذف المعلم وجميع البيانات المرتبطة به. هل أنت متأكد؟')) return;

    setIsLoading(true);
    try {
        await dbService.deleteUser(selectedTeacher.uid);
        setMessage({ text: 'تم حذف المعلم بنجاح', type: 'success' });
        setSelectedTeacher(null);
    } catch (e: any) {
        setMessage({ text: 'فشل حذف المعلم: ' + e.message, type: 'error' });
    } finally {
        setIsLoading(false);
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const PERMISSIONS_LIST: {key: TeacherPermission, label: string}[] = [
    { key: 'create_content', label: 'إضافة محتوى (دروس/اختبارات)' },
    { key: 'reply_messages', label: 'الرد على رسائل الطلاب' },
    { key: 'view_analytics', label: 'الاطلاع على التحليلات' },
    { key: 'manage_exams', label: 'إدارة الامتحانات' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-['Tajawal'] text-right animate-fadeIn" dir="rtl">
        <div className="lg:col-span-4 flex flex-col gap-6 h-[calc(100vh-140px)] sticky top-6">
            <div className="glass-panel p-6 rounded-[30px] border-white/5 bg-[#0a1118]/80 flex flex-col h-full overflow-hidden">
                <div className="space-y-4 mb-6">
                    <button onClick={handleCreateNewMode} className="w-full py-4 bg-[#fbbf24] text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <UserPlus size={16} /> إضافة معلم جديد
                    </button>
                    <div className="relative">
                        <Search className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input type="text" placeholder="بحث بالاسم أو التخصص..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-white outline-none focus:border-[#fbbf24] transition-all text-sm font-bold shadow-inner" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
                    {filteredTeachers.map(teacher => {
                        const weeklyMinutes = calculateWeeklyActivity(teacher.activityLog);
                        return (
                        <div key={teacher.uid} onClick={() => handleSelectTeacher(teacher)} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 group ${selectedTeacher?.uid === teacher.uid ? 'bg-[#fbbf24] border-[#fbbf24] text-black shadow-lg shadow-[#fbbf24]/20' : 'bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10'}`}>
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg overflow-hidden ${selectedTeacher?.uid === teacher.uid ? 'bg-black/20' : 'bg-black/40'}`}>
                                    {teacher.photoURL ? <img src={teacher.photoURL} className="w-full h-full object-cover" /> : teacher.avatar}
                                </div>
                                {(() => {
                                    const isOnline = teacher.lastSeen && (new Date().getTime() - new Date(teacher.lastSeen).getTime()) < 3 * 60 * 1000;
                                    return (
                                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${selectedTeacher?.uid === teacher.uid ? 'border-black/50' : 'border-[#0a1118]'} ${isOnline ? 'bg-emerald-500' : 'bg-gray-600'}`} title={isOnline ? 'متصل الآن' : `آخر ظهور: ${teacher.lastSeen ? new Date(teacher.lastSeen).toLocaleString('ar-KW') : 'غير معروف'}`}></div>
                                    );
                                })()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold truncate text-sm">{teacher.name}</h4>
                                <div className={`flex items-center gap-2 text-[10px] font-mono truncate ${selectedTeacher?.uid === teacher.uid ? 'text-black/60' : 'text-gray-500'}`}>
                                    <span>{teacher.specialization}</span>
                                    <span className="opacity-50">•</span>
                                    <BarChart size={11} />
                                    <span>{weeklyMinutes > 0 ? `${Math.round(weeklyMinutes)} د / 7 أيام` : 'غير نشط'}</span>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        </div>
        <div className="lg:col-span-8">
            {selectedTeacher ? (
                <div className="glass-panel p-8 md:p-12 rounded-[50px] border-white/10 bg-[#0a1118]/60 relative min-h-[600px] animate-slideUp">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10 pb-8 border-b border-white/5">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-[30px] border-2 border-white/10 bg-black/40 p-2 shadow-2xl relative overflow-hidden group">
                                {selectedTeacher.uid === 'new_entry' ? ( <div className="w-full h-full flex items-center justify-center text-4xl">🆕</div> ) : editForm.photoURL ? ( <img src={editForm.photoURL} alt="avatar" className="w-full h-full object-cover rounded-[20px]" /> ) : ( <div className="w-full h-full flex items-center justify-center text-4xl">{editForm.avatar}</div> )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <span className="text-xs font-bold text-white">تغيير</span>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white mb-2">{selectedTeacher.uid === 'new_entry' ? 'إضافة معلم جديد' : selectedTeacher.name}</h2>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${editForm.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{editForm.status}</span>
                                    <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">{editForm.jobTitle || 'معلم'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar p-1">
                        {[ {id: 'PROFILE', label: 'الملف الشخصي', icon: UserIcon}, {id: 'PERMISSIONS', label: 'الصلاحيات', icon: Lock}, {id: 'MESSAGES', label: 'المراسلات', icon: MessageSquare, disabled: selectedTeacher.uid === 'new_entry'}, {id: 'ACTIVITY', label: 'النشاط', icon: BarChart, disabled: selectedTeacher.uid === 'new_entry'} ].map(tab => (
                            <button key={tab.id} onClick={() => !tab.disabled && setActiveTab(tab.id as any)} disabled={tab.disabled} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${ tab.disabled ? 'opacity-30 cursor-not-allowed bg-transparent text-gray-600' : activeTab === tab.id ? 'bg-[#fbbf24] text-black shadow-lg shadow-[#fbbf24]/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-6 min-h-[300px]">
                        {activeTab === 'PROFILE' && ( <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                            <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <UserIcon size={12}/> الاسم الكامل </label> <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium" /> </div>
                            <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <Briefcase size={12}/> التخصص </label> <input type="text" value={editForm.specialization || ''} onChange={e => setEditForm({...editForm, specialization: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium" /> </div>
                            <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <Mail size={12}/> البريد الإلكتروني </label> <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium text-left ltr" /> </div>
                            {selectedTeacher.uid === 'new_entry' && <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <KeyRound size={12}/> كلمة المرور المؤقتة </label> <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-red-500/50 transition-all font-medium text-left ltr" /> </div>}
                            <div className="space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <Shield size={12}/> اللقب الوظيفي </label> <input type="text" value={editForm.jobTitle || ''} onChange={e => setEditForm({...editForm, jobTitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium" /> </div>
                            <div className="col-span-full space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <FileText size={12}/> نبذة تعريفية </label> <textarea value={editForm.bio || ''} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#fbbf24] transition-all font-medium leading-relaxed" /> </div>
                            <div className="col-span-full space-y-2"> <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"> <GraduationCap size={12}/> الصفوف الدراسية </label> <div className="flex flex-wrap gap-2 bg-black/40 border border-white/10 rounded-2xl p-4"> {['10', '11', '12', 'uni'].map(g => ( <button key={g} onClick={() => toggleGrade(g)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${ editForm.gradesTaught?.includes(g) ? 'bg-[#00d2ff] text-black' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>{g === 'uni' ? 'جامعة' : `صف ${g}`}</button>))} </div> </div>
                        </div> )}
                        {activeTab === 'PERMISSIONS' && (
                            <div className="space-y-8 animate-slideUp">
                                <div className="bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-[35px] p-8">
                                    <h4 className="text-lg font-black text-[#fbbf24] mb-6">صلاحيات الوصول</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {PERMISSIONS_LIST.map(perm => (
                                            <button key={perm.key} onClick={() => togglePermission(perm.key)} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${ editForm.permissions?.includes(perm.key) ? 'bg-[#fbbf24] text-black border-[#fbbf24]' : 'bg-black/40 border-white/5 text-gray-400'}`}>
                                                <span className="font-bold text-xs">{perm.label}</span>
                                                {editForm.permissions?.includes(perm.key) && <CheckCircle size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                                    <div>
                                        <h5 className="font-bold text-white">حالة الحساب</h5>
                                        <p className="text-xs text-gray-500">تجميد الحساب يمنع المعلم من الدخول للمنصة</p>
                                    </div>
                                    <button onClick={() => setEditForm({...editForm, status: editForm.status === 'active' ? 'suspended' : 'active'})} className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-all ${editForm.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {editForm.status === 'active' ? 'نشط Active' : 'مجمد Suspended'}
                                    </button>
                                </div>
                                <div className="pt-8 border-t border-white/10">
                                    <button onClick={handleDelete} className="flex items-center gap-2 text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest transition-colors">
                                        <Trash2 size={16} /> حذف المعلم نهائياً
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'MESSAGES' && ( <div className="space-y-4 animate-slideUp max-h-[400px] overflow-y-auto no-scrollbar pr-2">{messages.length > 0 ? messages.map(msg => ( <div key={msg.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl"> <div className="flex justify-between items-start mb-2"> <span className="text-sm font-bold text-[#00d2ff]">{msg.studentName}</span> <span className="text-[9px] text-gray-500 font-mono">{new Date(msg.timestamp).toLocaleDateString('ar-SY')}</span> </div> <p className="text-gray-300 text-xs leading-relaxed">{msg.content}</p> </div> )) : ( <div className="text-center py-20 opacity-30"> <MessageSquare className="w-12 h-12 mx-auto mb-2" /> <p className="text-xs font-bold">لا توجد رسائل</p> </div> )}</div> )}
                        {activeTab === 'ACTIVITY' && (
                            <div className="animate-slideUp">
                                <h4 className="text-lg font-black text-white mb-6">سجل النشاط الزمني للمعلم</h4>
                                <ActivityStats activityLog={editForm.activityLog} />
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-8 left-8 right-8 flex gap-4 border-t border-white/10 pt-6 bg-[#0a1118]/80 backdrop-blur-md rounded-b-[40px]">
                        {message && ( <div className={`flex-1 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {message.type === 'error' && <AlertCircle size={14} />}
                            {message.text}
                        </div> )}
                        <button onClick={handleSave} disabled={isLoading} className="bg-[#fbbf24] text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 ml-auto disabled:opacity-50">
                            {isLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                            {selectedTeacher.uid === 'new_entry' ? 'إضافة المعلم' : 'حفظ التعديلات'}
                        </button>
                    </div>
                </div>
            ) : ( <div className="glass-panel rounded-[50px] border-white/5 flex flex-col items-center justify-center h-[calc(100vh-140px)] opacity-30 bg-black/20 text-center p-10"> <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-8 animate-pulse"> <UserIcon size={48} className="text-gray-500" /> </div> <h3 className="text-3xl font-black text-white mb-2">إدارة المعلمين</h3> <p className="font-medium text-gray-500 max-w-sm">اختر معلماً من القائمة للتعديل، أو قم بإضافة معلم جديد.</p> </div> )}
        </div>
    </div>
  );
};

export default AdminTeacherManager;
