
import React, { useState, useEffect } from 'react';
import { User, Invoice, SubscriptionPlan, PaymentSettings } from '../types';
import { dbService } from '../services/db';
import { 
  CheckCircle2, 
  Smartphone, 
  RefreshCw, 
  MessageSquare,
  ChevronLeft,
  Printer,
  Zap,
  Clock,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Crown,
  FileText
} from 'lucide-react';
import PaymentCertificate from './PaymentCertificate';

const BillingCenter: React.FC<{ user: User; onUpdateUser: (user: User) => void }> = ({ user, onUpdateUser }) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({ isOnlinePaymentEnabled: false, womdaPhoneNumber: '55315661', planPrices: { premium: 35, basic: 0 } });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvoiceForCert, setSelectedInvoiceForCert] = useState<Invoice | null>(null);

  useEffect(() => {
    dbService.getPaymentSettings().then(s => s && setPaymentSettings(s));

    const unsubscribe = dbService.subscribeToInvoices(user.uid, (data) => {
        setInvoices(data || []);
    });

    return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user.uid]);

  if (selectedInvoiceForCert) {
      return (
          <div className="animate-fadeIn">
              <button onClick={() => setSelectedInvoiceForCert(null)} className="mb-10 flex items-center gap-4 text-gray-500 hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all group">
                  <ChevronLeft className="group-hover:-translate-x-2 transition-transform" /> العودة لمركز الاشتراكات
              </button>
              <div className="bg-white/5 p-1 rounded-[60px] border border-white/10 shadow-3xl overflow-hidden">
                <PaymentCertificate user={user} invoice={selectedInvoiceForCert} />
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-20 text-center relative">
        <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter italic">بوابة <span className="text-[#fbbf24]">الاشتراك</span></h2>
        <p className="text-gray-500 text-xl max-w-2xl mx-auto leading-relaxed">فعل اشتراكك عبر "ومض" واحصل على إيصالك الرسمي فوراً.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
              <div className="glass-panel p-10 rounded-[55px] border-2 border-emerald-500/20 bg-emerald-500/[0.02] shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-3">
                        <Crown className="text-amber-400" size={24}/>
                        <h3 className="text-3xl font-black text-white">باقة التفوق (Premium)</h3>
                      </div>
                      {user.subscription === 'premium' && <span className="bg-emerald-500 text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">نشطة ✓</span>}
                  </div>

                  <div className="text-6xl font-black text-white tracking-tighter mb-10 tabular-nums">
                      <span className="text-[#fbbf24]">{paymentSettings?.planPrices?.premium || 35}</span>
                      <span className="text-sm text-gray-500 mr-2 uppercase">د.ك</span>
                  </div>

                  <div className="space-y-4 border-t border-white/5 pt-8 mb-12">
                      <div className="flex items-center gap-3 text-gray-400 text-sm"><CheckCircle2 size={16} className="text-emerald-500"/> <span>دخول كامل لجميع الدروس والمناهج</span></div>
                      <div className="flex items-center gap-3 text-gray-400 text-sm"><CheckCircle2 size={16} className="text-emerald-500"/> <span>بنك الأسئلة المطور واختبارات Veo</span></div>
                      <div className="flex items-center gap-3 text-gray-400 text-sm"><CheckCircle2 size={16} className="text-emerald-500"/> <span>إيصال دفع رقمي معتمد</span></div>
                  </div>

                  <button 
                      onClick={() => {
                          const msg = encodeURIComponent(`مرحباً إدارة المركز، أرغب في تفعيل باقة التفوق.\nالاسم: ${user.name}\nالهاتف: ${user.phone}`);
                          window.open(`https://wa.me/965${paymentSettings?.womdaPhoneNumber || '55315661'}?text=${msg}`, '_blank');
                      }}
                      className="w-full py-6 bg-[#fbbf24] text-black rounded-[30px] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  >
                      {user.subscription === 'premium' ? 'الباقة مفعلة - شكراً لك' : 'تفعيل الاشتراك عبر ومض'}
                  </button>
              </div>
          </div>

          <div className="lg:col-span-4">
              <div className="glass-panel p-8 rounded-[45px] border-white/5 bg-[#0a1118]/90 flex flex-col min-h-[500px] shadow-3xl">
                  <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
                      <Clock className="text-blue-400" size={20} />
                      <h3 className="text-lg font-black text-white italic uppercase tracking-widest">تاريخ المدفوعات</h3>
                  </div>
                  
                  <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                      {invoices.length > 0 ? invoices.map(inv => (
                          <div key={inv.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-[30px] flex justify-between items-center group transition-all">
                              <div>
                                  <p className="text-[10px] font-black text-emerald-400 uppercase">{inv.status}</p>
                                  <h4 className="text-sm font-bold text-white mt-1">{inv.amount} د.ك</h4>
                                  <p className="text-[8px] text-gray-500 font-mono">#{inv.trackId}</p>
                              </div>
                              {inv.status === 'PAID' && (
                                  <button onClick={() => setSelectedInvoiceForCert(inv)} className="p-3 bg-white/10 hover:bg-[#fbbf24] text-white hover:text-black rounded-xl transition-all">
                                      <Printer size={16} />
                                  </button>
                              )}
                          </div>
                      )) : (
                          <div className="text-center py-20 opacity-20 flex flex-col items-center">
                              <FileText size={48} className="mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-[0.3em]">لا توجد فواتير</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default BillingCenter;
