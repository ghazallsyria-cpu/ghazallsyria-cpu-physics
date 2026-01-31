import React, { useState } from 'react';
import { ShieldCheck, Code, CheckCircle2, Copy, Lock, Info } from 'lucide-react';

const FirestoreRulesFixer: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- Helper Functions ---
    function isAuth() {
      return request.auth != null;
    }
    
    function isUser(userId) {
      return isAuth() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isTeacher() {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }

    // --- Publicly Readable Collections ---
    match /settings/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /homePageContent/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // --- Authenticated Read Collections ---
    match /experiments/{expId} { allow read: if isAuth(); allow write: if isAdmin() || isTeacher(); }
    match /quizzes/{quizId} { allow read: if isAuth(); allow write: if isAdmin() || isTeacher(); }
    match /questions/{qId} { allow read: if isAuth(); allow write: if isAdmin() || isTeacher(); }
    match /forumSections/{sectionId} { allow read: if isAuth(); allow write: if isAdmin(); }
    match /recommendations/{recId} { allow read: if isAuth(); allow write: if isAdmin() || isTeacher(); }
    match /liveSessions/{sessionId} { allow read: if isAuth(); allow write: if isAdmin() || isTeacher(); }

    // --- User-Specific Data ---
    match /users/{userId} {
      allow read: if isAuth();
      allow update: if isUser(userId) || isAdmin();
      allow create, delete: if isAdmin();
    }
    
    match /users/{userId}/todos/{todoId} {
       allow read, write, create, delete: if isUser(userId);
    }
    
    match /invoices/{invoiceId} {
      allow read: if isUser(resource.data.userId) || isAdmin();
      allow write: if isAdmin();
    }
    
    match /notifications/{noteId} {
      allow read, update: if isUser(resource.data.userId);
      allow create: if isAuth(); // System/admin can create for a user
      allow delete: if isAdmin();
    }
    
    match /attempts/{attemptId} {
        allow read: if isUser(resource.data.studentId) || isAdmin() || isTeacher();
        allow create: if isUser(request.resource.data.studentId);
        allow update: if isAdmin() || isTeacher(); // For manual grading
    }
    
    // --- Forum Posts ---
    match /forumPosts/{postId} {
        allow read: if isAuth();
        allow create: if isAuth();
        allow update: if isUser(resource.data.authorUid) || isAdmin();
        allow delete: if isUser(resource.data.authorUid) || isAdmin();
    }
  }
}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(firestoreRules);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="mb-12 border-r-4 border-emerald-500 pr-8">
                <h2 className="text-4xl font-black text-white flex items-center gap-4">
                    <ShieldCheck className="text-emerald-400" /> مصلح الصلاحيات <span className="text-emerald-400">V11</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">إصلاح شامل لمنع ظهور الصفحات البيضاء (Blank Pages).</p>
            </header>

            <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 relative shadow-2xl">
                <div className="absolute top-0 right-0 p-8 text-[120px] font-black text-white/[0.02] -rotate-12 pointer-events-none select-none">
                    RULES
                </div>
                
                <div className="relative z-10">
                    <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-[40px] mb-10">
                        <div className="flex items-start gap-4">
                            <Info size={24} className="text-green-400 shrink-0" />
                            <div>
                                <h4 className="font-black text-green-400">لماذا هذا التحديث؟</h4>
                                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                                    لتعزيز الأمان ومنع الأخطاء، قمنا بتحديث قواعد الوصول. هذه القواعد الجديدة تضمن أن المحتوى العام (مثل الإعلانات) يظهر للجميع، بينما تبقى بيانات الطلاب والمعلمين محمية بشكل كامل ولا يمكن الوصول إليها إلا من قبل أصحابها أو المدراء.
                                </p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                        <Code size={24}/> قواعد Firestore الموصى بها
                    </h3>
                    
                    <div className="relative group">
                        <pre className="bg-black/80 p-6 rounded-3xl text-[10px] font-mono text-cyan-300 overflow-x-auto ltr text-left border border-white/10 h-80 no-scrollbar">
                            {firestoreRules}
                        </pre>
                        <button 
                            onClick={handleCopy}
                            className="absolute top-4 left-4 p-3 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 text-xs font-black shadow-xl"
                        >
                            {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>}
                            {copied ? 'تم النسخ!' : 'نسخ القواعد'}
                        </button>
                    </div>

                    <div className="mt-10 pt-8 border-t border-white/5">
                        <h4 className="font-black text-lg text-amber-400">خطوات التطبيق:</h4>
                        <ol className="list-decimal list-inside mt-4 space-y-3 text-gray-300 text-sm">
                            <li>اذهب إلى مشروعك في Firebase Console.</li>
                            <li>من القائمة، اختر <b className="text-white">Firestore Database</b> ثم اذهب إلى تبويب <b className="text-white">Rules</b>.</li>
                            <li>احذف القواعد القديمة بالكامل، ثم الصق القواعد الجديدة التي نسختها.</li>
                            <li>اضغط على <b className="text-amber-400">Publish</b> لحفظ التغييرات.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FirestoreRulesFixer;
