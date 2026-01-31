
import React, { useState, useRef } from 'react';
import { Lesson, UniversalLessonConfig, ContentBlock } from '../types';
import { dbService } from '../services/db';
import { 
  Save, Plus, Trash2, Sliders, LineChart, MessageSquare, 
  X, BarChart, Activity, Layers, Settings, Variable, 
  Image as ImageIcon, Type, Code, AlertTriangle, CheckCircle2,
  Bold, Italic, Calculator, MoveUp, MoveDown
} from 'lucide-react';

interface AdminUniversalLessonEditorProps {
  initialLesson: Partial<Lesson>;
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
}

// أدوات المساعدة لإدراج الرموز الرياضية
const MATH_SYMBOLS = [
  { label: '√', tex: '\\sqrt{}' },
  { label: 'x²', tex: '^2' },
  { label: '½', tex: '\\frac{1}{2}' },
  { label: 'π', tex: '\\pi' },
  { label: 'θ', tex: '\\theta' },
  { label: 'Δ', tex: '\\Delta' },
  { label: 'Σ', tex: '\\sum' },
  { label: '∫', tex: '\\int' },
  { label: '→', tex: '\\rightarrow' },
];

const AdminUniversalLessonEditor: React.FC<AdminUniversalLessonEditorProps> = ({ initialLesson, onSave, onCancel }) => {
  const [lesson, setLesson] = useState<Partial<Lesson>>({
    ...initialLesson,
    id: initialLesson.id || `lesson_${Date.now()}`,
    templateType: 'UNIVERSAL',
    universalConfig: initialLesson.universalConfig || {
        objectives: [],
        introduction: '',
        mainEquation: '',
        variables: [],
        calculationFormula: '',
        resultUnit: '',
        interactiveQuiz: { question: '', options: ['', '', ''], correctIndex: 0 },
        graphConfig: {
            xAxisVariableId: '',
            yAxisLabel: 'النتيجة',
            chartType: 'line',
            lineColor: '#00d2ff'
        }
    }
  });

  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'MATH_CORE' | 'CONTENT' | 'PREVIEW'>('SETTINGS');
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<number | null>(null);

  const config = lesson.universalConfig!;

  // --- تحديث الإعدادات العميقة ---
  const updateConfig = (field: keyof UniversalLessonConfig, value: any) => {
    setLesson(prev => ({
        ...prev,
        universalConfig: { ...prev.universalConfig!, [field]: value }
    }));
  };

  // --- إدارة المتغيرات ---
  const addVariable = () => {
    const newVar = { id: `var_${Date.now()}`, symbol: 'x', name: 'متغير جديد', unit: 'unit', defaultValue: 10, min: 0, max: 100, step: 1 };
    updateConfig('variables', [...config.variables, newVar]);
  };

  const updateVariable = (idx: number, field: string, value: any) => {
    const vars = [...config.variables];
    // التحقق من صحة المعرف البرمجي
    if (field === 'id') {
        value = value.replace(/[^a-zA-Z0-9_]/g, ''); // فقط أحرف وأرقام
    }
    vars[idx] = { ...vars[idx], [field]: value };
    updateConfig('variables', vars);
  };

  const removeVariable = (idx: number) => {
    const vars = [...config.variables];
    vars.splice(idx, 1);
    updateConfig('variables', vars);
  };

  // --- إدارة المحتوى ---
  const addContentBlock = (type: 'text' | 'image' | 'html' = 'text') => {
      const currentContent = lesson.content || [];
      setLesson({...lesson, content: [...currentContent, { type, content: '', caption: type === 'html' ? 'كود مخصص' : '' }]});
  };

  const updateContentBlock = (idx: number, field: keyof ContentBlock, val: string) => {
      const content = [...(lesson.content || [])];
      content[idx] = { ...content[idx], [field]: val };
      setLesson({...lesson, content});
  };

  const removeContentBlock = (idx: number) => {
      const content = [...(lesson.content || [])];
      content.splice(idx, 1);
      setLesson({...lesson, content});
  };

  const moveContentBlock = (idx: number, direction: 'up' | 'down') => {
      const content = [...(lesson.content || [])];
      if (direction === 'up' && idx > 0) {
          [content[idx], content[idx - 1]] = [content[idx - 1], content[idx]];
      } else if (direction === 'down' && idx < content.length - 1) {
          [content[idx], content[idx + 1]] = [content[idx + 1], content[idx]];
      }
      setLesson({...lesson, content});
  };

  const handleImageUpload = async (idx: number, file: File) => {
      setIsUploading(idx);
      try {
          const asset = await dbService.uploadAsset(file);
          updateContentBlock(idx, 'content', asset.url);
      } catch (e) {
          alert("فشل رفع الصورة");
      } finally {
          setIsUploading(null);
      }
  };

  // --- التحقق والحفظ ---
  const validateFormula = (formula: string, vars: any[]) => {
      try {
          // إنشاء دالة وهمية لاختبار الكود
          const varNames = vars.map(v => v.id);
          const dummyValues = vars.map(v => v.defaultValue);
          const func = new Function(...varNames, `return ${formula};`);
          const res = func(...dummyValues);
          if (typeof res !== 'number' || isNaN(res)) {
              setFormulaError("تحذير: المعادلة لا تعيد رقماً صحيحاً.");
          } else {
              setFormulaError(null);
          }
      } catch (e: any) {
          setFormulaError(`خطأ في الكود: ${e.message}`);
      }
  };

  const handleSave = () => {
      if (!lesson.title) { alert("يرجى كتابة عنوان الدرس"); return; }
      if (!config.calculationFormula) { alert("يرجى كتابة صيغة الحساب البرمجية"); return; }
      if (formulaError) { alert("يرجى إصلاح أخطاء المعادلة قبل الحفظ"); return; }
      
      onSave(lesson as Lesson);
  };

  // --- مكون مساعد: شريط أدوات النصوص ---
  const TextToolbar = ({ targetId, onInsert }: { targetId: string, onInsert: (val: string) => void }) => (
      <div className="flex gap-2 mb-2 overflow-x-auto pb-2 border-b border-white/5">
          {MATH_SYMBOLS.map(sym => (
              <button key={sym.label} onClick={() => onInsert(sym.tex)} className="px-3 py-1 bg-white/5 rounded text-xs hover:bg-[#00d2ff] hover:text-black transition-colors font-mono">
                  {sym.label}
              </button>
          ))}
          <div className="w-px bg-white/10 mx-2"></div>
          <button onClick={() => onInsert('<b></b>')} className="px-3 py-1 bg-white/5 rounded text-xs hover:bg-white/20"><Bold size={12}/></button>
          <button onClick={() => onInsert('<i></i>')} className="px-3 py-1 bg-white/5 rounded text-xs hover:bg-white/20"><Italic size={12}/></button>
          <button onClick={() => onInsert('$$ $$')} className="px-3 py-1 bg-white/5 rounded text-xs hover:bg-white/20 text-yellow-400 font-bold">LaTeX</button>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 font-['Tajawal'] text-right text-white h-[calc(100vh-100px)] flex flex-col" dir="rtl">
        {/* Header */}
        <header className="flex justify-between items-center gap-6 mb-6 px-4">
            <div>
                <h2 className="text-2xl font-black text-[#fbbf24] flex items-center gap-2">
                    <Sliders className="text-white" /> محرر الدروس المتقدم
                </h2>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all font-bold text-xs">إلغاء</button>
                <button onClick={handleSave} className="px-8 py-3 rounded-xl bg-[#fbbf24] text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                    <Save size={16} /> حفظ النظام
                </button>
            </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 px-4 border-b border-white/10">
            {[
                { id: 'SETTINGS', icon: Settings, label: 'الإعدادات العامة' },
                { id: 'MATH_CORE', icon: Variable, label: 'المحرك الرياضي' },
                { id: 'CONTENT', icon: Layers, label: 'المحتوى والوسائط' },
            ].map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl font-bold text-xs transition-all ${activeTab === tab.id ? 'bg-[#00d2ff]/10 text-[#00d2ff] border-b-2 border-[#00d2ff]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <tab.icon size={14} /> {tab.label}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 no-scrollbar">
            
            {/* 1. SETTINGS TAB */}
            {activeTab === 'SETTINGS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                    <div className="glass-panel p-8 rounded-[30px] border-white/5 bg-black/20 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400">عنوان الدرس</label>
                            <input type="text" value={lesson.title || ''} onChange={e => setLesson({...lesson, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#fbbf24] font-bold text-lg" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400">المقدمة</label>
                            <textarea value={config.introduction} onChange={e => updateConfig('introduction', e.target.value)} className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#fbbf24] resize-none leading-relaxed" />
                        </div>
                        
                        {/* Objectives */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400">أهداف الدرس</label>
                            {config.objectives.map((obj, i) => (
                                <div key={i} className="flex gap-2">
                                    <input type="text" value={obj} onChange={e => {
                                        const newObjs = [...config.objectives];
                                        newObjs[i] = e.target.value;
                                        updateConfig('objectives', newObjs);
                                    }} className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white" />
                                    <button onClick={() => {
                                        const newObjs = [...config.objectives];
                                        newObjs.splice(i, 1);
                                        updateConfig('objectives', newObjs);
                                    }} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 size={14}/></button>
                                </div>
                            ))}
                            <button onClick={() => updateConfig('objectives', [...config.objectives, ''])} className="text-xs text-[#00d2ff] font-bold flex items-center gap-1 mt-2">+ هدف جديد</button>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[30px] border-white/5 bg-black/20 space-y-6">
                        <h3 className="text-lg font-bold text-green-400 flex items-center gap-2"><MessageSquare size={18}/> التقييم الذاتي</h3>
                        <textarea 
                            placeholder="سؤال التحدي للطالب..." 
                            value={config.interactiveQuiz?.question || ''}
                            onChange={e => updateConfig('interactiveQuiz', { ...config.interactiveQuiz, question: e.target.value })}
                            className="w-full h-24 bg-black/40 rounded-xl p-4 text-sm text-white border border-white/10 resize-none outline-none focus:border-green-500"
                        />
                        <div className="space-y-3">
                            {config.interactiveQuiz?.options.map((opt, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                    <input 
                                        type="radio" 
                                        name="correctOpt" 
                                        checked={config.interactiveQuiz?.correctIndex === i} 
                                        onChange={() => updateConfig('interactiveQuiz', { ...config.interactiveQuiz, correctIndex: i })}
                                        className="accent-green-500 w-4 h-4"
                                    />
                                    <input 
                                        type="text" 
                                        value={opt} 
                                        onChange={e => {
                                            const newOpts = [...(config.interactiveQuiz?.options || [])];
                                            newOpts[i] = e.target.value;
                                            updateConfig('interactiveQuiz', { ...config.interactiveQuiz, options: newOpts });
                                        }}
                                        className="flex-1 bg-black/40 rounded-lg p-3 text-xs text-white border border-white/10 outline-none focus:border-green-500"
                                        placeholder={`الخيار ${i+1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. MATH CORE TAB */}
            {activeTab === 'MATH_CORE' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
                    <div className="lg:col-span-8 space-y-8">
                        {/* Formula Editor */}
                        <div className="glass-panel p-8 rounded-[30px] border-white/5 bg-black/20">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Code size={18} className="text-[#fbbf24]"/> برمجة القانون الفيزيائي</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">معادلة العرض (LaTeX)</label>
                                    <div className="relative">
                                        <input type="text" placeholder="E = mc^2" value={config.mainEquation} onChange={e => updateConfig('mainEquation', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-yellow-400 font-mono text-sm outline-none ltr text-left focus:border-yellow-500" />
                                        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-600 text-xs">العرض فقط</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">كود الحساب (JS Logic)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="m * Math.pow(c, 2)" 
                                            value={config.calculationFormula} 
                                            onChange={e => {
                                                updateConfig('calculationFormula', e.target.value);
                                                validateFormula(e.target.value, config.variables);
                                            }} 
                                            className={`w-full bg-black/40 border rounded-xl p-4 font-mono text-sm outline-none ltr text-left ${formulaError ? 'border-red-500 text-red-400' : 'border-white/10 text-green-400 focus:border-green-500'}`} 
                                        />
                                        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-600 text-xs">الحساب الفعلي</div>
                                    </div>
                                    {formulaError && <p className="text-red-500 text-[10px] mt-2 flex items-center gap-1"><AlertTriangle size={10}/> {formulaError}</p>}
                                </div>
                            </div>

                            {/* Variables List */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-400">المتغيرات (Inputs)</label>
                                    <button onClick={addVariable} className="text-[10px] bg-[#00d2ff]/10 text-[#00d2ff] px-3 py-1.5 rounded-lg font-bold hover:bg-[#00d2ff] hover:text-black transition-all">+ متغير</button>
                                </div>
                                {config.variables.map((v, idx) => (
                                    <div key={idx} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 grid grid-cols-12 gap-3 items-end hover:border-white/10 transition-all">
                                        <div className="col-span-2">
                                            <label className="text-[8px] text-gray-500 block mb-1">ID (in Code)</label>
                                            <input type="text" value={v.id} onChange={e => updateVariable(idx, 'id', e.target.value)} className="w-full bg-black/40 rounded-lg p-2 text-xs text-green-400 font-mono text-center border border-white/5" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[8px] text-gray-500 block mb-1">Symbol (LaTeX)</label>
                                            <input type="text" value={v.symbol} onChange={e => updateVariable(idx, 'symbol', e.target.value)} className="w-full bg-black/40 rounded-lg p-2 text-xs text-yellow-400 font-mono text-center border border-white/5" />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="text-[8px] text-gray-500 block mb-1">Name</label>
                                            <input type="text" value={v.name} onChange={e => updateVariable(idx, 'name', e.target.value)} className="w-full bg-black/40 rounded-lg p-2 text-xs text-white border border-white/5" />
                                        </div>
                                        <div className="col-span-4 grid grid-cols-3 gap-1">
                                            <div><label className="text-[7px] text-gray-500 block">MIN</label><input type="number" value={v.min} onChange={e => updateVariable(idx, 'min', Number(e.target.value))} className="w-full bg-black/40 rounded p-1 text-[10px] text-gray-300 text-center" /></div>
                                            <div><label className="text-[7px] text-gray-500 block">MAX</label><input type="number" value={v.max} onChange={e => updateVariable(idx, 'max', Number(e.target.value))} className="w-full bg-black/40 rounded p-1 text-[10px] text-gray-300 text-center" /></div>
                                            <div><label className="text-[7px] text-[#00d2ff] block">DEF</label><input type="number" value={v.defaultValue} onChange={e => updateVariable(idx, 'defaultValue', Number(e.target.value))} className="w-full bg-black/40 rounded p-1 text-[10px] text-[#00d2ff] text-center font-bold" /></div>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button onClick={() => removeVariable(idx)} className="bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="glass-panel p-8 rounded-[30px] border-white/5 bg-black/20 sticky top-4">
                            <h3 className="text-lg font-bold text-[#fbbf24] mb-6 flex items-center gap-2">
                                <LineChart size={18}/> إعدادات الرسم البياني
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-2">نوع المخطط</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['line', 'bar', 'area'] as const).map(type => (
                                            <button 
                                                key={type}
                                                onClick={() => updateConfig('graphConfig', { ...config.graphConfig, chartType: type })}
                                                className={`py-2 rounded-lg text-[10px] font-black uppercase border ${config.graphConfig?.chartType === type ? 'bg-[#00d2ff] text-black border-[#00d2ff]' : 'border-white/10 text-gray-500 hover:border-white/30'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-2">المحور السيني (X-Axis)</label>
                                    <select 
                                        value={config.graphConfig?.xAxisVariableId || ''} 
                                        onChange={e => updateConfig('graphConfig', { ...config.graphConfig, xAxisVariableId: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#fbbf24]"
                                    >
                                        <option value="">اختر المتغير المستقل...</option>
                                        {config.variables.map(v => <option key={v.id} value={v.id}>{v.name} ({v.symbol})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-2">تسمية المحور الصادي (Y)</label>
                                    <input 
                                        type="text" 
                                        value={config.graphConfig?.yAxisLabel || ''} 
                                        onChange={e => updateConfig('graphConfig', { ...config.graphConfig, yAxisLabel: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#fbbf24]" 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-2">وحدة النتيجة النهائية</label>
                                    <input 
                                        type="text" 
                                        value={config.resultUnit} 
                                        onChange={e => updateConfig('resultUnit', e.target.value)}
                                        placeholder="Joule, Newton..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-[#00d2ff] font-bold outline-none focus:border-[#00d2ff] text-center" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. CONTENT TAB */}
            {activeTab === 'CONTENT' && (
                <div className="animate-fadeIn max-w-4xl mx-auto">
                    <div className="flex gap-4 justify-center mb-8">
                        <button onClick={() => addContentBlock('text')} className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all">
                            <Type size={20} className="text-[#fbbf24]"/>
                            <div className="text-right">
                                <span className="block text-xs font-bold text-white">نص منسق</span>
                                <span className="block text-[9px] text-gray-500">شرح، تعريفات، قوانين</span>
                            </div>
                        </button>
                        <button onClick={() => addContentBlock('image')} className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all">
                            <ImageIcon size={20} className="text-blue-400"/>
                            <div className="text-right">
                                <span className="block text-xs font-bold text-white">صورة / وسائط</span>
                                <span className="block text-[9px] text-gray-500">مخططات، صور توضيحية</span>
                            </div>
                        </button>
                        <button onClick={() => addContentBlock('html')} className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all">
                            <Code size={20} className="text-green-400"/>
                            <div className="text-right">
                                <span className="block text-xs font-bold text-white">كود مخصص</span>
                                <span className="block text-[9px] text-gray-500">Embed, Iframe, Scripts</span>
                            </div>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {lesson.content?.map((block, idx) => (
                            <div key={idx} className="p-6 bg-black/40 rounded-[30px] border border-white/5 group relative hover:border-white/10 transition-all">
                                <div className="absolute left-4 top-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => moveContentBlock(idx, 'up')} disabled={idx === 0} className="p-2 bg-white/5 rounded-full hover:bg-white/20 disabled:opacity-30"><MoveUp size={14}/></button>
                                    <button onClick={() => moveContentBlock(idx, 'down')} disabled={idx === (lesson.content?.length || 0) - 1} className="p-2 bg-white/5 rounded-full hover:bg-white/20 disabled:opacity-30"><MoveDown size={14}/></button>
                                    <button onClick={() => removeContentBlock(idx)} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white mt-2"><Trash2 size={14}/></button>
                                </div>

                                <div className="ml-10">
                                    <div className="mb-4">
                                        <input 
                                            type="text" 
                                            placeholder="عنوان الفقرة (اختياري)" 
                                            value={block.caption || ''} 
                                            onChange={e => updateContentBlock(idx, 'caption', e.target.value)} 
                                            className="w-full bg-transparent border-b border-white/5 pb-2 text-white font-bold text-lg outline-none focus:border-[#fbbf24] placeholder:text-gray-600" 
                                        />
                                    </div>

                                    {block.type === 'text' && (
                                        <>
                                            <TextToolbar targetId={`content_${idx}`} onInsert={(val) => {
                                                const textarea = document.getElementById(`content_${idx}`) as HTMLTextAreaElement;
                                                if (textarea) {
                                                    const start = textarea.selectionStart;
                                                    const end = textarea.selectionEnd;
                                                    const text = block.content;
                                                    const newText = text.substring(0, start) + val + text.substring(end);
                                                    updateContentBlock(idx, 'content', newText);
                                                }
                                            }} />
                                            <textarea 
                                                id={`content_${idx}`}
                                                value={block.content} 
                                                onChange={e => updateContentBlock(idx, 'content', e.target.value)} 
                                                placeholder="اكتب المحتوى هنا... يمكنك استخدام Markdown و LaTeX" 
                                                className="w-full h-32 bg-transparent text-gray-300 text-sm outline-none resize-y leading-relaxed" 
                                            />
                                        </>
                                    )}

                                    {block.type === 'image' && (
                                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                                            {block.content ? (
                                                <div className="relative w-full">
                                                    <img src={block.content} alt="Preview" className="max-h-64 mx-auto rounded-xl shadow-lg" />
                                                    <button onClick={() => updateContentBlock(idx, 'content', '')} className="absolute top-2 right-2 bg-red-500 p-2 rounded-full text-white shadow-xl hover:scale-110 transition-transform"><X size={14}/></button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                                                        {isUploading === idx ? <Activity className="animate-spin"/> : <ImageIcon size={32}/>}
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-400">اضغط لرفع صورة توضيحية</p>
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files && handleImageUpload(idx, e.target.files[0])} />
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {block.type === 'html' && (
                                        <textarea 
                                            value={block.content} 
                                            onChange={e => updateContentBlock(idx, 'content', e.target.value)} 
                                            placeholder="<div>Your Custom HTML/JS...</div>" 
                                            className="w-full h-40 bg-black/60 border border-white/10 rounded-xl p-4 text-green-400 font-mono text-xs ltr text-left outline-none focus:border-green-500" 
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminUniversalLessonEditor;
