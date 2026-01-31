
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { supabase } from '../services/supabase';
import { Phone, User as UserIcon, ShieldCheck } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [grade, setGrade] = useState<'10'|'11'|'12'>('12');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  
  const emailRef = useRef<HTMLInputElement>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      let user: User | null = null;
      if (isRegistering) {
        // Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    phone: phone,
                    role: 'student',
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("No user returned");

        const newUser: User = {
            uid: authData.user.id, 
            name, 
            email, 
            phone: phone.trim() || undefined,
            gender,
            role: 'student', 
            grade,
            status: 'active', 
            subscription: 'free', 
            createdAt: new Date().toISOString(),
            progress: { completedLessonIds: [], achievements: [], points: 0 }
        };
        
        await dbService.saveUser(newUser);
        user = newUser;

      } else {
        // Sign In
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;
        if (authData.user) {
            user = await dbService.getUser(authData.user.id);
        }
      }
      
      if (user) onLogin(user);
      
    } catch (error: any) {
        console.error(error);
        setMessage({ text: error.message || "خطأ في البريد أو كلمة المرور.", type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: window.location.origin,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
          }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(error);
      setMessage({ text: 'فشل بدء تسجيل الدخول عبر جوجل. يرجى المحاولة مرة أخرى.', type: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-geometric-pattern font-['Tajawal']" dir="rtl">
        <div className="w-full max-w-md bg-blue-950/[0.6] border border-white/10 p-8 rounded-[40px] relative overflow-hidden backdrop-blur-xl shadow-2xl">
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors">✕</button>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white mb-2">{isResetMode ? 'استعادة كلمة المرور' : isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
                <p className="text-amber-400/50 text-sm font-bold uppercase tracking-widest">المركز السوري للعلوم</p>
            </div>
            {message.text && (<div className={`mb-6 p-4 rounded-2xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</div>)}
            
            {isResetMode ? (
              <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  const { error } = await supabase.auth.resetPasswordForEmail(email);
                  if (!error) setMessage({text: 'تم إرسال الرابط', type: 'success'});
                  else setMessage({text: 'فشل الإرسال', type: 'error'}); 
              }} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="name@example.com" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-amber-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50">إرسال رابط الاستعادة</button>
                <button type="button" onClick={() => setIsResetMode(false)} className="w-full text-gray-500 text-xs font-bold hover:text-white mt-4">العودة لتسجيل الدخول</button>
              </form>
            ) : ( 
            <>
              <form onSubmit={handleAuth} className="space-y-4"> 
                {isRegistering && ( 
                  <div className="space-y-4">
                    <div> 
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الاسم الكامل</label> 
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400 transition-all" placeholder="الاسم الثلاثي" required /> 
                    </div> 
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الجنس</label>
                            <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-amber-400">
                                <option value="male">ذكر</option>
                                <option value="female">أنثى</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">الصف الدراسي</label> 
                            <select value={grade} onChange={e => setGrade(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-amber-400"> 
                                <option value="10">الصف العاشر</option> 
                                <option value="11">الصف الحادي عشر</option> 
                                <option value="12">الصف الثاني عشر</option> 
                            </select> 
                        </div>
                    </div>
                  </div>
                )} 
                <div> 
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label> 
                  <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="name@example.com" required /> 
                </div> 
                
                {isRegistering && (
                  <div> 
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">رقم الموبايل (واتساب)</label> 
                    <div className="relative">
                      <Phone className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-600" size={16} />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl pr-5 pl-12 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="965XXXXXXXX" /> 
                    </div>
                    <p className="text-[9px] text-gray-500 mt-1 font-bold">يُستخدم لتفعيل الاشتراك واستلام إيصالات "ومض".</p>
                  </div> 
                )}

                <div> 
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">كلمة المرور</label> 
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="••••••••" required /> 
                </div> 

                {!isRegistering && ( <div className="flex justify-end"> <button type="button" onClick={() => setIsResetMode(true)} className="text-[10px] font-bold text-gray-500 hover:text-amber-400">نسيت كلمة المرور؟</button> </div> )} 
                <button type="submit" disabled={isLoading} className="w-full bg-amber-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 mt-6 shadow-lg">{isLoading ? 'جاري المعالجة...' : isRegistering ? 'إنشاء الحساب' : 'دخول'}</button> 
              </form>
              
              <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-xs text-gray-500 font-bold">أو</span>
                  <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3">
                <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" /> المتابعة باستخدام جوجل
              </button>

              <div className="pt-6 border-t border-white/5 text-center mt-6"> 
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-xs font-bold text-white">{isRegistering ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب جديد'}</button> 
              </div>
            </>
            )}
        </div>
    </div>
  );
};

export default Auth;
