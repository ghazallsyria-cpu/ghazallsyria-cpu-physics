
import React, { useState } from 'react';
import { Question, QuestionType, SubjectType } from '../types';
import { X, Plus, Trash2, Image as ImageIcon, Type, FileUp, MessageSquare } from 'lucide-react';

interface QuestionEditorProps {
  question: Partial<Question>;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question: initialQuestion, onSave, onCancel }) => {
  const [question, setQuestion] = useState<Partial<Question>>(initialQuestion);

  const updateField = (field: keyof Question, value: any) => {
    setQuestion(prev => ({ ...prev, [field]: value }));
  };
  
  const handleChoiceChange = (index: number, text: string) => {
    const newChoices = [...(question.choices || [])];
    newChoices[index] = { ...newChoices[index], text };
    updateField('choices', newChoices);
  };
  
  const addChoice = () => {
    const newChoices = [...(question.choices || []), { id: `c_${Date.now()}`, text: '' }];
    updateField('choices', newChoices);
  };
  
  const removeChoice = (index: number) => {
    updateField('choices', question.choices?.filter((_, i) => i !== index));
  };
  
  const handleSaveClick = () => {
    // Validation
    if (!question.text?.trim() || !question.score || question.score <= 0) {
        alert('يرجى تعبئة نص السؤال وتحديد درجة صحيحة.');
        return;
    }
    onSave(question as Question);
  };

  const QuestionTypeButton: React.FC<{ type: QuestionType, label: string, icon: React.ReactNode }> = ({ type, label, icon }) => (
    <button onClick={() => updateField('type', type)} className={`flex-1 flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-lg border transition-all ${question.type === type ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5'}`}>
        {icon} {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a1118] border border-white/10 w-full max-w-3xl rounded-[40px] p-8 shadow-3xl animate-fadeIn flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
          <h3 className="text-2xl font-black text-white">{initialQuestion.id?.startsWith('q_') ? 'إنشاء سؤال جديد' : 'تعديل السؤال'}</h3>
          <button onClick={onCancel} className="p-2 text-gray-500 hover:text-white"><X/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                <QuestionTypeButton type="mcq" label="اختيار من متعدد" icon={<ImageIcon size={14}/>} />
                <QuestionTypeButton type="short_answer" label="إجابة قصيرة" icon={<Type size={14}/>} />
                <QuestionTypeButton type="essay" label="مقالي" icon={<MessageSquare size={14}/>} />
                <QuestionTypeButton type="file_upload" label="رفع ملف" icon={<FileUp size={14}/>} />
            </div>

            <textarea value={question.text || ''} onChange={e => updateField('text', e.target.value)} placeholder="نص السؤال..." className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-4 text-white outline-none focus:border-[#fbbf24]"/>
            <div className="flex gap-4 items-center">
                <input type="text" placeholder="رابط صورة توضيحية (اختياري)" value={question.imageUrl || ''} onChange={e => updateField('imageUrl', e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#fbbf24] text-sm"/>
                {question.imageUrl && <img src={question.imageUrl} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-white/10"/>}
            </div>

            {question.type === 'mcq' && (
                <div className="space-y-3">
                    {question.choices?.map((choice, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input type="radio" name="correctChoice" checked={question.correctChoiceId === choice.id} onChange={() => updateField('correctChoiceId', choice.id)} className="accent-[#fbbf24]"/>
                            <input type="text" value={choice.text} onChange={e => handleChoiceChange(index, e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-white/20"/>
                            <button onClick={() => removeChoice(index)} className="p-2 text-red-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    <button onClick={addChoice} className="text-xs font-bold text-green-400 flex items-center gap-1"><Plus size={14}/> إضافة خيار</button>
                </div>
            )}
            
            {(question.type === 'short_answer' || question.type === 'essay') && (
                <textarea value={question.modelAnswer || ''} onChange={e => updateField('modelAnswer', e.target.value)} placeholder="الإجابة النموذجية (للمعلم)" className="w-full h-24 bg-black/20 border border-white/10 rounded-lg p-4 text-white outline-none focus:border-[#fbbf24]"/>
            )}
            
            {question.type === 'file_upload' && (
                <div className="p-4 bg-blue-500/10 text-blue-400 text-xs text-center rounded-lg border border-blue-500/20">سيُطلب من الطالب رفع ملف كإجابة (مثل صورة أو PDF).</div>
            )}

            <div className="pt-4 border-t border-white/10">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2 mb-2 block">شرح الحل (اختياري)</label>
                <textarea 
                    value={question.solution || ''} 
                    onChange={e => updateField('solution', e.target.value)} 
                    placeholder="شرح موجز لكيفية الوصول إلى الحل الصحيح. يدعم معادلات LaTeX باستخدام $...$" 
                    className="w-full h-24 bg-black/20 border border-white/10 rounded-lg p-4 text-white outline-none focus:border-[#fbbf24]"
                />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500">الدرجة</label>
                    <input type="number" placeholder="الدرجة" value={question.score || ''} onChange={e => updateField('score', parseInt(e.target.value) || 0)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-[#fbbf24]"/>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500">الوحدة</label>
                    <input type="text" placeholder="الوحدة" value={question.unit || ''} onChange={e => updateField('unit', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-[#fbbf24]"/>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500">مستوى الصعوبة</label>
                    <select value={question.difficulty || 'Medium'} onChange={e => updateField('difficulty', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-[#fbbf24]">
                        <option value="Easy">سهل</option>
                        <option value="Medium">متوسط</option>
                        <option value="Hard">صعب</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500">الصف</label>
                    <select value={question.grade} onChange={e => updateField('grade', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-[#fbbf24]">
                        <option value="10">الصف 10</option>
                        <option value="11">الصف 11</option>
                        <option value="12">الصف 12</option>
                        <option value="uni">جامعي</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500">المادة</label>
                    <select value={question.subject} onChange={e => updateField('subject', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-[#fbbf24]">
                        <option value="Physics">الفيزياء</option>
                        <option value="Chemistry">الكيمياء</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <button onClick={handleSaveClick} className="w-full bg-green-500 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">
            حفظ السؤال
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
