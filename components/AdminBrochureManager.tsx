import React, { useState, useEffect } from 'react';
import { BrochureSettings, BrochureFeature } from '../types';
import { dbService } from '../services/db';
import { Save, RefreshCw, Plus, Trash2, Edit, X, Sparkles, Waypoints, BrainCircuit, BarChart3, Lock, Star } from 'lucide-react';

const AdminBrochureManager: React.FC = () => {
    const [settings, setSettings] = useState<BrochureSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await dbService.getBrochureSettings();
            setSettings(data);
        } catch (e) { console.error("Failed to load brochure settings", e); }
        finally { setIsLoading(false); }
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await dbService.saveBrochureSettings(settings);
            setMessage({ text: "تم حفظ التغييرات بنجاح!", type: 'success' });
        } catch (e) {
            setMessage({ text: "فشل حفظ التغييرات.", type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };
    
    const handleSettingsChange = (field: keyof BrochureSettings, value: string) => {
        setSettings(prev => prev ? { ...prev, [field]: value } : null);
    };
    
    const handleFeatureChange = (section: keyof BrochureSettings, index: number, field: keyof BrochureFeature, value: string) => {
        if (!settings) return;
        const newSettings = { ...settings };
        const features = [...(newSettings[section] as BrochureFeature[])];
        if (features[index]) {
            (features[index] as any)[field] = value;
            (newSettings as any)[section] = features;
            setSettings(newSettings);
        }
    };

    if (isLoading) {
        return <div className="p-20 text-center"><RefreshCw className="animate-spin text-white" /></div>;
    }

    if (!settings) {
        return <div className="p-20 text-center text-red-400">فشل تحميل إعدادات البروشور.</div>;
    }

    const renderFeatureEditor = (sectionName: keyof BrochureSettings, title: string) => (
        <div className="glass-panel p-8 rounded-[30px] border-white/5 space-y-4">
            <h3 className="text-xl font-black text-white mb-4">{title}</h3>
            <label className="text-xs text-gray-400">عنوان القسم</label>
            <textarea
                value={(settings[sectionName] as string) || ''}
                onChange={e => handleSettingsChange(sectionName, e.target.value)}
                className="w-full bg-black/40 p-3 rounded-lg border border-white/10 text-white"
                rows={2}
            />
            <label className="text-xs text-gray-400 mt-4 block">المميزات</label>
            {(settings[sectionName.replace('Title', 'Features') as keyof BrochureSettings] as BrochureFeature[]).map((feature, index) => {
                const featureSectionName = sectionName.replace('Title', 'Features') as keyof BrochureSettings;
                return (
                    <div key={feature.id} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500">الأيقونة (اسم من lucide-react)</label>
                                <input type="text" value={feature.icon} onChange={e => handleFeatureChange(featureSectionName, index, 'icon', e.target.value)} className="w-full bg-black/40 p-2 rounded text-xs font-mono" placeholder="e.g., Waypoints" />
                                <p className="text-[9px] text-gray-600 mt-1">Icons: Waypoints, BrainCircuit, BarChart3, Lock, Star, etc.</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500">اللون</label>
                                <select value={feature.color} onChange={e => handleFeatureChange(featureSectionName, index, 'color', e.target.value)} className="w-full bg-black/40 p-2 rounded text-xs">
                                    <option value="amber">Amber (أصفر)</option>
                                    <option value="cyan">Cyan (سماوي)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500">العنوان</label>
                            <input type="text" value={feature.title} onChange={e => handleFeatureChange(featureSectionName, index, 'title', e.target.value)} className="w-full bg-black/40 p-2 rounded" />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500">الوصف</label>
                            <textarea value={feature.description} onChange={e => handleFeatureChange(featureSectionName, index, 'description', e.target.value)} className="w-full bg-black/40 p-2 rounded text-sm text-gray-400 h-16" />
                        </div>
                    </div>
                )
            })}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#fbbf24] border border-white/10 shadow-xl">
                        <Sparkles size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white italic">إدارة <span className="text-[#fbbf24]">البروشور التسويقي</span></h2>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">تعديل المحتوى الديناميكي للصفحة التعريفية.</p>
                    </div>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="bg-[#fbbf24] text-black px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                    {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={18} />} حفظ التغييرات
                </button>
            </header>
            
            {message && <p className={`text-center p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{message.text}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="space-y-8">
                    {renderFeatureEditor('section1Title', 'القسم الأول: التفاعلية والذكاء')}
                    {renderFeatureEditor('section2Title', 'القسم الثاني: التحليل والتوجيه')}
                    {renderFeatureEditor('section3Title', 'القسم الثالث: الأمان والموثوقية')}
                </div>
                <div className="space-y-8">
                     <div className="glass-panel p-8 rounded-[30px] border-white/5 space-y-4">
                        <h3 className="text-xl font-black text-white mb-4">النصوص الرئيسية</h3>
                        <label className="text-xs text-gray-400">العنوان الرئيسي (Hero)</label>
                        <textarea value={settings.heroTitle} onChange={e => handleSettingsChange('heroTitle', e.target.value)} className="w-full bg-black/40 p-3 rounded-lg border border-white/10 text-white" rows={3}/>
                         <label className="text-xs text-gray-400">العنوان الفرعي (Hero)</label>
                        <textarea value={settings.heroSubtitle} onChange={e => handleSettingsChange('heroSubtitle', e.target.value)} className="w-full bg-black/40 p-3 rounded-lg border border-white/10 text-white" rows={4}/>
                    </div>
                     <div className="glass-panel p-8 rounded-[30px] border-white/5 space-y-4">
                        <h3 className="text-xl font-black text-white mb-4">دعوة للانضمام (CTA)</h3>
                        <label className="text-xs text-gray-400">العنوان</label>
                        <input type="text" value={settings.ctaTitle} onChange={e => handleSettingsChange('ctaTitle', e.target.value)} className="w-full bg-black/40 p-3 rounded-lg border border-white/10 text-white" />
                         <label className="text-xs text-gray-400">الوصف</label>
                        <textarea value={settings.ctaSubtitle} onChange={e => handleSettingsChange('ctaSubtitle', e.target.value)} className="w-full bg-black/40 p-3 rounded-lg border border-white/10 text-white" rows={3}/>
                         <label className="text-xs text-gray-400">نص الزر</label>
                        <input type="text" value={settings.ctaButtonText} onChange={e => handleSettingsChange('ctaButtonText', e.target.value)} className="w-full bg-black/40 p-3 rounded-lg border border-white/10 text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBrochureManager;