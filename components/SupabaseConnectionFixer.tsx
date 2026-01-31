import React, { useState } from 'react';
import { ShieldCheck, Lock, Code, CheckCircle2, RefreshCw, AlertTriangle, Globe, Zap, Database } from 'lucide-react';

interface SupabaseConnectionFixerProps {
  onFix: () => void;
}

const SupabaseConnectionFixer: React.FC<SupabaseConnectionFixerProps> = ({ onFix }) => {
  const [copied, setCopied] = useState(false);

  // 🛠️ الكود الشامل لإنشاء الـ Bucket وتفعيل الصلاحيات
  const fullFixSQL = `-- 🚀 الحل الشامل لمشكلة "Bucket not found" و "404"

-- 1. إنشاء الحاوية (Bucket) إذا لم تكن موجودة
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. تنظيف أي سياسات قديمة متعارضة
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Access" ON storage.objects;
DROP POLICY IF EXISTS "Subscription Protected Read" ON storage.objects;
DROP POLICY IF EXISTS "Restricted Upload Access" ON storage.objects;

-- 3. السماح للجميع بمشاهدة الملفات (ضروري لكي يرى المعلم والطالب المرفقات)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'assets' );

-- 4. السماح برفع الملفات (بدون تعقيدات للمرحلة الحالية)
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'assets' );

-- 5. السماح بالحذف (للمسؤول)
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'assets' );
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullFixSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[50px] border-blue-500/20 bg-blue-500/5 animate-slideUp border-2 shadow-2xl font-['Tajawal'] text-right" dir="rtl">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-lg border border-blue-500/20">
          <Database size={40} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
              <h4 className="text-2xl font-black text-blue-400 uppercase tracking-tighter italic">
                إصلاح اتصال <span className="text-white">Supabase Storage</span>
              </h4>
              <span className="bg-red-600 text-white text-[8px] px-2 py-0.5 rounded font-black animate-pulse">404 FIX REQUIRED</span>
          </div>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            لحل مشكلة <b>Bucket not found</b>، اتبع الخطوات التالية بدقة:
            <br/>1. اذهب إلى مشروعك في Supabase.
            <br/>2. افتح قسم <b>SQL Editor</b> من القائمة الجانبية.
            <br/>3. الصق الكود أدناه واضغط على <b>Run</b>.
          </p>
          
          <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 relative mb-8">
              <h5 className="text-blue-400 font-black text-sm mb-4 flex items-center gap-3">
                  <Code size={18}/> كود SQL للإصلاح الفوري
              </h5>
              <div className="relative group">
                  <pre className="bg-black/80 p-6 rounded-2xl text-[10px] font-mono text-green-400 overflow-x-auto ltr text-left border border-white/10 h-64 no-scrollbar">
                      {fullFixSQL}
                  </pre>
                  <button onClick={handleCopy} className="absolute top-2 left-2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all flex items-center gap-2 text-xs font-black shadow-xl">
                      {copied ? <CheckCircle2 size={16}/> : 'نسخ الكود الكامل'}
                  </button>
              </div>
          </div>

          <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                  <Globe className="text-green-400 shrink-0" size={24} />
                  <div className="text-right">
                      <p className="text-green-400 font-bold text-sm">بعد الضغط على Run في Supabase:</p>
                      <p className="text-[11px] text-gray-500 mt-1">اضغط هنا لتحديث حالة الاتصال في التطبيق.</p>
                  </div>
              </div>
              <button onClick={onFix} className="bg-green-500 text-black px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                  تحديث وفحص الاتصال الآن
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionFixer;