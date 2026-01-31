
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { dbService } from '../services/db';
import { auth } from '../services/firebase';
import { ShieldCheck, UserPlus, Trash2, Search, RefreshCw, Mail, User as UserIcon, AlertCircle, ShieldAlert } from 'lucide-react';

const AdminManager: React.FC = () => {
    const [admins, setAdmins] = useState<User[]>([]);
    const [searchEmail, setSearchEmail] = useState('');
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
    
    const currentUserUid = auth.currentUser?.uid;

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setIsLoading(true);
        try {
            const adminList = await dbService.getAdmins();
            setAdmins(adminList);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchEmail.trim()) return;
        
        setIsSearching(true);
        setFoundUser(null);
        try {
            const user = await dbService.getUser(searchEmail.trim());
            if (user) {
                setFoundUser(user);
            } else {
                setMessage({ text: 'المستخدم غير موجود.', type: 'error' });
            }
        } catch (e) {
            setMessage({ text: 'خطأ أثناء البحث.', type: 'error' });
        } finally {
            setIsSearching(false);
        }
    };

    const promoteUser = async (uid: string) => {
        if (!window.confirm('هل أنت متأكد من ترقية هذا المستخدم لمدير؟ سيمنحه هذا صلاحيات كاملة.')) return;
        
        setIsLoading(true);
        try {
            await dbService.updateUserRole(uid, 'admin');
            setMessage({ text: 'تمت الترقية بنجاح ✅', type: 'success' });
            setFoundUser(null);
            setSearchEmail('');
            await loadAdmins();
        } catch (e) {
            setMessage({ text: 'فشلت العملية.', type: 'error' });
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const demoteAdmin = async (admin: User) => {
        if (admin.uid === currentUserUid) {
            alert('لا يمكنك سحب صلاحياتك بنفسك لمنع فقدان الوصول للنظام.');
            return;
        }
        
        if (!window.confirm(`هل أنت متأكد من سحب صلاحيات المدير من ${admin.name}؟`)) return;
        
        setIsLoading(true);
        try {
            await dbService.updateUserRole(admin.uid, 'teacher'); // تحويل لمعلم افتراضياً
            setMessage({ text: 'تم سحب الصلاحيات بنجاح.', type: 'success' });
            await loadAdmins();
        } catch (e) {
            setMessage({ text: 'فشلت العملية.', type: 'error' });
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="mb-12 border-r-4 border-amber-400 pr-8">
                <h2 className="text-4xl font-black text-white flex items-center gap-4 italic uppercase tracking-tighter">
                    <ShieldCheck className="text-amber-400" size={32} /> إدارة <span className="text-amber-400">فريق الإدارة</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">تعيين مدراء جدد أو التحكم في صلاحيات الوصول للنظام.</p>
            </header>

            {message && <div className={`mb-8 p-5 rounded-3xl text-sm font-bold border flex items-center gap-3 animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}> {message.text} </div>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* قسم تعيين مدير جديد */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-gradient-to-br from-amber-500/10 to-transparent relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3"><UserPlus className="text-amber-400"/> ترقية مدير جديد</h3>
                            <form onSubmit={handleSearch} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-4">ابحث بالبريد الإلكتروني</label>
                                    <div className="relative">
                                        <Mail className="absolute top-1/2 right-6 -translate-y-1/2 text-gray-500" size={20}/>
                                        <input 
                                            type="email" 
                                            value={searchEmail} 
                                            onChange={e => setSearchEmail(e.target.value)}
                                            placeholder="admin@example.com" 
                                            className="w-full bg-black/40 border border-white/10 rounded-[25px] pr-16 pl-6 py-5 text-white outline-none focus:border-amber-400 font-bold transition-all"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isSearching}
                                    className="w-full bg-amber-400 text-black py-5 rounded-[25px] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {isSearching ? <RefreshCw className="animate-spin" size={18}/> : <Search size={18}/>} ابحث عن المستخدم
                                </button>
                            </form>

                            {foundUser && (
                                <div className="mt-10 p-8 bg-black/40 rounded-[40px] border-2 border-amber-400/30 animate-slideUp text-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-[25px] flex items-center justify-center text-4xl mx-auto mb-6 border border-white/10">
                                        {foundUser.photoURL ? <img src={foundUser.photoURL} className="w-full h-full object-cover rounded-[25px]" /> : foundUser.avatar || '🎓'}
                                    </div>
                                    <h4 className="text-xl font-black text-white">{foundUser.name}</h4>
                                    <p className="text-xs text-gray-500 font-mono mt-1">{foundUser.email}</p>
                                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-4 py-1.5 rounded-full mt-4 inline-block border border-amber-500/20">الرتبة الحالية: {foundUser.role}</p>
                                    
                                    {foundUser.role === 'admin' ? (
                                        <div className="mt-8 flex items-center gap-2 justify-center text-green-400 font-bold text-xs">
                                            <ShieldCheck size={16}/> المستخدم مدير بالفعل
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => promoteUser(foundUser.uid)}
                                            className="w-full mt-8 bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl"
                                        >
                                            🚀 ترقية لصلاحية مدير
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* قائمة المدراء الحاليين */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="glass-panel p-8 md:p-10 rounded-[50px] border-white/5 bg-[#0a1118]/80 min-h-[600px] flex flex-col">
                        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-8">
                            <h3 className="text-2xl font-black text-white">قائمة المدراء ({admins.length})</h3>
                            <button onClick={loadAdmins} className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button>
                        </div>

                        <div className="space-y-4 flex-1">
                            {isLoading ? (
                                <div className="py-20 text-center animate-pulse"><RefreshCw className="w-12 h-12 text-amber-400 animate-spin mx-auto" /></div>
                            ) : admins.map(admin => (
                                <div key={admin.uid} className={`p-6 rounded-[35px] border flex items-center justify-between group transition-all ${admin.uid === currentUserUid ? 'bg-amber-400 border-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-white/[0.02] border-white/5 text-white hover:bg-white/[0.05]'}`}>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl overflow-hidden ${admin.uid === currentUserUid ? 'bg-black/20' : 'bg-black/40 border border-white/10'}`}>
                                            {admin.photoURL ? <img src={admin.photoURL} className="w-full h-full object-cover" /> : admin.avatar || <UserIcon/>}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-lg flex items-center gap-2">
                                                {admin.name}
                                                {admin.uid === currentUserUid && <span className="text-[8px] bg-black/40 text-white px-2 py-0.5 rounded-full uppercase">أنت</span>}
                                            </h4>
                                            <p className={`text-xs font-medium opacity-60`}>{admin.email}</p>
                                        </div>
                                    </div>
                                    {admin.uid !== currentUserUid && (
                                        <button 
                                            onClick={() => demoteAdmin(admin)}
                                            className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                                            title="سحب صلاحيات المدير"
                                        >
                                            <ShieldAlert size={20}/>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 p-8 bg-black/40 rounded-[40px] border border-white/5 flex items-start gap-6">
                            <div className="w-12 h-12 bg-amber-400/10 text-amber-400 rounded-2xl flex items-center justify-center shrink-0 border border-amber-400/20"><AlertCircle/></div>
                            <div>
                                <h5 className="font-black text-white text-sm mb-1 uppercase tracking-tighter">تحذير أمني</h5>
                                <p className="text-gray-500 text-xs leading-relaxed">المدراء يمتلكون صلاحيات كاملة للوصول للبيانات المالية، حذف المستخدمين، وتعديل المناهج. يرجى الترقية فقط للأشخاص الموثوقين.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminManager;
