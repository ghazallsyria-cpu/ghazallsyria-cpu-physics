
import React, { useState } from 'react';

const TeacherJoin: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', specialization: '', experience: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6 animate-fadeIn">
      <div className="text-center mb-16">
        <span className="text-[#00d2ff] font-black uppercase tracking-[0.4em] text-[10px]">Work with us</span>
        <h2 className="text-5xl font-black mt-4 mb-6">انضم إلى الفريق <span className="text-[#00d2ff]">الأكاديمي</span></h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">نبحث عن أفضل معلمي الفيزياء في الكويت لنصنع مستقبلاً تعليمياً مختلفاً مدعوماً بالذكاء الاصطناعي.</p>
      </div>

      {submitted ? (
        <div className="glass-panel p-16 rounded-[60px] text-center border-[#00d2ff]/20">
          <div className="text-6xl mb-8">📬</div>
          <h3 className="text-2xl font-black mb-4">تم استلام طلبك بنجاح!</h3>
          <p className="text-gray-500">سيقوم فريقنا الأكاديمي بمراجعة سيرتك الذاتية والتواصل معك قريباً لإجراء مقابلة تقنية.</p>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-[60px] border-white/5 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase mr-4">الاسم الكامل</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#00d2ff]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase mr-4">البريد الإلكتروني</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#00d2ff]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase mr-4">التخصص الدقيق</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#00d2ff]">
                <option>فيزياء المرحلة الثانوية</option>
                <option>فيزياء جامعية - ميكانيكا</option>
                <option>فيزياء جامعية - كهرومغناطيسية</option>
                <option>فيزياء نووية</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase mr-4">سنوات الخبرة</label>
              <input type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#00d2ff]" />
            </div>
            <div className="col-span-full space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase mr-4">نبذة عن مسيرتك المهنية</label>
              <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#00d2ff] h-32"></textarea>
            </div>
            <button type="submit" className="col-span-full bg-[#00d2ff] text-black py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">إرسال طلب الانضمام</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeacherJoin;