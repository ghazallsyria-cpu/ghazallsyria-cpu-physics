
import React from 'react';

const UniversityBridge: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <div className="mb-12 border-r-4 border-[#fbbf24] pr-6">
        <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">برنامج <span className="text-[#fbbf24] text-glow">الجسر الأكاديمي</span></h2>
        <p className="text-gray-400 text-xl">سد الفجوة اللغوية والرياضية للطلبة المقبلين على الدراسة الجامعية في الكويت.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="glass-panel p-10 rounded-[50px] border-white/5">
              <h3 className="text-2xl font-black mb-6 text-[#00d2ff]">منهج المرحلة الثانوية</h3>
              <ul className="space-y-4 text-gray-400 text-sm">
                 <li>• دراسة بالعربية (مصطلحات محلية).</li>
                 <li>• فيزياء تعتمد على الجبر (Algebra-based).</li>
                 <li>• التركيز على القوانين المباشرة.</li>
              </ul>
           </div>
           <div className="glass-panel p-10 rounded-[50px] border-[#fbbf24]/20 bg-[#fbbf24]/5">
              <h3 className="text-2xl font-black mb-6 text-[#fbbf24]">المنهج الجامعي (فيزياء 101)</h3>
              <ul className="space-y-4 text-gray-400 text-sm">
                 <li>• دراسة بالإنجليزية (Scientific English).</li>
                 <li>• فيزياء تعتمد على التفاضل (Calculus-based).</li>
                 <li>• التركيز على الاشتقاقات وتحليل المتجهات.</li>
              </ul>
           </div>
        </div>
    </div>
  );
};

export default UniversityBridge;