import React, { useState, useEffect } from 'react';
import { Waypoints, BrainCircuit, BarChart3, Smartphone, Tablet, Monitor, Lock, Star, Sparkles, RefreshCw } from 'lucide-react';
import QRCode from 'react-qr-code';
import { BrochureSettings, BrochureFeature } from '../types';
import { dbService } from '../services/db';

// Helper to render icons dynamically based on string names from the database
const IconMap: { [key: string]: React.FC<any> } = {
    Waypoints, BrainCircuit, BarChart3, Smartphone, Tablet, Monitor, Lock, Star, Sparkles
};

const DynamicIcon = ({ name, ...props }: { name: string, [key: string]: any }) => {
    const IconComponent = IconMap[name];
    return IconComponent ? <IconComponent {...props} /> : null;
};

// Interface for FeatureCard props
interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    color?: "amber" | "cyan";
}

// Reusable component for a feature card
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color = "amber" }) => {
    const colorClasses = {
        amber: {
            border: 'border-amber-400/20',
            bg: 'bg-amber-400/5',
            iconBg: 'bg-amber-400/10 text-amber-400',
            glow: 'shadow-[0_0_80px_rgba(251,191,36,0.15)]'
        },
        cyan: {
            border: 'border-cyan-400/20',
            bg: 'bg-cyan-400/5',
            iconBg: 'bg-cyan-400/10 text-cyan-400',
            glow: 'shadow-[0_0_80px_rgba(34,211,238,0.15)]'
        }
    };
    const classes = colorClasses[color || "amber"];

    return (
        <div className={`glass-panel p-10 rounded-[50px] border ${classes.border} ${classes.bg} ${classes.glow} backdrop-blur-2xl transition-all hover:-translate-y-2 hover:border-${color}-400/40`}>
            <div className="flex items-start gap-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 ${classes.iconBg} border border-white/5`}>
                    <DynamicIcon name={icon} size={32} />
                </div>
                <div>
                    <h3 className={`text-2xl font-black mb-2 text-white`}>{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
                </div>
            </div>
        </div>
    );
};

const MarketingBrochure: React.FC = () => {
    const [settings, setSettings] = useState<BrochureSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const data = await dbService.getBrochureSettings();
                setSettings(data);
            } catch (e) {
                console.error("Failed to load brochure settings", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const PageContainer: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
        <div className={`w-full max-w-5xl mx-auto bg-[#050a10] border border-white/10 rounded-[60px] shadow-2xl p-12 md:p-20 relative overflow-hidden ${className}`}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>
            {children}
        </div>
    );
    
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0A2540] flex items-center justify-center">
                <RefreshCw className="w-12 h-12 text-white animate-spin" />
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen bg-[#0A2540] flex items-center justify-center text-center text-red-400">
                فشل تحميل محتوى البروشور. يرجى المحاولة مرة أخرى.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#010304] font-['Tajawal'] text-white p-6 md:p-12" dir="rtl">
            <div className="space-y-12">

                {/* --- PAGE 1: HERO & RESPONSIVENESS --- */}
                <PageContainer className="text-center">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none"></div>
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[150px] pointer-events-none"></div>
                    
                    <div className="w-32 h-32 mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-[45px] flex items-center justify-center p-5 shadow-2xl mb-8">
                        <img src="https://cdn-icons-png.flaticon.com/512/3063/3063206.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight" dangerouslySetInnerHTML={{ __html: settings.heroTitle }} />
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-16">
                        {settings.heroSubtitle}
                    </p>

                    <div className="relative h-64 md:h-96 w-full mt-10 flex items-center justify-center group">
                        <Monitor className="absolute text-white/10 w-full h-full max-w-4xl transition-transform duration-500 group-hover:scale-105" />
                        <Tablet className="absolute text-white/20 w-1/2 h-1/2 max-w-lg transition-transform duration-500 group-hover:scale-110 group-hover:-translate-x-4" />
                        <Smartphone className="absolute text-white/50 w-1/4 h-1/4 max-w-xs transition-transform duration-500 group-hover:scale-125 group-hover:translate-x-4 group-hover:-translate-y-2" />
                        <div className="absolute w-1/4 h-1/4 max-w-[80px] -bottom-4 left-1/4 bg-amber-400/10 rounded-full blur-2xl"></div>
                        <div className="absolute w-1/3 h-1/3 max-w-[120px] -top-8 right-1/4 bg-cyan-400/10 rounded-full blur-3xl"></div>
                    </div>
                     <p className="text-sm font-bold text-gray-600 uppercase tracking-[0.3em] mt-16">متوافق مع جميع أجهزتك</p>
                </PageContainer>
                
                {/* --- PAGE 2: INTERACTIVITY & AI --- */}
                 <PageContainer>
                    <h2 className="text-center text-4xl font-black mb-16" dangerouslySetInnerHTML={{ __html: settings.section1Title }} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {settings.section1Features.map((feature) => (
                            <FeatureCard 
                                key={feature.id}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                color={feature.color}
                            />
                        ))}
                    </div>
                </PageContainer>
                
                {/* --- PAGE 3: ANALYTICS & ADAPTIVE LEARNING --- */}
                <PageContainer>
                    <h2 className="text-center text-4xl font-black mb-16" dangerouslySetInnerHTML={{ __html: settings.section2Title }} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {settings.section2Features.map((feature) => (
                            <FeatureCard 
                                key={feature.id}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                color={feature.color}
                            />
                        ))}
                    </div>
                </PageContainer>
                
                {/* --- PAGE 4: SECURITY & CALL TO ACTION --- */}
                <PageContainer className="text-center">
                     <h2 className="text-center text-4xl font-black mb-16" dangerouslySetInnerHTML={{ __html: settings.section3Title }}/>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
                         {settings.section3Features.map((feature) => (
                             <FeatureCard 
                                key={feature.id}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                color={feature.color}
                            />
                         ))}
                     </div>

                     <div className="flex flex-col md:flex-row items-center justify-center gap-12 bg-white/5 p-12 rounded-[50px] border border-white/10">
                        <div className="flex-1 text-right">
                             <h3 className="text-3xl font-black mb-4">{settings.ctaTitle}</h3>
                             <p className="text-gray-400">{settings.ctaSubtitle}</p>
                             <button className="mt-8 bg-amber-400 text-black px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-amber-500/20">
                                {settings.ctaButtonText}
                             </button>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-2xl">
                             <QRCode value="https://kuwait-physics.web.app/" size={128} />
                        </div>
                     </div>
                </PageContainer>
            </div>
        </div>
    );
};

export default MarketingBrochure;