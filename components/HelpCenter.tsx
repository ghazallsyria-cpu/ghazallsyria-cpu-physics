
import React from 'react';
import { Home, Rocket, Zap, MessageSquare, Trophy, FlaskConical } from 'lucide-react';

const HelpCenter: React.FC = () => {
  const features = [
    {
      icon: <Home />,
      title: 'لوحة التحكم',
      description: 'نقطة انطلاقك الرئيسية. تعرض ملخصاً لتقدمك، نقاطك المكتسبة، وأحدث التوصيات المخصصة لك لمتابعة رحلتك التعليمية.',
    },
    {
      icon: <Rocket />,
      title: 'المنهج الدراسي',
      description: 'تصفح جميع الوحدات والدروس المعتمدة. يمكنك من هنا إكمال الدروس، مشاهدة الأمثلة، وحل التمارين خطوة بخطوة.',
    },
    {
      icon: <Zap />,
      title: 'مركز الاختبارات',
      description: 'اختبر فهمك للمواد من خلال مجموعة متنوعة من الاختبارات القصيرة والشاملة. احصل على نتائج فورية وقيّم مستواك.',
    },
    {
      icon: <MessageSquare />,
      title: 'المساعد الذكي',
      description: 'هل لديك سؤال صعب أو مسألة فيزيائية؟ اسأل المساعد الذكي وسيقوم بتبسيط المفاهيم وشرحها لك بأسلوب علمي واضح.',
    },
    {
      icon: <Trophy />,
      title: 'التحديات ولوحة الصدارة',
      description: 'تنافس مع زملائك، أكمل التحديات الأسبوعية، واكسب نقاط الخبرة (XP) لتتصدر لوحة الأبطال وتثبت تفوقك.',
    },
    {
      icon: <FlaskConical />,
      title: 'المختبر التفاعلي',
      description: 'جرّب القوانين الفيزيائية بنفسك! تحكم في المتغيرات مثل الجهد والمقاومة وشاهد النتائج مباشرة في محاكاة تفاعلية.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white" dir="rtl">
      <header className="mb-16 text-center">
        <div className="inline-block p-6 bg-[#00d2ff]/10 border border-[#00d2ff]/20 rounded-full mb-8">
          <span className="text-5xl">💡</span>
        </div>
        <h2 className="text-5xl font-black mb-4 tracking-tighter">دليل <span className="text-[#00d2ff] text-glow">البدء السريع</span></h2>
        <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto">
          مرحباً بك في المركز السوري للعلوم! إليك جولة سريعة على أهم أقسام المنصة لمساعدتك في الانطلاق.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="glass-card p-10 rounded-[50px] border-white/5 group hover:border-[#00d2ff]/30 transition-all text-right animate-slideUp"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#00d2ff]/10 text-[#00d2ff] rounded-2xl flex items-center justify-center border border-[#00d2ff]/20 group-hover:scale-110 transition-transform">
                {React.cloneElement(feature.icon, { size: 24 })}
              </div>
              <h3 className="text-2xl font-black text-white">{feature.title}</h3>
            </div>
            <p className="text-gray-400 text-base leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      <footer className="mt-20 text-center">
        <p className="text-gray-500 font-bold">أنت الآن جاهز للانطلاق. نتمنى لك رحلة تعليمية ممتعة ومثمرة!</p>
      </footer>
    </div>
  );
};

export default HelpCenter;
