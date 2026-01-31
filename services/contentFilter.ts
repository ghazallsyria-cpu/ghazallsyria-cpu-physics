/**
 * نظام حماية المحتوى والرقابة التربوية للمركز السوري للعلوم
 */

// مصفوفة الكلمات المحظورة (نموذج مصغر - يجب توسيعه دورياً)
const PROHIBITED_WORDS = [
  // كلمات جنسية وخارجة
  'جنس', 'سكس', 'نيك', 'شرموط', 'قحب', 'عرص', 'منيوك', 'كس', 'طيز', 'زب', 'خنيث', 'لوطي',
  'porn', 'sex', 'xvideos', 'naked', 'f**k', 'bitch',
  // شتائم عامة
  'حمار', 'كلب', 'غبي', 'تفه', 'انقلع', 'تيس', 'يا حيوان',
  // كلمات سياسية حساسة (اختياري حسب سياسة المنصة)
  'ثورة', 'انقلاب', 'مظاهرة',
];

// أنماط البيانات الحساسة (أرقام هواتف، إيميلات) لفتح قنوات تواصل خارجية
const SENSITIVE_PATTERNS = {
  phone: /\b(?:\+?965|00965|965)?[569]\d{7}\b|\b(?:\+?963|00963|963)?\d{9}\b/g, // الكويت وسوريا
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
};

export interface FilterResult {
  isClean: boolean;
  cleanedText: string;
  detectedWords: string[];
}

class ContentFilterService {
  /**
   * فحص وتطهير النص
   */
  filter(text: string, options: { maskOnly?: boolean, blockSensitive?: boolean } = {}): FilterResult {
    if (!text) return { isClean: true, cleanedText: '', detectedWords: [] };

    let cleanedText = text;
    const detectedWords: string[] = [];
    const lowerText = text.toLowerCase();

    // 1. فحص الكلمات المحظورة
    PROHIBITED_WORDS.forEach(word => {
      // استخدام Regex للبحث عن الكلمة ككلمة كاملة أو جزء من كلمة
      const regex = new RegExp(word, 'gi');
      if (regex.test(lowerText)) {
        detectedWords.push(word);
        cleanedText = cleanedText.replace(regex, '****');
      }
    });

    // 2. فحص الأنماط الحساسة (أرقام هواتف)
    if (options.blockSensitive) {
        if (SENSITIVE_PATTERNS.phone.test(cleanedText)) {
            detectedWords.push('رقم هاتف');
            cleanedText = cleanedText.replace(SENSITIVE_PATTERNS.phone, '[رقم مخفي 🔒]');
        }
        if (SENSITIVE_PATTERNS.email.test(cleanedText)) {
            detectedWords.push('بريد إلكتروني');
            cleanedText = cleanedText.replace(SENSITIVE_PATTERNS.email, '[إيميل مخفي 🔒]');
        }
    }

    return {
      isClean: detectedWords.length === 0,
      cleanedText: cleanedText,
      detectedWords: detectedWords
    };
  }

  /**
   * دالة سريعة للتحقق فقط (نعم/لا)
   */
  isSafe(text: string): boolean {
    const result = this.filter(text);
    return result.isClean;
  }
}

export const contentFilter = new ContentFilterService();
