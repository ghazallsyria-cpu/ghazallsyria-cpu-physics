
import React, { useState, useEffect } from 'react';
import { PaymentSettings, InvoiceSettings, AppBranding } from '../types';
import { dbService } from '../services/db';
import QRCode from 'react-qr-code';
import { 
    Save, RefreshCw, AlertCircle, Smartphone, Banknote, 
    Power, PowerOff, ShieldCheck, Zap, Palette, Layout, 
    Type, FileText, CheckCircle2, Eye, PenTool, Image as ImageIcon, Database, Construction
} from 'lucide-react';

const AdminPaymentManager: React.FC = () => {
    const defaultSettings: PaymentSettings = {
        isOnlinePaymentEnabled: false,
        womdaPhoneNumber: '55315661',
        planPrices: { premium: 35, basic: 0 }
    };
    
    const defaultInvoiceSettings: InvoiceSettings = {
        headerText: 'إيصال دفع رقمي معتمد',
        footerText: 'إثبات رسمي من المركز السوري للعلوم.',
        accentColor: '#fbbf24',
        showSignature: true,
        signatureName: 'إدارة المركز',
        showWatermark: true,
        watermarkText: 'SSC KUWAIT'
    };

    const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
    const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(defaultInvoiceSettings);
    const [branding, setBranding] = useState<AppBranding>({ appName: 'المركز السوري للعلوم', logoUrl: '' });

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'INVOICE_DESIGN'>('GENERAL');
    const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const pay = await dbService.getPaymentSettings();
            if (pay) setSettings(pay);
            
            const inv = await dbService.getInvoiceSettings();
            if (inv) setInvoiceSettings(inv);

            const brand = await dbService.getAppBranding();
            if (brand) setBranding(brand);
        } catch (e) {
            console.error("Load Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitialize = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                dbService.savePaymentSettings(defaultSettings),
                dbService.saveInvoiceSettings(defaultInvoiceSettings)
            ]);
            setSettings(defaultSettings);
            setInvoiceSettings(defaultInvoiceSettings);
            setMessage({ text: 'تمت تهيئة النظام المالي بنجاح ✅', type: 'success' });
        } catch (e) {
            setMessage({ text: 'فشلت التهيئة السحابية.', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                dbService.savePaymentSettings(settings),
                dbService.saveInvoiceSettings(invoiceSettings)
            ]);
            setMessage({ text: 'تم الحفظ بنجاح ✅', type: 'success' });
        } catch (e) {
            setMessage({ text: 'حدث خطأ أثناء الحفظ.', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right pb-32" dir="rtl">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        إدارة <span className="text-emerald-500">المالية</span>
                    </h2>
                    <p className="text-gray-500 mt-4 font-bold uppercase tracking-widest text-[10px]">تحكم في الأسعار وتصميم الإيصالات الرسمية.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleInitialize} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-blue-500 transition-all shadow-xl">
                        <Database size={16} /> تهيئة سحابية فورية
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 text-black px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                        {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={18} />} حفظ التعديلات
                    </button>
                </div>
            </header>

            {message && (
                <div className={`mb-10 p-6 rounded-[35px] text-sm font-bold flex items-center gap-4 border animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    <CheckCircle2 size={24} /> {message.text}
                </div>
            )}

            <div className="flex bg-black/40 p-2 rounded-[30px] border border-white/5 max-w-lg mb-12">
                <button onClick={() => setActiveTab('GENERAL')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'GENERAL' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}>
                    بوابة الدفع والأسعار
                </button>
                <button onClick={() => setActiveTab('INVOICE_DESIGN')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'INVOICE_DESIGN' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}>
                    تصميم الإيصالات
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {activeTab === 'GENERAL' ? (
                    <>
                        <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40 space-y-10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-black text-white">رقم تحويل ومض (Womda)</h3>
                                <Smartphone className="text-blue-400" />
                            </div>
                            <input 
                                type="text" 
                                value={settings?.womdaPhoneNumber || ''} 
                                onChange={e => setSettings({...settings, womdaPhoneNumber: e.target.value})}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-2xl tabular-nums ltr text-left outline-none focus:border-emerald-500"
                                placeholder="965XXXXXXXX"
                            />
                        </div>

                        <div className="glass-panel p-10 rounded-[50px] border-white/5 bg-black/40 flex flex-col justify-center">
                            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3"><Zap size={24} className="text-amber-400"/> تسعير الباقة</h3>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={settings?.planPrices?.premium || 0} 
                                    onChange={e => setSettings({...settings, planPrices: { ...(settings.planPrices || {premium: 35, basic: 0}), premium: Number(e.target.value)}})} 
                                    className="w-full bg-black/60 border border-white/10 rounded-3xl px-8 py-6 text-white font-black text-4xl tabular-nums outline-none focus:border-amber-400" 
                                />
                                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-lg">د.ك</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="col-span-full grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-black/20 space-y-6">
                                <h4 className="text-sm font-black text-emerald-500 uppercase tracking-widest">تخصيص الإيصال</h4>
                                <input type="text" value={invoiceSettings?.headerText || ''} onChange={e => setInvoiceSettings({...invoiceSettings, headerText: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" placeholder="ترويسة الإيصال" />
                                <input type="text" value={invoiceSettings?.watermarkText || ''} onChange={e => setInvoiceSettings({...invoiceSettings, watermarkText: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" placeholder="العلامة المائية" />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">لون الهوية:</span>
                                    <input type="color" value={invoiceSettings?.accentColor || '#fbbf24'} onChange={e => setInvoiceSettings({...invoiceSettings, accentColor: e.target.value})} className="w-12 h-12 rounded-full overflow-hidden bg-transparent cursor-pointer" />
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-8 bg-white/5 p-4 rounded-[50px] border border-white/10 min-h-[400px] flex items-center justify-center">
                            <p className="text-gray-500 italic text-sm">قم بحفظ الإعدادات لمشاهدة المعاينة النهائية للإيصال.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPaymentManager;
