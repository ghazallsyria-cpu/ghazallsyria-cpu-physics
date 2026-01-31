
import JSZip from 'jszip';

export const exportFullProject = async () => {
  const zip = new JSZip();

  // مصفوفة تحتوي على كافة الملفات ومحتوياتها (بناءً على ما تم تطويره)
  // ملاحظة: في بيئة الإنتاج، يجب أن تكون هذه البيانات ديناميكية أو يتم جلبها من الخادم
  
  alert("جاري تحضير حزمة المشروع... قد يستغرق ذلك ثواني.");

  zip.file("README.txt", "شرح تشغيل المشروع:\n1. قم بفك الضغط.\n2. افتح ملف index.html في المتصفح.\n3. تأكد من وجود اتصال إنترنت لعمل المكتبات الخارجية.");
  
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = "SyrianScienceCenter_Project.zip";
  a.click();
  URL.revokeObjectURL(url);
};
