import React, { useState, useEffect } from 'react';
import * as genAI from "@google/genai";

type ImageSize = "1K" | "2K" | "4K";

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  // Check for API key on mount
  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        setHasApiKey(true); // Assume true if the check is not available
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true); // Assume success to mitigate race condition
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      // Create new instance to use the latest key from the dialog
      const ai = new genAI.GoogleGenAI({ apiKey: process.env.API_KEY });

      const response: genAI.GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `Educational, high-quality, cinematic physics visualization, suitable for a Kuwaiti curriculum: ${prompt}` }],
        },
        config: {
          imageConfig: {
            imageSize,
            aspectRatio: "16:9",
          },
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content.parts || []) {
        if (part.inlineData) {
          setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("The model did not return an image. Please try rephrasing your prompt.");
      }
    } catch (e: any) {
      console.error("Image Generation Error:", e);
      if (e?.message?.includes("Requested entity was not found.")) {
        setError("فشل التحقق من مفتاح API. يرجى اختيار مفتاح صالح من مشروع GCP مفعل به الفوترة.");
        setHasApiKey(false); // Reset key state to re-trigger the dialog
      } else {
        setError(e.message || "An unknown error occurred during image generation.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderKeySelection = () => (
    <div className="py-10 animate-slideUp text-center">
       <h3 className="text-xl font-black mb-4 text-white">تنشيط مولد الصور المتقدم</h3>
       <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
         هذه الميزة تتطلب استخدام مفتاح API الخاص بك والمفعل به نظام الدفع من Google Cloud.
         <br />
         <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[#FF6B00] hover:underline font-bold mt-2 inline-block">
           راجع تعليمات الفوترة والأسعار
         </a>
       </p>
       <button 
         onClick={handleOpenKeyDialog}
         className="bg-[#FF6B00] text-white px-12 py-5 rounded-[30px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-orange-500/20"
       >
         اختيار مفتاح API
       </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fadeIn">
      <div className="glass-panel p-12 rounded-[60px] border-[#FF6B00]/20 text-center">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#FF6B00] to-yellow-400 rounded-3xl flex items-center justify-center text-3xl shadow-2xl mb-6">🎨</div>
          <h2 className="text-4xl font-black mb-4">مولد الصور <span className="text-[#FF6B00]">الفيزيائية</span></h2>
          <p className="text-gray-500 max-w-lg">حوّل الأفكار الفيزيائية المعقدة إلى صور بصرية مذهلة وعالية الدقة.</p>
        </div>

        {hasApiKey === false ? renderKeySelection() : (
          <>
            <div className="space-y-6 mb-8">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثال: ثقب أسود يبتلع نجم نيوتروني، بأسلوب سينمائي واقعي"
                className="w-full h-32 bg-white/5 border border-white/10 rounded-[30px] p-8 text-white outline-none focus:border-[#FF6B00] transition-all text-center text-lg resize-none"
                disabled={isLoading}
              />
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                 <div className="flex bg-white/5 rounded-full p-2 border border-white/10">
                    {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
                      <button 
                        key={size}
                        onClick={() => setImageSize(size)}
                        className={`px-8 py-3 rounded-full text-xs font-black transition-all ${imageSize === size ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                      >
                        {size}
                      </button>
                    ))}
                 </div>
                 <button 
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="bg-[#FF6B00] text-white px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20 w-full md:w-auto"
                  >
                    {isLoading ? 'جاري التوليد...' : 'ولّد الصورة'}
                  </button>
              </div>
            </div>

            {isLoading && (
              <div className="py-20 animate-pulse">
                <div className="w-16 h-16 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
                <p className="text-[#FF6B00] font-black uppercase tracking-[0.2em]">جاري معالجة المشهد البصري...</p>
              </div>
            )}

            {error && (
              <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[30px] text-red-400 font-bold animate-shake">
                {error}
              </div>
            )}

            {imageUrl && !isLoading && (
              <div className="mt-12 animate-slideUp">
                <div className="rounded-[40px] overflow-hidden border-2 border-[#FF6B00]/30 shadow-2xl aspect-video bg-black relative group">
                   <img src={imageUrl} alt={prompt} className="w-full h-full object-contain" />
                   <a 
                     href={imageUrl} 
                     download={`physics-image-${Date.now()}.png`}
                     className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl text-xs font-black text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100"
                   >
                     تحميل الصورة 📥 
                   </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
