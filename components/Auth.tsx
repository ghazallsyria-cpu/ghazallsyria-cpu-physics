
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { supabase } from '../services/supabase';
import { Phone, User as UserIcon, ShieldCheck, AlertCircle, Mail, Lock } from 'lucide-react';

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
        
        // Supabase sometimes returns a user but no session if email confirmation is on. 
        // We will assume success if no error, but check for user.
        if (authData.user) {
             const newUser: User = {
                uid: authData.user.id, 
                name: name || 'مستخدم جديد', 
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
            
            try {
                await dbService.saveUser(newUser);
                user = newUser;
            } catch (saveError) {
                console.error("Profile creation failed, but auth succeeded:", saveError);
                // Try to proceed anyway, the App.tsx might handle fetching/creating
            }
        } else {
             setMessage({ text: "يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.", type: 'success' });
             setIsLoading(false);
             return;
        }

      } else {
        // Sign In
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;
        if (authData.user) {
            user = await dbService.getUser(authData.user.id);
            // If user exists in Auth but not in Profiles (rare sync issue), force create profile
            if (!user) {
                 const recoveredUser: User = {
                    uid: authData.user.id,
                    name: 'مستخدم',
                    email: authData.user.email!,
                    role: 'student',
                    grade: '12',
                    subscription: 'free',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    progress: { completedLessonIds: [], achievements: [], points: 0 }
                };
                await dbService.saveUser(recoveredUser);
                user = recoveredUser;
            }
        }
      }
      
      if (user) onLogin(user);
      
    } catch (error: any) {
        console.error(error);
        let errorMsg = error.message;
        if (errorMsg === "Invalid login credentials") errorMsg = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        if (errorMsg.includes("User already registered")) errorMsg = "هذا البريد مسجل مسبقاً، حاول تسجيل الدخول.";
        setMessage({ text: errorMsg, type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const redirectUrl = window.location.origin; 
      
      const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: redirectUrl,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
          }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      let msg = `فشل الاتصال بجوجل: ${error.message}`;
      
      // Handle the specific error user reported
      if (error.message?.includes('provider is not enabled') || error.code === 'validation_failed' || error.message?.includes('Unsupported provider')) {
          msg = "تسجيل الدخول عبر Google غير مفعل في الإعدادات حالياً. يرجى استخدام البريد الإلكتروني وكلمة المرور.";
      }
      
      setMessage({ text: msg, type: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-geometric-pattern font-['Tajawal']" dir="rtl">
        <div className="w-full max-w-md bg-blue-950/[0.8] border border-white/10 p-8 rounded-[40px] relative overflow-hidden backdrop-blur-xl shadow-2xl animate-slideUp">
            <button onClick={onBack} className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">✕</button>
            
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-amber-400 rounded-[30px] flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-amber-400/20">
                    ⚛️
                </div>
                <h2 className="text-3xl font-black text-white mb-2">{isResetMode ? 'استعادة الحساب' : isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
                <p className="text-gray-400 text-sm font-medium">المنصة التعليمية للفيزياء - الكويت</p>
            </div>
            
            {message.text && (
                <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.type === 'error' && <AlertCircle size={18} className="shrink-0" />}
                    {message.text}
                </div>
            )}
            
            {isResetMode ? (
              <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  setIsLoading(true);
                  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
                  setIsLoading(false);
                  if (!error) setMessage({text: 'تم إرسال رابط الاستعادة إلى بريدك الإلكتروني.', type: 'success'});
                  else setMessage({text: error.message, type: 'error'}); 
              }} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">البريد الإلكتروني</label>
                    <div className="relative">
                        <Mail className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500" size={18} />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="name@example.com" />
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-amber-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg mt-4">
                    {isLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                </button>
                <button type="button" onClick={() => setIsResetMode(false)} className="w-full text-gray-500 text-xs font-bold hover:text-white mt-4">العودة لتسجيل الدخول</button>
              </form>
            ) : ( 
            <>
              <form onSubmit={handleAuth} className="space-y-5"> 
                {isRegistering && ( 
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-2"> 
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الاسم الكامل</label> 
                      <div className="relative">
                          <UserIcon className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500" size={18} />
                          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-white outline-none focus:border-amber-400 transition-all" placeholder="الاسم الثلاثي" required /> 
                      </div>
                    </div> 
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الجنس</label>
                            <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-amber-400 appearance-none">
                                <option value="male">ذكر 👨</option>
                                <option value="female">أنثى 👩</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الصف الدراسي</label> 
                            <select value={grade} onChange={e => setGrade(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-amber-400 appearance-none"> 
                                <option value="10">الصف 10</option> 
                                <option value="11">الصف 11</option> 
                                <option value="12">الصف 12</option> 
                            </select> 
                        </div>
                    </div>
                  </div>
                )} 
                
                <div className="space-y-2"> 
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">البريد الإلكتروني</label> 
                  <div className="relative">
                      <Mail className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500" size={18} />
                      <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="name@example.com" required /> 
                  </div>
                </div> 
                
                {isRegistering && (
                  <div className="space-y-2"> 
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">رقم الموبايل (واتساب)</label> 
                    <div className="relative">
                      <Phone className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500" size={18} />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="965XXXXXXXX" /> 
                    </div>
                  </div> 
                )}

                <div className="space-y-2"> 
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">كلمة المرور</label> 
                  <div className="relative">
                      <Lock className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500" size={18} />
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-4 text-white outline-none focus:border-amber-400 transition-all ltr text-left" placeholder="••••••••" required /> 
                  </div>
                </div> 

                {!isRegistering && ( <div className="flex justify-end"> <button type="button" onClick={() => setIsResetMode(true)} className="text-[10px] font-bold text-gray-500 hover:text-amber-400">نسيت كلمة المرور؟</button> </div> )} 
                
                <button type="submit" disabled={isLoading} className="w-full bg-amber-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 mt-4 shadow-lg shadow-amber-400/20">
                    {isLoading ? 'جاري المعالجة...' : isRegistering ? 'إنشاء الحساب' : 'دخول'}
                </button> 
              </form>
              
              <div className="relative flex py-6 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">أو</span>
                  <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 group text-xs">
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4 group-hover:scale-110 transition-transform grayscale group-hover:grayscale-0" />}
                الاستمرار باستخدام جوجل
              </button>

              <div className="pt-6 border-t border-white/5 text-center mt-6"> 
                <button type="button" onClick={() => { setIsRegistering(!isRegistering); setMessage({text:'', type: ''}); }} className="text-xs font-bold text-gray-400 hover:text-white transition-colors">
                    {isRegistering ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'مستخدم جديد؟ إنشاء حساب'}
                </button> 
              </div>
            </>
            )}
        </div>
    </div>
  );
};

export default Auth;
