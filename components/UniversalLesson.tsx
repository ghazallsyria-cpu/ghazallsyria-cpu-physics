
import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Calculator, LineChart, ChevronDown, ChevronUp, 
  ZoomIn, X, Info, CheckCircle2, FlaskConical, Play, Share2 
} from 'lucide-react';
import katex from 'katex';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// تسجيل مكونات المخطط البياني
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- أنواع البيانات للقالب (لإعادة الاستخدام) ---
interface LessonData {
  id: string;
  title: string;
  grade: string;
  subject: string;
  objectives: string[];
  introduction: string;
  mainEquation: string; // LaTeX
  variables: { symbol: string; name: string; unit: string }[];
  contentSections: { title: string; content: string; image?: string }[];
  calculator: {
    type: 'kinetic_energy' | 'ohm_law' | 'force'; // يمكن توسيعها
    initialValues: Record<string, number>;
  };
}

// --- مكون فرعي: عارض المعادلات ---
const MathBlock: React.FC<{ tex: string; inline?: boolean }> = ({ tex, inline }) => {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: !inline });
  return <span dangerouslySetInnerHTML={{ __html: html }} className={inline ? "font-serif text-[#00d2ff]" : "block my-4 text-center text-xl md:text-2xl text-white"} />;
};

// --- المكون الرئيسي للقالب ---
const UniversalLesson: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // 1. بيانات الدرس (يمكن جلبها من قاعدة البيانات لاحقاً)
  const lessonData: LessonData = {
    id: "lesson-001",
    title: "الطاقة الحركية (Kinetic Energy)",
    grade: "11",
    subject: "الفيزياء",
    objectives: [
      "تعريف الطاقة الحركية وعلاقتها بالكتلة والسرعة.",
      "استنتاج المعادلة الرياضية للطاقة الحركية.",
      "تطبيق القانون في مسائل حسابية وتفاعلية.",
      "تحليل الرسم البياني للعلاقة بين الطاقة والسرعة."
    ],
    introduction: "الطاقة الحركية هي الطاقة التي يمتلكها الجسم بسبب حركته. وهي تعتمد بشكل مباشر على كل من كتلة الجسم وسرعته، وتلعب دوراً أساسياً في فهم تصادمات السيارات وحركة الكواكب.",
    mainEquation: "KE = \\frac{1}{2} m v^2",
    variables: [
      { symbol: "KE", name: "الطاقة الحركية", unit: "Joule (J)" },
      { symbol: "m", name: "الكتلة", unit: "kg" },
      { symbol: "v", name: "السرعة", unit: "m/s" }
    ],
    contentSections: [
      {
        title: "العوامل المؤثرة",
        content: "نلاحظ من المعادلة أن الطاقة الحركية تتناسب طردياً مع الكتلة ($m$)، وتتناسب طردياً مع مربع السرعة ($v^2$). هذا يعني أن مضاعفة السرعة تؤدي إلى زيادة الطاقة الحركية بمقدار أربعة أضعاف!",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80" // صورة تجريبية
      }
    ],
    calculator: {
      type: 'kinetic_energy',
      initialValues: { m: 50, v: 10 }
    }
  };

  // 2. إدارة الحالة (State Management)
  const [calcValues, setCalcValues] = useState(lessonData.calculator.initialValues);
  const [result, setResult] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // 3. منطق الحساب والرسم البياني
  useEffect(() => {
    if (lessonData.calculator.type === 'kinetic_energy') {
      const ke = 0.5 * calcValues.m * Math.pow(calcValues.v, 2);
      setResult(ke);
    }
  }, [calcValues]);

  // بيانات الرسم البياني (ديناميكية)
  const chartData = {
    labels: [0, 5, 10, 15, 20, 25, 30], // سرعات مختلفة
    datasets: [
      {
        label: `الطاقة الحركية (كتلة ${calcValues.m} كجم)`,
        data: [0, 5, 10, 15, 20, 25, 30].map(v => 0.5 * calcValues.m * Math.pow(v, 2)),
        borderColor: '#00d2ff',
        backgroundColor: 'rgba(0, 210, 255, 0.2)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#fff', font: { family: 'Tajawal' } } },
      tooltip: { backgroundColor: '#0a1118', titleColor: '#fbbf24', bodyFont: { family: 'Tajawal' } }
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } },
      x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A2540] font-['Tajawal'] text-right text-white pb-20 animate-fadeIn" dir="rtl">
      
      {/* 1. Header / Hero Section */}
      <div className="relative h-[300px] overflow-hidden rounded-b-[60px] border-b border-white/10 shadow-2xl mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-[#0A2540] to-black opacity-90 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
        
        <div className="relative z-20 container mx-auto px-6 h-full flex flex-col justify-center items-start">
          <div className="flex gap-3 mb-4">
            <span className="px-4 py-1 bg-[#fbbf24] text-black rounded-full text-xs font-black uppercase tracking-widest">الصف {lessonData.grade}</span>
            <span className="px-4 py-1 bg-white/10 text-white rounded-full text-xs font-black uppercase tracking-widest border border-white/10">{lessonData.subject}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">{lessonData.title}</h1>
          <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">{lessonData.introduction}</p>
          <button onClick={onBack} className="absolute top-8 left-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 2. Main Content Column */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Objectives */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8">
            <h3 className="text-2xl font-black text-[#fbbf24] mb-6 flex items-center gap-3">
              <CheckCircle2 /> أهداف الدرس
            </h3>
            <ul className="space-y-4">
              {lessonData.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="w-6 h-6 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] flex items-center justify-center text-xs font-black shrink-0 mt-1">{i + 1}</span>
                  <span className="text-gray-300 leading-relaxed">{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Theoretical Content & Equations */}
          <div className="space-y-8">
            <div className="glass-panel p-10 rounded-[40px] border-l-4 border-[#00d2ff] bg-gradient-to-r from-[#00d2ff]/5 to-transparent">
              <h3 className="text-xl font-black text-white mb-6">الصيغة الرياضية</h3>
              <MathBlock tex={lessonData.mainEquation} />
              <div className="grid grid-cols-3 gap-4 mt-8 text-center">
                {lessonData.variables.map((v, i) => (
                  <div key={i} className="bg-black/30 p-4 rounded-2xl border border-white/5">
                    <MathBlock tex={v.symbol} inline />
                    <p className="text-xs text-gray-400 mt-2 font-bold">{v.name}</p>
                    <p className="text-[10px] text-[#fbbf24] font-mono mt-1">({v.unit})</p>
                  </div>
                ))}
              </div>
            </div>

            {lessonData.contentSections.map((section, i) => (
              <div key={i} className="space-y-6">
                <h3 className="text-2xl font-bold text-white border-r-4 border-[#fbbf24] pr-4">{section.title}</h3>
                <div className="prose prose-invert max-w-none text-gray-300 text-lg leading-loose">
                  <p dangerouslySetInnerHTML={{__html: section.content.replace(/\$(.*?)\$/g, (match) => katex.renderToString(match.slice(1, -1), {throwOnError:false}))}} />
                </div>
                {section.image && (
                  <div 
                    className="relative group rounded-[30px] overflow-hidden border border-white/10 cursor-zoom-in"
                    onClick={() => setLightboxImage(section.image || null)}
                  >
                    <img src={section.image} alt={section.title} className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="text-white w-10 h-10" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/40">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
              <LineChart className="text-[#00d2ff]" /> تحليل البيانات بيانياً
            </h3>
            <div className="h-[300px] w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">العلاقة البيانية تتحدث تلقائياً عند تغيير القيم في الحاسبة أدناه.</p>
          </div>

        </div>

        {/* 3. Interactive Sidebar (Sticky) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-8">
            {/* Calculator Card */}
            <div className="glass-panel p-8 rounded-[40px] border-[#fbbf24]/20 bg-[#fbbf24]/5 shadow-xl mb-8 relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#fbbf24]/10 rounded-full blur-[50px]"></div>
              
              <h3 className="text-xl font-black text-[#fbbf24] mb-6 flex items-center gap-3 relative z-10">
                <Calculator /> مختبر الحساب
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">الكتلة (m)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" min="1" max="1000" step="1" 
                      value={calcValues.m} 
                      onChange={(e) => setCalcValues({...calcValues, m: Number(e.target.value)})}
                      className="flex-1 h-2 bg-black/40 rounded-full appearance-none accent-[#fbbf24] cursor-pointer"
                    />
                    <input 
                      type="number" value={calcValues.m} 
                      onChange={(e) => setCalcValues({...calcValues, m: Number(e.target.value)})}
                      className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center text-white font-mono text-sm focus:border-[#fbbf24] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">السرعة (v)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" min="0" max="100" step="1" 
                      value={calcValues.v} 
                      onChange={(e) => setCalcValues({...calcValues, v: Number(e.target.value)})}
                      className="flex-1 h-2 bg-black/40 rounded-full appearance-none accent-[#00d2ff] cursor-pointer"
                    />
                    <input 
                      type="number" value={calcValues.v} 
                      onChange={(e) => setCalcValues({...calcValues, v: Number(e.target.value)})}
                      className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center text-white font-mono text-sm focus:border-[#00d2ff] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 text-center animate-pulse">
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">النتيجة النهائية</p>
                  <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] tabular-nums">
                    {result.toLocaleString()} <span className="text-lg text-[#fbbf24]">J</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all">
                <Share2 size={20} className="text-[#00d2ff]" />
                <span className="text-[10px] font-bold">مشاركة الدرس</span>
              </button>
              <button className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all">
                <FlaskConical size={20} className="text-purple-400" />
                <span className="text-[10px] font-bold">ورقة العمل</span>
              </button>
            </div>

            {/* Floating Toggle Quiz */}
            <div className="mt-8 bg-black/40 rounded-[30px] border border-white/5 overflow-hidden">
                <button 
                  onClick={() => setShowQuiz(!showQuiz)}
                  className="w-full flex justify-between items-center p-6 hover:bg-white/5 transition-all"
                >
                   <span className="font-bold flex items-center gap-3"><Info size={18} className="text-green-400"/> اختبر فهمك</span>
                   {showQuiz ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                </button>
                {showQuiz && (
                  <div className="p-6 pt-0 border-t border-white/5 bg-black/20">
                     <p className="text-sm text-gray-300 mb-4">ماذا يحدث للطاقة الحركية إذا تضاعفت السرعة؟</p>
                     <div className="space-y-2">
                        {['تزداد للضعف', 'تزداد 4 أضعاف', 'تبقى ثابتة'].map((opt, idx) => (
                          <button key={idx} className="w-full text-right p-3 rounded-xl bg-white/5 hover:bg-[#00d2ff]/20 hover:text-[#00d2ff] transition-all text-xs font-bold border border-white/5">
                            {opt}
                          </button>
                        ))}
                     </div>
                  </div>
                )}
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 pt-10 text-center text-gray-600 text-sm">
        <p>© 2024 المركز السوري للعلوم - جميع الحقوق محفوظة</p>
      </footer>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Zoom" className="max-w-full max-h-[90vh] rounded-[30px] shadow-2xl border-2 border-white/10" />
          <button className="absolute top-8 right-8 text-white bg-white/10 p-4 rounded-full hover:bg-red-500 transition-all">
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UniversalLesson;
