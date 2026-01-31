
import React, { useState, useRef } from 'react';
import { Lesson, ContentBlock, ContentBlockType, AILessonSchema } from '../types';
import { Book, Image, Video, FileText, Trash2, ArrowUp, ArrowDown, Type, Save, X, Youtube, FileAudio, CheckCircle, AlertTriangle, Code, Sparkles, RefreshCw, Upload, Link as LinkIcon, Cpu, Waypoints } from 'lucide-react';
import YouTubePlayer from './YouTubePlayer';
import { dbService } from '../services/db';
import { convertTextbookToLesson } from '../services/gemini';
import AdminUniversalLessonEditor from './AdminUniversalLessonEditor';

interface LessonEditorProps {
  lessonData: Partial<Lesson>;
  unitId: string;
  grade: '10' | '11' | '12';
  subject: 'Physics' | 'Chemistry';
  onSave: (lesson: Lesson, unitId: string) => void;
  onCancel: () => void;
}

const extractYoutubeId = (url: string): string | null => {
    if (!url) {
        return null;
    }
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\v(?:i)?=|\&v(?:i)?=))([^#\&\?]{11}).*/;
    const match = url.match(regExp);

    return (match && match[1]) ? match[1] : null;
};

const LessonEditor: React.FC<LessonEditorProps> = ({ lessonData, unitId, grade, subject, onSave, onCancel }) => {
  const [lesson, setLesson] = useState<Partial<Lesson>>(lessonData);
  
  // Standard Editor State
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [showUrlInputFor, setShowUrlInputFor] = useState<Record<number, boolean>>({});
  
  // AI Import State
  const [showAIImport, setShowAIImport] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers for Standard Editor ---
  const updateField = (field: keyof Lesson, value: any) => {
    setLesson(prev => ({ ...prev, [field]: value }));
  };

  const updateBlock = (index: number, updatedBlock: ContentBlock) => {
    const newContent = [...(lesson.content || [])];
    newContent[index] = updatedBlock;
    updateField('content', newContent);
  };
  
  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const asset = await dbService.uploadAsset(file);
      updateBlock(index, { ...(lesson.content?.[index] as ContentBlock), content: asset.url });
    } catch (error) {
      console.error("Upload failed", error);
      alert("فشل رفع الملف. يرجى المحاولة مرة أخرى.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const addBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = { type, content: '' };
    updateField('content', [...(lesson.content || []), newBlock]);
  };
  
  const removeBlock = (index: number) => {
    updateField('content', (lesson.content || []).filter((_, i) => i !== index));
  };
  
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const content = [...(lesson.content || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= content.length) return;
    [content[index], content[targetIndex]] = [content[targetIndex], content[index]];
    updateField('content', content);
  };
  
  const handleSaveStandard = () => {
    if (!lesson.title?.trim() || (!lesson.content || lesson.content.length === 0) && lesson.templateType === 'STANDARD') {
      alert("يرجى ملء عنوان الدرس وإضافة محتوى واحد على الأقل.");
      return;
    }
    onSave(lesson as Lesson, unitId);
  };

  // AI Helper Functions
  const handleAiImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setAiImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAIImport = async () => {
    if (!aiInputText.trim() && !aiImage) {
        setAiError("يرجى إدخال نص أو رفع صورة للبدء.");
        return;
    }
    
    setIsAiProcessing(true);
    setAiError(null);
    try {
        const schema: AILessonSchema | null = await convertTextbookToLesson(
            aiInputText, 
            grade, 
            aiImage || undefined
        );
        
        if (schema) {
            setLesson(prev => ({
                ...prev,
                title: schema.lesson_metadata.lesson_title,
                aiGeneratedData: schema,
                content: schema.content_blocks.map(block => ({
                    type: block.block_type === 'intro' ? 'text' : block.block_type === 'simulation' ? 'html' : 'text',
                    content: block.textContent || JSON.stringify(block.ui_component, null, 2),
                    caption: block.linked_concept
                }))
            }));
            setShowAIImport(false);
            setAiInputText('');
            setAiImage(null);
        } else {
            setAiError("لم يتمكن النظام من تحليل المدخلات. يرجى التأكد من وضوح النص أو الصورة.");
        }
    } catch (e) {
        console.error(e);
        setAiError("حدث خطأ تقني أثناء الاتصال بالمحرك الذكي.");
    } finally {
        setIsAiProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 animate-fadeIn font-['Tajawal'] text-white">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black">{lesson.id?.startsWith('l_') ? 'إضافة درس جديد' : 'تعديل الدرس'}</h2>
        <div className="flex gap-4">
            <button onClick={() => setShowAIImport(true)} className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg text-xs font-bold shadow-lg hover:bg-purple-600 transition-all"><Sparkles size={14}/> استيراد ذكي (AI)</button>
            <button onClick={onCancel} className="flex items-center gap-2 px-6 py-3 bg-white/5 text-white rounded-lg text-xs font-bold border border-white/10"><X size={14}/> إلغاء</button>
            <button onClick={handleSaveStandard} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-black rounded-lg text-xs font-bold border border-green-500/20"><Save size={14}/> حفظ الدرس</button>
        </div>
      </div>

      <div className="glass-panel p-10 rounded-[40px] border border-white/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input type="text" placeholder="عنوان الدرس" value={lesson.title || ''} onChange={e => updateField('title', e.target.value)} className="md:col-span-3 w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#fbbf24]"/>
          <select value={lesson.type || 'THEORY'} onChange={e => updateField('type', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#fbbf24]">
            <option value="THEORY">شرح نظري</option>
            <option value="EXAMPLE">مثال محلول</option>
            <option value="EXERCISE">تمرين</option>
          </select>
          <div className="md:col-span-2">
            <select value={lesson.templateType || 'STANDARD'} onChange={e => updateField('templateType', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#fbbf24]">
              <option value="STANDARD">قالب عادي</option>
              <option value="UNIVERSAL">قالب تفاعلي شامل</option>
              <option value="PATH">مسار تفاعلي متفرع</option>
            </select>
          </div>
        </div>

        {/* Content Blocks */}
        <div className="space-y-6 pt-8 border-t border-white/10">
          <h3 className="font-bold text-gray-400">محتوى الدرس:</h3>
          {(lesson.content || []).map((block, index) => (
            <div key={index} className="p-6 bg-black/20 rounded-2xl border border-white/10 flex gap-4">
              <div className="flex flex-col gap-2">
                <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1 bg-white/5 rounded disabled:opacity-20"><ArrowUp size={14}/></button>
                <button onClick={() => moveBlock(index, 'down')} disabled={index === lesson.content!.length - 1} className="p-1 bg-white/5 rounded disabled:opacity-20"><ArrowDown size={14}/></button>
                <button onClick={() => removeBlock(index)} className="p-1 bg-red-500/10 text-red-400 rounded mt-auto"><Trash2 size={14}/></button>
              </div>
              <div className="flex-1 space-y-3">
                <label className="text-xs font-bold text-gray-500 capitalize flex items-center gap-2">
                    {block.type === 'text' && <Type size={12}/>}
                    {block.type === 'image' && <Image size={12}/>}
                    {block.type === 'video' && <Video size={12}/>}
                    {block.type === 'youtube' && <Youtube size={12}/>}
                    {block.type === 'pdf' && <FileText size={12}/>}
                    {block.type === 'audio' && <FileAudio size={12}/>}
                    {block.type === 'html' && <Code size={12}/>}
                    {block.type} Content
                </label>
                
                {block.type === 'text' ? (
                  <textarea value={block.content} onChange={e => updateBlock(index, {...block, content: e.target.value})} placeholder="اكتب الشرح هنا (يدعم Markdown والمعادلات)..." className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/20"/>
                ) : block.type === 'html' ? (
                  <div className="space-y-2">
                      <div className="text-[10px] text-gray-500 flex items-center gap-2">
                          <AlertTriangle size={12} className="text-amber-500" />
                          <span>يدعم HTML/CSS/JS. يمكنك استخدام روابط خارجية مثل: &lt;script src="https://..."&gt;</span>
                      </div>
                      <textarea 
                        value={block.content} 
                        onChange={e => updateBlock(index, {...block, content: e.target.value})} 
                        placeholder="<div>...</div> <style>...</style> <script>...</script>" 
                        className="w-full h-48 bg-black/60 border border-white/10 rounded-lg p-3 text-green-400 font-mono text-sm outline-none focus:border-white/20 ltr text-left"
                      />
                  </div>
                ) : (block.type === 'image' || block.type === 'video' || block.type === 'pdf' || block.type === 'audio') ? (
                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    {(() => {
                      const isUploaded = block.content && (block.content.includes('supabase.co') || block.content.includes('firebasestorage.googleapis.com'));
                      const isExternalUrl = block.content && (block.content.startsWith('http') || block.content.startsWith('https')) && !isUploaded;

                      if (isUploaded) {
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-green-400 text-xs font-bold p-2 bg-green-500/10 rounded-md border border-green-500/20">
                              <CheckCircle size={14}/>
                              <span>تم تخزين الملف في مستودع الموقع لضمان بقائه.</span>
                            </div>
                            <input type="text" value={block.content} readOnly className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white/50 text-sm font-mono"/>
                            <button onClick={() => updateBlock(index, { ...block, content: '' })} className="text-red-500 text-xs font-bold hover:underline">إزالة واستبدال</button>
                          </div>
                        );
                      }

                      if (isExternalUrl) {
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold p-2 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                              <AlertTriangle size={14}/>
                              <span>تحذير: قد يتوقف هذا الرابط الخارجي عن العمل مستقبلاً. يوصى برفع الملف مباشرة.</span>
                            </div>
                            <input type="text" value={block.content} onChange={e => updateBlock(index, { ...block, content: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm"/>
                            <button onClick={() => updateBlock(index, { ...block, content: '' })} className="text-red-500 text-xs font-bold hover:underline">إزالة واستبدال</button>
                          </div>
                        );
                      }
                      
                      if (showUrlInputFor[index]) {
                        return (
                          <div className="animate-fadeIn">
                            <input
                              type="text"
                              placeholder="ألصق الرابط الخارجي هنا..."
                              onBlur={(e) => {
                                if (e.target.value) updateBlock(index, { ...block, content: e.target.value });
                                setShowUrlInputFor(prev => ({ ...prev, [index]: false }));
                              }}
                              autoFocus
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm"
                            />
                          </div>
                        );
                      }

                      return (
                        <div className="flex gap-4">
                          <label className="flex-1 block text-center py-6 bg-blue-500/10 text-blue-400 text-sm font-bold rounded-lg cursor-pointer hover:bg-blue-500/20 border-2 border-blue-500/30">
                            {uploadingIndex === index ? 'جاري الرفع...' : `📂 رفع ملف (موصى به)`}
                            <input 
                              type="file" 
                              accept={
                                  block.type === 'image' ? 'image/*' :
                                  block.type === 'video' ? 'video/*' :
                                  block.type === 'pdf' ? 'application/pdf' :
                                  'audio/*'
                              }
                              className="hidden" 
                              onChange={(e) => e.target.files && handleFileUpload(index, e.target.files[0])}
                              disabled={uploadingIndex !== null}
                            />
                          </label>
                          <button 
                            onClick={() => setShowUrlInputFor(prev => ({ ...prev, [index]: true }))}
                            className="flex-1 py-6 bg-white/5 text-gray-400 text-sm font-bold rounded-lg border-2 border-dashed border-white/20 hover:border-white/40"
                          >
                            🔗 استخدام رابط خارجي
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <input 
                    type="text" 
                    value={block.content} 
                    onChange={e => updateBlock(index, {...block, content: e.target.value})} 
                    placeholder="أدخل رابط يوتيوب الكامل..." 
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/20"
                  />
                )}
                <input type="text" value={block.caption || ''} onChange={e => updateBlock(index, {...block, caption: e.target.value})} placeholder="تعليق توضيحي (اختياري)..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-white/20"/>

                {/* Instant Preview Section */}
                {(block.type === 'image' || block.type === 'video' || block.type === 'youtube') && block.content && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">معاينة فورية</label>
                    <div className="mt-2 bg-black/20 p-2 rounded-lg aspect-video flex items-center justify-center border border-white/5">
                      {block.type === 'image' && (
                        <img 
                          src={block.content} 
                          alt="معاينة" 
                          className="max-w-full max-h-full object-contain rounded-md"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                        />
                      )}
                      {block.type === 'video' && (
                        <video 
                          key={block.content}
                          controls 
                          src={block.content} 
                          className="w-full h-full rounded-md"
                        />
                      )}
                      {block.type === 'youtube' && (() => {
                        const videoId = extractYoutubeId(block.content);
                        return videoId ? (
                          <YouTubePlayer videoId={videoId} />
                        ) : (
                          <p className="text-xs text-red-400">رابط يوتيوب غير صالح للمعاينة. يرجى استخدام الرابط الكامل للفيديو.</p>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Block Buttons */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10">
            <button onClick={() => addBlock('text')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/5 rounded-lg border border-white/10"><Type size={14}/> إضافة نص</button>
            <button onClick={() => addBlock('image')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/5 rounded-lg border border-white/10"><Image size={14}/> إضافة صورة</button>
            <button onClick={() => addBlock('video')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/5 rounded-lg border border-white/10"><Video size={14}/> إضافة فيديو (عام)</button>
            <button onClick={() => addBlock('youtube')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20"><Youtube size={14}/> إضافة فيديو يوتيوب</button>
            <button onClick={() => addBlock('pdf')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-white/5 rounded-lg border border-white/10"><FileText size={14}/> إضافة PDF</button>
            <button onClick={() => addBlock('audio')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20"><FileAudio size={14}/> إضافة صوت</button>
            <button onClick={() => addBlock('html')} className="flex items-center gap-2 text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20"><Code size={14}/> كود HTML مخصص</button>
        </div>
      </div>

      {showAIImport && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
            <div className="glass-panel w-full max-w-3xl p-10 rounded-[40px] border border-white/10 bg-[#0a1118] relative shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <button onClick={() => setShowAIImport(false)} className="absolute top-6 left-6 text-gray-500 hover:text-white p-2 bg-white/5 rounded-full"><X size={20}/></button>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                        <Sparkles className="text-purple-400" size={32}/>
                    </div>
                    <h3 className="text-2xl font-black text-white">استيراد درس من الكتاب</h3>
                    <p className="text-gray-400 text-sm mt-2">انسخ نص الصفحة، أو ارفع صورتها، وسيقوم الذكاء الاصطناعي ببناء الدرس.</p>
                </div>
                
                {aiError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {aiError}
                    </div>
                )}
                
                <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-6">
                    {/* خيار رفع الصورة */}
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all bg-black/20 group cursor-pointer relative" onClick={() => aiFileInputRef.current?.click()}>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={aiFileInputRef} 
                            onChange={handleAiImageSelect} 
                        />
                        <div className="flex flex-col items-center justify-center gap-3 py-4">
                            {aiImage ? (
                                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10">
                                    <img src={aiImage} alt="Selected" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white font-bold text-sm">اضغط للتغيير</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Upload size={32} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
                                    <p className="text-sm font-bold text-gray-400 group-hover:text-white">اضغط هنا لرفع صورة الصفحة (OCR)</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* خيار النص أو الرابط */}
                    <div className="relative">
                        <div className="absolute top-4 right-4 flex items-center gap-2 text-purple-400 text-xs font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                            <LinkIcon size={12} />
                            <span>يدعم النصوص والروابط</span>
                        </div>
                        <textarea 
                            value={aiInputText} 
                            onChange={e => setAiInputText(e.target.value)} 
                            placeholder="أو الصق نص الدرس / رابط الصفحة هنا..." 
                            className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-purple-500 font-mono text-sm leading-relaxed pt-12"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleAIImport} 
                    disabled={isAiProcessing || (!aiInputText.trim() && !aiImage)}
                    className="w-full bg-purple-600 text-white py-5 mt-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-purple-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                >
                    {isAiProcessing ? <RefreshCw className="animate-spin" /> : <Sparkles size={18}/>}
                    {isAiProcessing ? 'جاري التحليل والبناء...' : 'تحويل إلى درس تفاعلي'}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default LessonEditor;