
import React, { useState, useEffect } from 'react';
import { Asset } from '../types';
import { dbService } from '../services/db';
import { UploadCloud, FileText, Copy, CopyCheck, Trash2, RefreshCw, Library, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import SupabaseConnectionFixer from './SupabaseConnectionFixer';

const AdminAssetManager: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [storageRulesError, setStorageRulesError] = useState<boolean>(false);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setIsLoading(true);
        setMessage(null);
        setStorageRulesError(false);
        try {
            // Always list from Supabase for this manager
            const data = await dbService.listAssets();
            setAssets(data);
        } catch (e: any) {
            console.error(e);
            if (e.message === 'STORAGE_PERMISSION_DENIED' || e.message?.includes('security policy')) {
                setStorageRulesError(true);
            } else {
                setMessage({ text: 'فشل تحميل مكتبة الوسائط. تأكد من إعدادات Supabase.', type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setIsUploading(true);
        setMessage(null);
        try {
            // Upload to Supabase by passing `true`
            // FIX: Expected 1 arguments, but got 2.
            await Promise.all(Array.from(files).map(file => dbService.uploadAsset(file)));
            setMessage({ text: `تم رفع ${files.length} ملف بنجاح إلى Supabase.`, type: 'success' });
            await loadAssets();
        } catch (e: any) {
            console.error(e);
            if (e.message === 'STORAGE_PERMISSION_DENIED' || e.message?.includes('security policy')) {
                setStorageRulesError(true);
            } else {
                setMessage({ text: 'حدث خطأ أثناء الرفع. تحقق من الصلاحيات.', type: 'error' });
            }
        } finally {
            setIsUploading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };
    
    const handleDelete = async (asset: Asset) => {
        if (!window.confirm(`هل أنت متأكد من حذف الملف "${asset.name}"؟`)) return;
        
        try {
            // Delete from Supabase by passing `true`
            // FIX: Expected 1 arguments, but got 2.
            await dbService.deleteAsset(asset.name);
            setMessage({ text: 'تم حذف الملف بنجاح.', type: 'success' });
            await loadAssets();
        } catch(e) {
             console.error("Delete failed", e);
             setMessage({ text: 'فشل حذف الملف.', type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };
    
    const formatBytes = (bytes: number, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    return (
        <div className="max-w-7xl mx-auto py-8 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#fbbf24] border border-white/10 shadow-xl">
                        <Library size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white italic">مكتبة <span className="text-[#fbbf24]">الوسائط العامة</span></h2>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">إدارة الملفات التعليمية عبر Supabase Public Storage</p>
                    </div>
                </div>
                <button onClick={loadAssets} className="p-4 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2 group">
                    <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    <span className="text-xs font-bold">تحديث</span>
                </button>
            </header>

            {message && (
                <div className={`mb-6 p-5 rounded-3xl text-sm font-bold flex items-center gap-4 border animate-slideUp ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}> 
                    {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>} 
                    {message.text} 
                </div>
            )}
            
            {storageRulesError && (
                <div className="mb-12">
                   <SupabaseConnectionFixer onFix={loadAssets} />
                </div>
            )}

            <div className="glass-panel p-10 rounded-[50px] border-white/5 mb-12 bg-gradient-to-br from-white/[0.02] to-transparent">
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-white/10 rounded-[40px] cursor-pointer bg-black/40 hover:bg-black/60 hover:border-[#fbbf24]/30 transition-all group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#fbbf24]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                        {isUploading ? (
                            <>
                                <RefreshCw className="w-16 h-16 mb-4 text-[#fbbf24] animate-spin" />
                                <p className="mb-2 text-xl font-black text-[#fbbf24] uppercase italic tracking-tighter">جاري الرفع السحابي...</p>
                                <p className="text-xs text-gray-500">سيتم توليد روابط عامة للطلاب فور الانتهاء</p>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-white/5 rounded-[30px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <UploadCloud className="text-gray-400 group-hover:text-[#fbbf24] transition-colors" size={40}/>
                                </div>
                                <p className="mb-2 text-lg font-bold text-gray-300">اضغط لرفع ملفات الدروس (صور، فيديوهات، PDF)</p>
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">التخزين يتم في Bucket الـ Assets العام</p>
                            </>
                        )}
                    </div>
                    <input id="file-upload" type="file" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} disabled={isUploading} />
                </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {isLoading && !storageRulesError && Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-[35px] animate-pulse border border-white/5"></div>
                ))}
                {assets.map(asset => (
                    <div key={asset.name} className="relative group aspect-square bg-black/40 rounded-[35px] overflow-hidden border border-white/5 shadow-2xl transition-all hover:border-[#fbbf24]/40">
                        {asset.type.startsWith('image/') ? (
                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-6 bg-gradient-to-br from-white/5 to-transparent">
                                <FileText size={48} className="opacity-40 group-hover:opacity-100 group-hover:text-blue-400 transition-all" />
                                <p className="text-[10px] font-black mt-4 text-center break-all line-clamp-2 uppercase tracking-tight">{asset.name.split('_').pop()}</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                            <p className="text-[10px] font-black text-white truncate mb-1">{asset.name.split('_').pop()}</p>
                            <p className="text-[9px] font-black text-gray-400 font-mono mb-4">{formatBytes(asset.size)}</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleCopy(asset.url)} className="flex-1 py-2.5 bg-white text-black rounded-xl hover:bg-[#fbbf24] transition-all flex items-center justify-center gap-2 shadow-lg">
                                    {copiedUrl === asset.url ? <CopyCheck size={14}/> : <Copy size={14}/>}
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{copiedUrl === asset.url ? 'تم!' : 'نسخ الرابط'}</span>
                                </button>
                                <button onClick={() => handleDelete(asset)} className="p-2.5 bg-red-500/20 backdrop-blur-md rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
             
             {assets.length === 0 && !isLoading && !storageRulesError && (
                <div className="text-center py-32 opacity-20 border-2 border-dashed border-white/10 rounded-[60px]">
                    <Library size={64} className="mx-auto mb-6" />
                    <p className="font-black text-lg uppercase tracking-[0.4em]">المكتبة فارغة</p>
                    <p className="text-sm">ابدأ برفع وسائط الدروس لتظهر هنا.</p>
                </div>
             )}
        </div>
    );
};

export default AdminAssetManager;
