
import React, { useState, useRef } from 'react';
import { Question, SubjectType, BranchType } from '../types';
import { extractBankQuestionsAdvanced, verifyQuestionQuality, digitizeExamPaper } from '../services/gemini';
import { dbService } from '../services/db';

const AdminQuestionManager: React.FC = () => {
  const [mode, setMode] = useState<'TEXT' | 'SCAN'>('TEXT');
  const [rawInput, setRawInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [grade, setGrade] = useState('12');
  const [subject, setSubject] = useState<SubjectType>('Physics');
  const [branch, setBranch] = useState<BranchType>('Scientific');
  const [unit, setUnit] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedBatches, setExtractedBatches] = useState<Question[][]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [verifyingIndex, setVerifyingIndex] = useState<number | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, { valid: boolean, feedback: string }>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartExtraction = async () => {
    if (mode === 'TEXT' && !rawInput.trim()) { alert("يرجى إدخال النص."); return; }
    if (mode === 'SCAN' && !imagePreview) { alert("يرجى رفع صورة الملف."); return; }
    if (!unit.trim()) { alert("يرجى إدخال اسم الوحدة."); return; }

    setIsExtracting(true);
    setStatus(mode === 'TEXT' ? `جاري تحليل النص...` : `جاري المسح الضوئي الذكي للمستند (Gemini Vision)...`);
    setVerificationResults({});
    
    try {
      let result;
      if (mode === 'TEXT') {
        result = await extractBankQuestionsAdvanced(rawInput, grade, subject, unit);
      } else {
        result = await digitizeExamPaper(imagePreview!, grade, subject);
      }

      const allQuestions = result.questions.map((q: any, idx: number) => ({
        ...q,
        id: `temp-${idx}-${Date.now()}`,
        grade,
        subject,
        branch,
        unit,
        category: q.category || (grade === 'university' ? 'university' : 'secondary'),
        // إذا كان السؤال صورة، نستخدم الصورة الأصلية مؤقتاً كسياق (في التطبيق الحقيقي سنقوم بقصها)
        imageUrl: q.hasDiagram ? imagePreview : undefined 
      }));

      const batches = [];
      for (let i = 0; i < allQuestions.length; i += 20) {
        batches.push(allQuestions.slice(i, i + 20));
      }

      setExtractedBatches(batches);
      setCurrentBatchIndex(0);
      setStatus(`تم استخراج ${allQuestions.length} سؤالاً بنجاح. يرجى الفحص والاعتماد.`);
    } catch (e) {
      console.error(e);
      setStatus("حدث خطأ في محرك الرقمنة. تأكد من وضوح الصورة أو النص.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVerifyQuality = async (question: Question, index: number) => {
    setVerifyingIndex(index);
    try {
      const result = await verifyQuestionQuality(question);
      setVerificationResults(prev => ({ ...prev, [question.id]: result }));
    } catch (e) {
      setVerificationResults(prev => ({ ...prev, [question.id]: { valid: false, feedback: "خطأ فني." } }));
    } finally {
      setVerifyingIndex(null);
    }
  };

  const handleImportBatch = async (batch: Question[]) => {
    setStatus(`جاري حفظ الدفعة ${currentBatchIndex + 1} في قاعدة البيانات...`);
    try {
      for (const q of batch) {
        const { id, ...cleanQ } = q;
        await dbService.saveQuestion(cleanQ as Question);
      }
      setStatus(`تم حفظ الدفعة ${currentBatchIndex + 1} ✅`);
      if (currentBatchIndex < extractedBatches.length - 1) {
        setCurrentBatchIndex(prev => prev + 1);
        setVerificationResults({});
      } else {
        setStatus("اكتملت الرقمنة للدفعة التجريبية 5C ✅");
        setExtractedBatches([]);
        setImagePreview(null);
        setRawInput('');
      }
    } catch (e) {
      setStatus("فشل الحفظ.");
    }
  };

  return (
    <div className="p-8 font-['Tajawal'] text-white max-w-7xl mx-auto animate-fadeIn" dir="rtl">
      <header className="mb-12 border-r-4 border-[#fbbf24] pr-8">
        <h2 className="text-5xl font-black mb-2 tracking-tighter italic uppercase">محول <span className="text-[#fbbf24]">الدفعة التجريبية</span> 5C</h2>
        <p className="text-gray-500 text-xl font-medium italic">رقمنة وفحص الأسئلة من النصوص والملفات (Word/PPT/Images).</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
          <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-white/[0.02]">
            
            {/* Input Type Toggle */}
            <div className="flex bg-black/40 p-2 rounded-[20px] mb-8 border border-white/10">
               <button onClick={() => setMode('TEXT')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${mode === 'TEXT' ? 'bg-[#fbbf24] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>نص مباشر (Text)</button>
               <button onClick={() => setMode('SCAN')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${mode === 'SCAN' ? 'bg-[#00d2ff] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>مسح ضوئي (OCR 📸)</button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">المادة</label>
                <select value={subject} onChange={e => setSubject(e.target.value as SubjectType)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#fbbf24] font-bold">
                  <option value="Physics">الفيزياء</option>
                  <option value="Math">الرياضيات</option>
                  <option value="Chemistry">الكيمياء</option>
                  <option value="English">اللغة الإنجليزية</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الصف</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#fbbf24] font-bold">
                  <option value="10">العاشر</option>
                  <option value="11">الحادي عشر</option>
                  <option value="12">الثاني عشر</option>
                  <option value="university">الجامعة (Foundation)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الوحدة</label>
                <input type="text" placeholder="مثال: ميكانيكا الكم" value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#fbbf24] font-bold" />
              </div>
            </div>

            {mode === 'TEXT' ? (
              <textarea 
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="الصق نص بنك أسئلة الوزارة هنا..."
                className="w-full h-80 bg-black/60 border-2 border-white/5 rounded-[40px] p-8 text-lg outline-none focus:border-[#fbbf24] transition-all no-scrollbar italic"
              />
            ) : (
              <div className="h-80 bg-black/60 border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#00d2ff]/40 transition-all">
                 {!imagePreview ? (
                   <>
                     <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📂</span>
                     <p className="font-bold text-gray-500 text-sm">اضغط لرفع ملف (Word/PPT/Image)</p>
                     <p className="text-[10px] text-gray-600 mt-2">نقبل لقطات الشاشة أو صور المستندات</p>
                     <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                   </>
                 ) : (
                   <>
                     <img src={imagePreview} alt="Preview" className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
                     <button onClick={(e) => { e.stopPropagation(); setImagePreview(null); }} className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 text-xs z-10 hover:bg-red-600">✕</button>
                   </>
                 )}
              </div>
            )}
            
            <button 
              onClick={handleStartExtraction}
              disabled={isExtracting || (mode === 'TEXT' && !rawInput.trim()) || (mode === 'SCAN' && !imagePreview)}
              className={`w-full mt-8 ${mode === 'TEXT' ? 'bg-[#fbbf24]' : 'bg-[#00d2ff]'} text-black font-black py-6 rounded-[30px] shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 text-xl`}
            >
              {isExtracting ? 'جاري الرقمنة...' : mode === 'TEXT' ? 'بدء الرقمنة والتحليل 🤖' : 'بدء المسح الضوئي (Gemini) 👁️'}
            </button>
            
            {status && (
              <div className="mt-6 p-4 bg-white/5 rounded-2xl text-xs text-center border border-white/10 text-[#00d2ff]">
                {status}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
           <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-[#00d2ff]/5 h-[800px] flex flex-col">
              <h3 className="text-2xl font-black mb-6 flex justify-between items-center">
                <span>معاينة دفعة ( {subject} )</span>
                {extractedBatches.length > 0 && <span className="text-sm text-[#00d2ff]">الدفعة {currentBatchIndex+1} من {extractedBatches.length}</span>}
              </h3>
              
              <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-2 pb-10">
                {extractedBatches[currentBatchIndex]?.map((q, qIdx) => (
                  <div key={q.id} className="p-8 bg-black/40 border border-white/5 rounded-[40px] space-y-5 group hover:border-[#fbbf24]/30 transition-all relative">
                     {q.hasDiagram && (
                        <div className="absolute top-6 left-6 text-xl" title="يحتوي على رسم بياني">📊</div>
                     )}
                     <div className="flex justify-between text-[9px] font-black">
                        <div className="flex gap-3">
                           <span className="text-[#fbbf24] uppercase tracking-widest">{q.type}</span>
                           <span className="text-gray-600 uppercase">| {q.difficulty}</span>
                        </div>
                        <span className="text-[#00d2ff] uppercase">{q.category}</span>
                     </div>
                     
                     <p className="text-lg font-bold text-white leading-relaxed">{(q as any).question_text || q.text}</p>
                     
                     <div className="grid grid-cols-2 gap-4">
                        {((q as any).choices || q.answers) && ((q as any).choices || q.answers).length > 0 ? (
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/10 col-span-2">
                             <p className="text-[8px] font-black text-gray-400 uppercase mb-2">الخيارات:</p>
                             <div className="grid grid-cols-2 gap-2">
                               {((q as any).choices || q.answers).map((c: any) => <span key={c.key || c.id} className={`text-xs ${(c.key || c.id) === ((q as any).correct_answer || q.correctChoiceId) ? 'text-green-400 font-bold' : 'text-gray-500'}`}>{c.key || c.id.split('-').pop()}) {c.text}</span>)}
                             </div>
                           </div>
                        ) : null}
                        <div className="bg-green-500/5 p-4 rounded-2xl border border-green-500/10 col-span-2">
                           <p className="text-[8px] font-black text-green-400 uppercase mb-2">الحل النموذجي:</p>
                           <p className="text-[9px] text-gray-500">{q.solution}</p>
                        </div>
                     </div>

                     <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                        <button 
                           onClick={() => handleVerifyQuality(q, qIdx)}
                           disabled={verifyingIndex === qIdx}
                           className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                             verificationResults[q.id]?.valid 
                               ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                               : 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 hover:bg-[#fbbf24] hover:text-black'
                           }`}
                        >
                           {verifyingIndex === qIdx ? 'جاري فحص الجودة...' : verificationResults[q.id]?.valid ? 'تم الاعتماد آلياً ✓' : 'بدء الفحص الآلي 🤖'}
                        </button>
                        
                        {verificationResults[q.id] && (
                          <div className={`p-4 rounded-2xl text-[10px] italic ${verificationResults[q.id].valid ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {verificationResults[q.id].feedback}
                          </div>
                        )}
                     </div>
                  </div>
                ))}

                {extractedBatches.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <span className="text-8xl mb-8">📥</span>
                    <p className="font-black text-lg uppercase tracking-[0.4em]">بانتظار تلقيم المحرك</p>
                  </div>
                )}
              </div>

              {extractedBatches.length > 0 && (
                <div className="pt-8 mt-4 border-t border-white/10">
                  <button 
                    onClick={() => handleImportBatch(extractedBatches[currentBatchIndex])}
                    className="w-full bg-white text-black py-6 rounded-[30px] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-105 transition-all"
                  >
                    حفظ الدفعة {currentBatchIndex+1} في البنك المركزي
                  </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionManager;