import { GoogleGenAI, Type } from "@google/genai";
import { AISolverResult, User, StudentQuizAttempt, Question, Curriculum, AILessonSchema } from "../types";

// --- Helper for Robust JSON Parsing ---
const cleanAndParseJSON = (text: string) => {
  if (!text) return null;
  try {
    // 1. إزالة علامات المارك داون
    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // 2. البحث عن أول قوس فتح { وآخر قوس إغلاق }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parsing Failed. Raw text:", text);
    return null;
  }
};

// Helper function to convert data URL to parts for Gemini
const fileToGenerativePart = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        throw new Error('Invalid data URL');
    }
    return {
        inlineData: {
            mimeType: match[1],
            data: match[2]
        }
    };
};

// Access the API key safely using Vite's env standard
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

export const getAdvancedPhysicsInsight = async (userMsg: string, grade: string, subject: 'Physics' | 'Chemistry') => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const subjectName = subject === 'Physics' ? 'الفيزياء' : 'الكيمياء';
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: userMsg,
      config: {
        systemInstruction: `أنت المساعد الذكي في المركز السوري للعلوم لمادة ${subjectName}. 
        تحدث بلغة العلم الراقية والداعمة. 
        استخدم صيغة LaTeX للمعادلات الرياضية، مثلاً $E=mc^2$ للمعادلات المضمنة و $$F=ma$$ للكتل المنفصلة.`,
      }
    });
    return { text: response.text || "", thinking: null };
  } catch (e: any) {
    console.error("Chat Error:", e);
    let errorMsg = "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.";
    if (e.message?.includes('API_KEY')) errorMsg += " (يرجى التحقق من مفتاح API)";
    return { text: errorMsg, thinking: null };
  }
};

export const getPhysicsExplanation = async (prompt: string, grade: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `اشرح لصف ${grade}: ${prompt}`,
      config: { systemInstruction: "أنت معلم فيزياء ملهم تبسط المفاهيم المعقدة." }
    });
    return response.text || "";
  } catch (e) {
    console.error(e);
    return "";
  }
};

export const solvePhysicsProblem = async (problem: string): Promise<AISolverResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `حل المسألة الفيزيائية التالية: ${problem}`,
    config: {
      systemInstruction: "أنت خبير في حل المسائل الفيزيائية. قدم الحل بخطوات واضحة، مع ذكر القانون المستخدم، والناتج النهائي مع الوحدة، وشرح مبسط للنتيجة. استخدم صيغة JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          law: { type: Type.STRING, description: 'القانون الفيزيائي المستخدم بصيغة LaTeX' },
          steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'خطوات الحل بالتفصيل' },
          finalResult: { type: Type.STRING, description: 'النتيجة النهائية مع الوحدة بصيغة LaTeX' },
          explanation: { type: Type.STRING, description: 'شرح مبسط لمعنى النتيجة' },
        }
      }
    }
  });

  const jsonText = response.text?.trim() || '{}';
  return cleanAndParseJSON(jsonText) as AISolverResult;
};

export const getPerformanceAnalysis = async (user: User, attempts: StudentQuizAttempt[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const prompt = `
    حلل أداء الطالب ${user.name} بناءً على نتائج اختباراته:
    ${JSON.stringify(attempts, null, 2)}
    قدم تقريراً مفصلاً حول نقاط القوة والضعف، مع نصائح لتحسين المستوى في المواضيع التي يواجه فيها صعوبة.
  `;
  const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
  return response.text || "لا توجد بيانات كافية للتحليل.";
};

export const generatePhysicsVisualization = async (prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Cinematic, educational, high-quality visualization of a physics concept: ${prompt}`,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed to produce a download link.");
    }

    // Pass the API key to fetch the video securely
    const response = await fetch(`${downloadLink}&key=${getApiKey()}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

export const extractBankQuestionsAdvanced = async (
  rawText: string,
  grade: string,
  subject: string,
  unit: string
): Promise<{ questions: Question[] }> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Digitize the following questions text for grade ${grade}, subject ${subject}, unit ${unit}. Extract all questions into a structured JSON format. For each question, provide: question_text, type ('mcq', 'short_answer', 'essay'), choices (array of {key: 'A', text: '...'}), correct_answer (the key of the correct choice), difficulty ('Easy', 'Medium', 'Hard'), category, solution (detailed explanation), steps_array (if applicable), and common_errors (if applicable). Here is the text:\n\n${rawText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING, description: "The full text of the question." },
                type: { type: Type.STRING, description: "Type of question: 'mcq', 'short_answer', 'essay'." },
                choices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      key: { type: Type.STRING },
                      text: { type: Type.STRING }
                    },
                    required: ['key', 'text']
                  }
                },
                correct_answer: { type: Type.STRING, description: "The key of the correct choice for MCQ questions." },
                difficulty: { type: Type.STRING, description: "'Easy', 'Medium', or 'Hard'." },
                category: { type: Type.STRING, description: "The specific topic or category of the question." },
                solution: { type: Type.STRING, description: "A detailed explanation for the solution." },
                steps_array: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step solution if applicable." },
                common_errors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Common mistakes students make." },
                question_latex: { type: Type.STRING, description: "LaTeX version of the question if it contains complex formulas." },
                hasDiagram: { type: Type.BOOLEAN, description: "True if the question refers to a diagram that needs to be manually added." },
              },
            },
          },
        },
      },
    },
  });

  const jsonText = response.text?.trim() || '{"questions":[]}';
  return cleanAndParseJSON(jsonText) as { questions: Question[] };
};

export const digitizeExamPaper = async (
  imageDataUrl: string,
  grade: string,
  subject: string,
): Promise<{ questions: Question[] }> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const imagePart = fileToGenerativePart(imageDataUrl);

  const textPart = {
    text: `Digitize the exam paper in the image. This is for grade ${grade}, subject ${subject}. Extract all questions into a structured JSON format. For each question, provide: question_text, type ('mcq', 'short_answer', 'essay'), choices (array of {key: 'A', text: '...'}), correct_answer (the key of the correct choice), difficulty ('Easy', 'Medium', 'Hard'), category, solution (detailed explanation), hasDiagram (true if there's a diagram).`
  };
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts: [textPart, imagePart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING },
                type: { type: Type.STRING },
                choices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { key: { type: Type.STRING }, text: { type: Type.STRING }},
                    required: ['key', 'text']
                  }
                },
                correct_answer: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                category: { type: Type.STRING },
                solution: { type: Type.STRING },
                hasDiagram: { type: Type.BOOLEAN },
              },
            },
          },
        },
      },
    },
  });

  const jsonText = response.text?.trim() || '{"questions":[]}';
  return cleanAndParseJSON(jsonText) as { questions: Question[] };
};

export const verifyQuestionQuality = async (
  question: Question
): Promise<{ valid: boolean; feedback: string }> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const questionString = JSON.stringify({
    text: question.text,
    type: question.type,
    choices: question.choices,
    correctChoiceId: question.correctChoiceId,
    solution: question.solution,
    difficulty: question.difficulty,
    subject: question.subject,
    grade: question.grade,
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Please act as a quality control expert for educational content. Verify the following question for scientific accuracy, clarity, and appropriateness for the specified grade. Check if the solution correctly answers the question and if the correct answer is marked properly. Provide your feedback in JSON format. Question data: ${questionString}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          valid: { type: Type.BOOLEAN, description: "True if the question is scientifically accurate, clear, and well-formed." },
          feedback: { type: Type.STRING, description: "Constructive feedback. If valid is false, explain why. If valid is true, provide a short confirmation." },
        },
        required: ['valid', 'feedback']
      },
    },
  });

  const jsonText = response.text?.trim() || '{"valid": false, "feedback": "AI analysis failed."}';
  try {
    return cleanAndParseJSON(jsonText) as { valid: boolean; feedback: string };
  } catch (e) {
    return { valid: false, feedback: "Failed to parse AI response." };
  }
};

export const convertTextbookToLesson = async (
  inputContent: string, 
  grade: string = "12",
  imageData?: string
): Promise<AILessonSchema | null> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const systemInstruction = `
أنت محرك تحويل محتوى تعليمي متخصص في المناهج الدراسية.
مهمتك: تحليل المدخلات (صورة صفحة كتاب أو نص) وتحويلها إلى درس تفاعلي منظم بصيغة JSON.

خطوات العمل:
1. اقرأ النص الموجود في الصورة (OCR) بدقة متناهية، أو استخدم النص المدخل.
2. استخرج المفاهيم العلمية، التعاريف، القوانين، والأمثلة.
3. قم ببناء هيكل درس تفاعلي يحتوي على مقدمة، محاكاة (إذا لزم الأمر)، وشرح للمفاهيم، واختبار قصير.

ملاحظات هامة:
- التزم بالمنهج الدراسي للصف المحدد (${grade}).
- اجعل الشرح مبسطاً وجذاباً.
- الإخراج يجب أن يكون JSON صالحاً تماماً وفق المخطط المطلوب.
`;

  const parts: any[] = [];
  const promptText = inputContent?.trim() 
    ? `Analyze this content: ${inputContent}` 
    : "Analyze the provided image deeply. Extract all scientific concepts, definitions, and examples, then structure them into a lesson.";
    
  parts.push({ text: promptText });
  
  if (imageData) {
      parts.push(fileToGenerativePart(imageData));
  }
  
  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts },
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    lesson_metadata: {
                        type: Type.OBJECT,
                        properties: {
                            grade: { type: Type.STRING },
                            subject: { type: Type.STRING },
                            lesson_title: { type: Type.STRING },
                            unit: { type: Type.STRING },
                            status: { type: Type.STRING },
                            version: { type: Type.NUMBER }
                        }
                    },
                    learning_objectives: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    content_blocks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                block_id: { type: Type.STRING },
                                block_type: { type: Type.STRING },
                                locked_after_approval: { type: Type.BOOLEAN },
                                linked_concept: { type: Type.STRING },
                                ui_component: {
                                    type: Type.OBJECT,
                                    properties: {
                                        component_category: { type: Type.STRING },
                                        react_component: { type: Type.STRING }
                                    }
                                },
                                textContent: { type: Type.STRING }
                            }
                        }
                    },
                    formulae: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                formula_text: { type: Type.STRING },
                                variables: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    }
                }
            }
        }
    });

    const jsonText = response.text || "";
    return cleanAndParseJSON(jsonText) as AILessonSchema;
    
  } catch (e) {
    console.error("Lesson Conversion Error:", e);
    return null;
  }
};