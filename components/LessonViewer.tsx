import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lesson, User, ContentBlock } from '../types';
import { dbService } from '../services/db';
import katex from 'katex';
import YouTubePlayer from './YouTubePlayer';
import { Share2, Copy, Send, Twitter, Mail, X, Check, Eye, EyeOff, Lock, Zap, FileText, Download, ExternalLink, RefreshCw } from 'lucide-react';
import UniversalLessonViewer from './UniversalLessonViewer';

interface LessonViewerProps {
  user: User;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ user }) => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const isSubscriber = user.subscription === 'premium' || user.role === 'admin' || user.role === 'teacher';

  useEffect(() => {
    if (!lessonId) return;
    
    const fetchLesson = async () => {
        setIsLoading(true);
        try {
            // NEW: Fetching directly from Supabase via dbService
            // FIX: Property 'getLessonSupabase' does not exist on type 'DBService'.
            const supabaseLesson = await dbService.getLesson(lessonId);
            setLesson(supabaseLesson);
        } catch (error) {
            console.error("Failed to fetch lesson from Supabase", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchLesson();
  }, [lessonId]);

  useEffect(() => {
    if (lesson) {
        setIsCompleted((user.progress.completedLessonIds || []).includes(lesson.id));
    }
  }, [user, lesson]);

  useEffect(() => {
    const handleScroll = () => {
        const totalScrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalScrollableHeight <= 0) {
            setScrollProgress(100);
            return;
        }
        const currentScroll = window.scrollY;
        const progress = (currentScroll / totalScrollableHeight) * 100;
        setScrollProgress(Math.min(progress, 100));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleComplete = async () => {
    if (!isSubscriber || !lesson) return;
    const wasCompleted = isCompleted;
    await dbService.toggleLessonComplete(user.uid, lesson.id);
    setIsCompleted(!isCompleted);
    if (!wasCompleted) {
        await dbService.createNotification({
            userId: user.uid,
            title: "إنجاز جديد!",
            message: `أحسنت! لقد أكملت درس "${lesson.title}". +10 نقاط!`,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'success',
            category: 'academic'
        });
    }
  };
  
  const handleBack = () => navigate(-1);

  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
              <RefreshCw className="w-12 h-12 text-amber-400 animate-spin" />
              <p className="text-gray-500 text-xs font-bold uppercase">جاري تحميل الدرس...</p>
          </div>
      );
  }

  if (!lesson) {
      return <div>Lesson not found.</div>;
  }

  if (lesson.templateType === 'UNIVERSAL') {
      return (
          <UniversalLessonViewer 
              lesson={lesson} 
              onBack={handleBack} 
              onComplete={handleToggleComplete}
              isCompleted={isCompleted}
          />
      );
  }

  const renderContentBlock = (block: ContentBlock, index: number) => {
    // Content protection logic...
    if (!isSubscriber) return null;
    
    // Switch case for different block types...
    switch (block.type) {
        // ... (rest of the render logic remains the same)
         case 'text':
            const html = block.content
              .replace(/(\$\$[\s\S]*?\$\$)/g, (match) => katex.renderToString(match.slice(2, -2), { displayMode: true, throwOnError: false }))
              .replace(/(\$.*?\$)/g, (match) => katex.renderToString(match.slice(1, -1), { throwOnError: false }));
            return <div key={index} className="prose prose-invert prose-lg max-w-none text-gray-300 leading-loose text-xl md:text-2xl mb-10" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn font-['Tajawal']" dir="rtl">
        {/* ... (rest of the JSX remains the same) */}
    </div>
  );
};

export default LessonViewer;