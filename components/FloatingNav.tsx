import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewState } from '../types';
import { Grid, X, LayoutDashboard, BookOpen, Target, BrainCircuit, FlaskConical, Map } from 'lucide-react';

const FloatingNav: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const navItems = [
        { path: '/dashboard', label: 'الرئيسية', icon: <LayoutDashboard size={20} /> },
        { path: '/curriculum', label: 'المنهج', icon: <BookOpen size={20} /> },
        { path: '/quiz-center', label: 'الاختبارات', icon: <Target size={20} /> },
        { path: '/ai-chat', label: 'المساعد الذكي', icon: <BrainCircuit size={20} /> },
        { path: '/lab-hub', label: 'المختبر', icon: <FlaskConical size={20} /> },
        { path: '/journey-map', label: 'الرحلة', icon: <Map size={20} /> },
    ];

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    const radius = 90; // The radius of the circle on which the items are placed

    return (
        <div dir="rtl">
            {/* Backdrop */}
            {isOpen && (
                <div 
                    onClick={() => setIsOpen(false)} 
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
                />
            )}

            {/* Menu Items */}
            <div className="fixed bottom-8 left-8 z-[90]">
                {navItems.map((item, index) => {
                    // Calculate position on the circle
                    const angle = (Math.PI / 2) + (index * (Math.PI / 1.5 / (navItems.length -1)));
                    const x = radius * Math.cos(angle);
                    const y = -radius * Math.sin(angle);

                    return (
                        <div
                            key={item.path}
                            className="absolute transition-all duration-300 ease-in-out flex flex-col items-center group"
                            style={{
                                transform: isOpen ? `translate(${x}px, ${y}px)` : 'translate(0, 0)',
                                opacity: isOpen ? 1 : 0,
                                transitionDelay: `${isOpen ? index * 30 : (navItems.length - index) * 30}ms`,
                            }}
                        >
                            <button
                                onClick={() => handleNavigate(item.path)}
                                className="w-14 h-14 bg-white/10 border border-white/20 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:text-black transition-all mb-2"
                            >
                                {item.icon}
                            </button>
                            <span className="bg-black/50 text-white text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Main FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-8 left-8 z-[99] w-20 h-20 rounded-full flex items-center justify-center text-black shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 bg-gradient-to-br from-amber-400 to-yellow-500 glow-gold"
                aria-label="Open navigation menu"
            >
                <div className="relative w-8 h-8">
                    <Grid 
                        className={`absolute transition-all duration-300 ${isOpen ? 'opacity-0 scale-50 rotate-45' : 'opacity-100 scale-100 rotate-0'}`} 
                    />
                    <X 
                        className={`absolute transition-all duration-300 ${isOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'}`} 
                    />
                </div>
            </button>
        </div>
    );
};

export default FloatingNav;