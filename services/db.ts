
// ... existing imports ...
import { supabase } from './supabase';
import {
  User, Curriculum, Quiz, Question, StudentQuizAttempt,
  AppNotification, Todo, TeacherMessage, Review,
  HomePageContent, Asset, ForumSection,
  ForumPost, ForumReply, LoggingSettings,
  NotificationSettings, PaymentSettings, Invoice, AIRecommendation,
  Unit, Lesson, LiveSession, EducationalResource, UserRole,
  AppBranding, InvoiceSettings, MaintenanceSettings,
  LessonScene, StudentLessonProgress, StudentInteractionEvent, LessonAnalyticsData,
  BrochureSettings, WeeklyReport
} from '../types';

class DBService {
  
  // --- 🛠 Helpers ---

  private mapProfileToUser(profile: any): User {
    if (!profile) return null as any;
    return {
        uid: profile.id,
        name: profile.name || 'مستخدم',
        email: profile.email,
        phone: profile.phone,
        gender: profile.gender,
        role: profile.role as UserRole,
        grade: profile.grade,
        subscription: profile.subscription_status === 'premium' ? 'premium' : 'free',
        status: 'active',
        createdAt: profile.created_at,
        photoURL: profile.photo_url,
        progress: profile.progress || { completedLessonIds: [], points: 0, achievements: [] },
        weeklyReports: [],
        specialization: profile.specialization,
        yearsExperience: profile.years_experience,
        bio: profile.bio,
        avatar: profile.avatar,
        gradesTaught: profile.grades_taught || [],
        permissions: profile.permissions || [],
        activityLog: profile.activity_log || {},
        lastSeen: profile.last_seen,
        jobTitle: profile.job_title
    };
  }

  // --- 👤 User Services ---

  async getUser(identifier: string): Promise<User | null> {
    try {
      let query = supabase.from('profiles').select('*');
      
      if (identifier.includes('@')) {
          query = query.eq('email', identifier);
      } else {
          query = query.eq('id', identifier);
      }
      
      const { data, error } = await query.single();
      
      if (error || !data) return null;
      return this.mapProfileToUser(data);
    } catch (e) {
      console.error("Supabase getUser failed:", e);
      return null;
    }
  }
  
  async saveUser(user: User): Promise<void> {
    try {
      const profileData = {
          id: user.uid,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          role: user.role,
          grade: user.grade,
          subscription_status: user.subscription,
          photo_url: user.photoURL,
          progress: user.progress,
          specialization: user.specialization,
          years_experience: user.yearsExperience,
          bio: user.bio,
          avatar: user.avatar,
          grades_taught: user.gradesTaught,
          permissions: user.permissions,
          job_title: user.jobTitle,
          last_seen: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').upsert(profileData);
      if (error) throw error;
    } catch (e) {
        console.error("Failed to save user:", e);
        throw e;
    }
  }
  
  subscribeToUser(uid: string, callback: (user: User | null) => void): () => void {
      const channel = supabase.channel(`public:profiles:id=eq.${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` }, (payload) => {
          if (payload.eventType === 'DELETE') {
              callback(null);
          } else {
              callback(this.mapProfileToUser(payload.new));
          }
      })
      .subscribe();

      this.getUser(uid).then(callback);

      return () => { supabase.removeChannel(channel); };
  }

  async getTeachers(): Promise<User[]> {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'teacher');
      return (data || []).map(this.mapProfileToUser);
  }
  
  async getAdmins(): Promise<User[]> {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'admin');
      return (data || []).map(this.mapProfileToUser);
  }

  async updateUserRole(uid: string, role: UserRole) {
      await supabase.from('profiles').update({ role }).eq('id', uid);
  }

  async deleteUser(uid: string) {
      await supabase.from('profiles').delete().eq('id', uid);
  }

  subscribeToUsers(callback: (users: User[]) => void, role: UserRole): () => void {
      this.getUsersByRole(role).then(callback);
      return () => {};
  }

  async getUsersByRole(role: string): Promise<User[]> {
      const { data } = await supabase.from('profiles').select('*').eq('role', role);
      return (data || []).map(this.mapProfileToUser);
  }

  // --- 📚 Curriculum, Units, Lessons ---

  async getCurriculum(): Promise<Curriculum[]> {
    try {
        const { data, error } = await supabase
            .from('curriculums')
            .select(`*, units (*, lessons (*))`)
            .order('created_at', { ascending: true });
            
        if (error) throw error;

        return data.map((c: any) => ({
            ...c,
            units: (c.units || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((u: any) => ({
                ...u,
                lessons: (u.lessons || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            }))
        }));
    } catch (e) {
        console.error("Failed to get curriculum:", e);
        return [];
    }
  }

  async createCurriculum(data: Partial<Curriculum>): Promise<Curriculum> {
      const { data: newCurr, error } = await supabase
          .from('curriculums')
          .insert([{ 
              grade: data.grade, 
              subject: data.subject, 
              title: data.title, 
              description: data.description, 
              icon: data.icon 
          }])
          .select()
          .single();
      
      if (error) throw error;
      return { ...newCurr, units: [] };
  }

  async getLesson(id: string): Promise<Lesson | null> {
     const { data, error } = await supabase.from('lessons').select('*').eq('id', id).single();
     if (error) return null;
     
     return {
         id: data.id,
         title: data.title,
         type: data.type,
         duration: data.duration,
         content: data.content,
         templateType: data.template_type,
         pathRootSceneId: data.path_root_scene_id,
         isPinned: data.is_pinned,
         universalConfig: data.universal_config
     } as Lesson;
  }
  
  async saveLesson(lesson: Lesson, unitId: string): Promise<Lesson> {
      const lessonData = {
          title: lesson.title,
          unit_id: unitId,
          type: lesson.type,
          duration: lesson.duration,
          content: lesson.content,
          template_type: lesson.templateType,
          universal_config: lesson.universalConfig,
          is_pinned: lesson.isPinned
      };

      let query;
      if (lesson.id && !lesson.id.startsWith('l_')) {
          query = supabase.from('lessons').update(lessonData).eq('id', lesson.id);
      } else {
          query = supabase.from('lessons').insert([lessonData]);
      }

      const { data, error } = await query.select().single();
      if (error) throw error;

      return { ...lesson, id: data.id };
  }

  async saveUnit(unit: Unit, curriculumId: string): Promise<Unit> {
      const unitData = {
          title: unit.title,
          description: unit.description,
          curriculum_id: curriculumId,
          order: unit.order || 0
      };

      let query;
      if (unit.id && !unit.id.startsWith('u_')) {
          query = supabase.from('units').update(unitData).eq('id', unit.id);
      } else {
          query = supabase.from('units').insert([unitData]);
      }

      const { data, error } = await query.select().single();
      if (error) throw error;
      return { ...unit, id: data.id, lessons: [] };
  }

  async deleteUnit(unitId: string) { await supabase.from('units').delete().eq('id', unitId); }
  async deleteLesson(lessonId: string) { await supabase.from('lessons').delete().eq('id', lessonId); }
  
  async updateUnitsOrderSupabase(units: Unit[]) {
      for (const [index, unit] of units.entries()) {
          await supabase.from('units').update({ order: index }).eq('id', unit.id);
      }
  }

  async updateLesson(lessonId: string, updates: Partial<Lesson>) {
      const sqlUpdates: any = {};
      if (updates.pathRootSceneId) sqlUpdates.path_root_scene_id = updates.pathRootSceneId;
      if (updates.title) sqlUpdates.title = updates.title;
      await supabase.from('lessons').update(sqlUpdates).eq('id', lessonId);
  }

  // --- ❓ Quizzes & Questions ---

  async getQuizzes(grade?: string): Promise<Quiz[]> {
      let query = supabase.from('quizzes').select('*');
      if (grade && grade !== 'all') query = query.eq('grade', grade);
      
      const { data } = await query;
      if (!data) return [];

      const quizIds = data.map(q => q.id);
      const { data: mappings } = await supabase.from('quiz_questions').select('*').in('quiz_id', quizIds);
      
      return data.map(q => ({
          id: q.id,
          title: q.title,
          description: q.description,
          grade: q.grade,
          subject: q.subject,
          category: q.category,
          duration: q.duration,
          isPremium: q.is_premium,
          maxAttempts: q.max_attempts,
          totalScore: 0,
          questionIds: mappings?.filter(m => m.quiz_id === q.id).map(m => m.question_id) || []
      }));
  }

  async getQuizWithQuestions(id: string): Promise<{ quiz: Quiz; questions: Question[] } | null> {
      const { data: quizData, error } = await supabase.from('quizzes').select('*').eq('id', id).single();
      if (error) return null;

      const { data: questionsData } = await supabase
          .from('questions')
          .select('*, quiz_questions!inner(quiz_id)')
          .eq('quiz_questions.quiz_id', id);

      const quiz: Quiz = {
          id: quizData.id,
          title: quizData.title,
          description: quizData.description,
          grade: quizData.grade,
          subject: quizData.subject,
          category: quizData.category,
          duration: quizData.duration,
          isPremium: quizData.is_premium,
          maxAttempts: quizData.max_attempts,
          totalScore: 0,
          questionIds: (questionsData || []).map(q => q.id)
      };

      const questions: Question[] = (questionsData || []).map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          choices: q.choices,
          correctChoiceId: q.correct_choice_id,
          score: q.score,
          difficulty: q.difficulty,
          solution: q.solution,
          imageUrl: q.image_url,
          grade: quiz.grade,
          subject: quiz.subject
      }));

      return { quiz, questions };
  }

  async saveQuiz(quiz: Quiz): Promise<Quiz> {
      const quizRow = {
          title: quiz.title,
          description: quiz.description,
          grade: quiz.grade,
          subject: quiz.subject,
          category: quiz.category,
          duration: quiz.duration,
          is_premium: quiz.isPremium,
          max_attempts: quiz.maxAttempts
      };

      let quizId = quiz.id;
      if (quiz.id.startsWith('quiz_')) {
          const { data } = await supabase.from('quizzes').insert([quizRow]).select().single();
          quizId = data.id;
      } else {
          await supabase.from('quizzes').update(quizRow).eq('id', quiz.id);
      }

      await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
      if (quiz.questionIds.length > 0) {
          const relations = quiz.questionIds.map(qId => ({ quiz_id: quizId, question_id: qId }));
          await supabase.from('quiz_questions').insert(relations);
      }

      return { ...quiz, id: quizId };
  }

  async deleteQuiz(id: string) { await supabase.from('quizzes').delete().eq('id', id); }

  async getAllQuestions(): Promise<Question[]> {
      const { data } = await supabase.from('questions').select('*');
      return (data || []).map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          choices: q.choices,
          correctChoiceId: q.correct_choice_id,
          score: q.score,
          difficulty: q.difficulty,
          solution: q.solution,
          imageUrl: q.image_url,
          grade: '12',
          subject: 'Physics'
      }));
  }

  async saveQuestion(question: Partial<Question>): Promise<Question> {
      const row = {
          text: question.text,
          type: question.type,
          choices: question.choices,
          correct_choice_id: question.correctChoiceId,
          score: question.score,
          difficulty: question.difficulty,
          solution: question.solution,
          image_url: question.imageUrl
      };

      let res;
      if (question.id && !question.id.startsWith('temp') && !question.id.startsWith('q_')) {
          res = await supabase.from('questions').update(row).eq('id', question.id).select().single();
      } else {
          res = await supabase.from('questions').insert([row]).select().single();
      }
      
      const q = res.data;
      return {
          id: q.id,
          text: q.text,
          type: q.type,
          choices: q.choices,
          correctChoiceId: q.correct_choice_id,
          score: q.score,
          difficulty: q.difficulty,
          solution: q.solution,
          imageUrl: q.image_url,
          grade: question.grade || '12',
          subject: question.subject || 'Physics'
      };
  }

  async deleteQuestion(id: string) { await supabase.from('questions').delete().eq('id', id); }

  // --- 📝 Attempts ---

  async getUserAttempts(uid: string, quizId?: string): Promise<StudentQuizAttempt[]> {
      let query = supabase.from('student_quiz_attempts').select('*').eq('student_id', uid);
      if (quizId) query = query.eq('quiz_id', quizId);
      
      const { data } = await query.order('completed_at', { ascending: false });
      return (data || []).map(this.mapAttempt);
  }

  async getAttemptsForQuiz(quizId: string): Promise<StudentQuizAttempt[]> {
      const { data } = await supabase
        .from('student_quiz_attempts')
        .select(`*, profiles (name)`)
        .eq('quiz_id', quizId)
        .order('completed_at', { ascending: false });

      return (data || []).map(row => ({
          ...this.mapAttempt(row),
          studentName: row.profiles?.name || 'Unknown'
      }));
  }

  async getAttemptById(id: string): Promise<StudentQuizAttempt | null> {
      const { data } = await supabase.from('student_quiz_attempts').select('*').eq('id', id).single();
      if (!data) return null;
      return this.mapAttempt(data);
  }

  async saveAttempt(attempt: StudentQuizAttempt): Promise<StudentQuizAttempt> {
      const row = {
          student_id: attempt.studentId,
          quiz_id: attempt.quizId,
          score: attempt.score,
          max_score: attempt.maxScore,
          answers: attempt.answers,
          time_spent: attempt.timeSpent,
          status: attempt.status,
          completed_at: attempt.completedAt
      };
      
      const { data, error } = await supabase.from('student_quiz_attempts').insert([row]).select().single();
      if (error) throw error;
      return this.mapAttempt(data);
  }

  async updateAttempt(attemptId: string, updates: Partial<StudentQuizAttempt>) {
      const row: any = {};
      if (updates.score !== undefined) row.score = updates.score;
      if (updates.status !== undefined) row.status = updates.status;
      if (updates.manualGrades !== undefined) row.manual_grades = updates.manualGrades;
      
      await supabase.from('student_quiz_attempts').update(row).eq('id', attemptId);
  }

  private mapAttempt(row: any): StudentQuizAttempt {
      return {
          id: row.id,
          studentId: row.student_id,
          studentName: '',
          quizId: row.quiz_id,
          score: row.score,
          maxScore: row.max_score,
          totalQuestions: 0,
          completedAt: row.completed_at,
          answers: row.answers,
          timeSpent: row.time_spent,
          attemptNumber: 0,
          status: row.status,
          manualGrades: row.manual_grades
      };
  }

  // --- 📦 Assets ---

  async uploadAsset(file: File): Promise<Asset> {
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { data, error } = await supabase.storage.from('assets').upload(fileName, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(fileName);
      
      return {
          name: fileName,
          url: urlData.publicUrl,
          type: file.type,
          size: file.size
      };
  }

  async listAssets(): Promise<Asset[]> {
      const { data, error } = await supabase.storage.from('assets').list();
      if (error) return [];
      
      return data.map(f => {
          const { data: urlData } = supabase.storage.from('assets').getPublicUrl(f.name);
          return {
              name: f.name,
              url: urlData.publicUrl,
              type: f.metadata?.mimetype || 'unknown',
              size: f.metadata?.size || 0
          };
      });
  }

  async deleteAsset(name: string) {
      await supabase.storage.from('assets').remove([name]);
  }

  // --- 🎥 Live Sessions ---

  async getLiveSessions(): Promise<LiveSession[]> {
      const { data, error } = await supabase.from('live_sessions').select('*');
      if (error) return [];
      
      return data.map(s => ({
          id: s.id,
          title: s.title,
          teacherName: s.teacher_name,
          startTime: s.start_time,
          status: s.status,
          topic: s.topic,
          platform: s.platform,
          streamUrl: s.stream_url,
          meetingId: s.meeting_id,
          passcode: s.passcode,
          targetGrades: s.target_grades,
          isPremium: s.is_premium
      }));
  }

  subscribeToLiveSessions(callback: (sessions: LiveSession[]) => void): () => void {
      this.getLiveSessions().then(callback);
      const channel = supabase.channel('public:live_sessions')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => {
              this.getLiveSessions().then(callback);
          })
          .subscribe();
      return () => { supabase.removeChannel(channel); };
  }

  async saveLiveSession(session: Partial<LiveSession>) {
      const row = {
          title: session.title,
          teacher_name: session.teacherName,
          start_time: session.startTime,
          status: session.status,
          topic: session.topic,
          platform: session.platform,
          stream_url: session.streamUrl,
          meeting_id: session.meetingId,
          passcode: session.passcode,
          target_grades: session.targetGrades,
          is_premium: session.isPremium
      };
      
      if (session.id) {
          await supabase.from('live_sessions').update(row).eq('id', session.id);
      } else {
          await supabase.from('live_sessions').insert([row]);
      }
  }

  async deleteLiveSession(id: string) { await supabase.from('live_sessions').delete().eq('id', id); }

  // --- 🧩 Interactive Lessons ---

  async getLessonScenesForBuilder(lessonId: string): Promise<LessonScene[]> {
      const { data } = await supabase.from('lesson_scenes').select('*').eq('lesson_id', lessonId);
      return (data || []).map(s => ({
          id: s.id,
          lesson_id: s.lesson_id,
          title: s.title,
          content: s.content,
          decisions: s.decisions,
          is_premium: s.is_premium
      }));
  }

  async saveLessonScene(scene: LessonScene): Promise<LessonScene> {
      const row = {
          lesson_id: scene.lesson_id,
          title: scene.title,
          content: scene.content,
          decisions: scene.decisions,
          is_premium: scene.is_premium
      };
      
      let res;
      if (scene.id && !scene.id.startsWith('scene_')) {
          res = await supabase.from('lesson_scenes').update(row).eq('id', scene.id).select().single();
      } else {
          res = await supabase.from('lesson_scenes').insert([row]).select().single();
      }
      return { ...scene, id: res.data.id };
  }

  async deleteLessonScene(id: string) { await supabase.from('lesson_scenes').delete().eq('id', id); }
  
  async getLessonScene(id: string): Promise<LessonScene | null> {
      const { data } = await supabase.from('lesson_scenes').select('*').eq('id', id).single();
      if (!data) return null;
      return {
          id: data.id,
          lesson_id: data.lesson_id,
          title: data.title,
          content: data.content,
          decisions: data.decisions,
          is_premium: data.is_premium
      };
  }

  async saveStudentLessonProgress(progress: Partial<StudentLessonProgress>) {
      const row = {
          student_id: progress.student_id,
          lesson_id: progress.lesson_id,
          current_scene_id: progress.current_scene_id,
          answers: progress.answers,
          uploaded_files: progress.uploaded_files,
          updated_at: new Date().toISOString()
      };
      await supabase.from('student_lesson_progress').upsert(row, { onConflict: 'student_id,lesson_id' });
  }

  async logStudentInteraction(event: StudentInteractionEvent) {
      const row = {
          student_id: event.student_id,
          lesson_id: event.lesson_id,
          from_scene_id: event.from_scene_id,
          to_scene_id: event.to_scene_id,
          decision_text: event.decision_text,
      };
      await supabase.from('student_interaction_events').insert([row]);
  }

  subscribeToLessonInteractions(lessonId: string, callback: (payload: any) => void) {
      const channel = supabase.channel('realtime_interactions')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_interaction_events', filter: `lesson_id=eq.${lessonId}` }, (payload) => {
              callback(payload.new);
          })
          .subscribe();
      return { unsubscribe: () => supabase.removeChannel(channel) };
  }

  async getLessonAnalytics(lessonId: string): Promise<LessonAnalyticsData> {
      const { data } = await supabase.from('student_interaction_events').select('*').eq('lesson_id', lessonId);
      
      const events = (data || []).map(e => ({ ...e, id: e.id.toString() } as StudentInteractionEvent));
      
      const sceneVisits: Record<string, number> = {};
      const decisionCounts: Record<string, number> = {};
      let aiRequests = 0;

      events.forEach(e => {
          if (e.to_scene_id) sceneVisits[e.to_scene_id] = (sceneVisits[e.to_scene_id] || 0) + 1;
          if (e.from_scene_id && e.decision_text) {
              const key = `${e.from_scene_id}__${e.decision_text}__${e.to_scene_id}`;
              decisionCounts[key] = (decisionCounts[key] || 0) + 1;
          }
          if (e.event_type === 'ai_help_requested') aiRequests++;
      });

      return {
          scene_visits: Object.entries(sceneVisits).map(([id, count]) => ({ scene_id: id, title: id.substring(0,8), visit_count: count })),
          decision_counts: Object.entries(decisionCounts).map(([key, count]) => {
              const [from, text, to] = key.split('__');
              return { from_scene_id: from, decision_text: text, to_scene_id: to, choice_count: count };
          }),
          live_events: events.slice(0, 50) as any,
          ai_help_requests: aiRequests
      };
  }

  // --- 🛠 Generic Settings ---
  
  async getSetting(key: string): Promise<any> {
      const { data } = await supabase.from('settings').select('value').eq('key', key).single();
      return data?.value || null;
  }
  
  async saveSetting(key: string, value: any) {
      await supabase.from('settings').upsert({ key, value });
  }

  async getLoggingSettings() { return (await this.getSetting('logging')) || {} as LoggingSettings; }
  async saveLoggingSettings(s: LoggingSettings) { await this.saveSetting('logging', s); }
  
  async getNotificationSettings() { return (await this.getSetting('notifications')) || {} as NotificationSettings; }
  async saveNotificationSettings(s: NotificationSettings) { await this.saveSetting('notifications', s); }
  
  // Updated to provide a robust default by merging
  async getBrochureSettings() { 
      const settings = await this.getSetting('brochure') || {};
      const defaults: BrochureSettings = {
            heroTitle: 'الفيزياء <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">الحديثة</span>',
            heroSubtitle: 'منصة تعليمية متطورة تدمج الذكاء الاصطناعي مع المنهج الكويتي.',
            section1Title: 'مميزات ذكية',
            section1Features: [
                { id: 'f1', icon: 'BrainCircuit', title: 'مساعد ذكي', description: 'إجابات دقيقة', color: 'cyan' },
                { id: 'f2', icon: 'Waypoints', title: 'مسارات تفاعلية', description: 'تعلم مخصص', color: 'amber' }
            ],
            section2Title: 'تحليلات الأداء',
            section2Features: [
                { id: 'f3', icon: 'BarChart3', title: 'تقارير مفصلة', description: 'تابع تقدمك', color: 'cyan' },
                { id: 'f4', icon: 'Star', title: 'نقاط وجوائز', description: 'نظام تحفيزي', color: 'amber' }
            ],
            section3Title: 'أمان وموثوقية',
            section3Features: [
                { id: 'f5', icon: 'Lock', title: 'حماية البيانات', description: 'أمان عالي', color: 'cyan' },
                { id: 'f6', icon: 'Sparkles', title: 'محتوى معتمد', description: 'جودة عالية', color: 'amber' }
            ],
            ctaTitle: 'ابدأ الآن',
            ctaSubtitle: 'انضم للنخبة',
            ctaButtonText: 'تسجيل دخول'
      };
      // Merge defaults with fetched settings to ensure all fields exist
      return { ...defaults, ...settings } as BrochureSettings;
  }
  async saveBrochureSettings(s: BrochureSettings) { await this.saveSetting('brochure', s); }
  
  async getMaintenanceSettings() { return (await this.getSetting('maintenance')) || {} as MaintenanceSettings; }
  async saveMaintenanceSettings(s: MaintenanceSettings) { await this.saveSetting('maintenance', s); }
  
  subscribeToMaintenance(callback: (s: MaintenanceSettings | null) => void) {
      this.getMaintenanceSettings().then(callback);
      return () => {};
  }

  async getPaymentSettings() { return (await this.getSetting('payment')) || {} as PaymentSettings; }
  async savePaymentSettings(s: PaymentSettings) { await this.saveSetting('payment', s); }
  
  async getInvoiceSettings() { return (await this.getSetting('invoice')) || {} as InvoiceSettings; }
  async saveInvoiceSettings(s: InvoiceSettings) { await this.saveSetting('invoice', s); }
  
  async getAppBranding() { return (await this.getSetting('branding')) || {} as AppBranding; }
  async saveAppBranding(b: AppBranding) { await this.saveSetting('branding', b); }

  async getHomePageContent(): Promise<HomePageContent[]> {
      const { data } = await supabase.from('home_page_content').select('*').order('created_at', { ascending: false });
      return (data || []).map(c => ({
          id: c.id,
          type: c.type,
          placement: c.placement,
          priority: c.priority,
          title: c.title,
          content: c.content,
          imageUrl: c.image_url,
          ctaText: c.cta_text,
          ctaLink: c.cta_link,
          createdAt: c.created_at
      }));
  }

  async saveHomePageContent(c: Partial<HomePageContent>) {
      const row = {
          type: c.type,
          placement: c.placement,
          priority: c.priority,
          title: c.title,
          content: c.content,
          image_url: c.imageUrl,
          cta_text: c.ctaText,
          cta_link: c.ctaLink
      };
      
      if (c.id) {
          await supabase.from('home_page_content').update(row).eq('id', c.id);
      } else {
          await supabase.from('home_page_content').insert([row]);
      }
  }
  
  async deleteHomePageContent(id: string) { await supabase.from('home_page_content').delete().eq('id', id); }

  // --- 💸 Invoices ---
  
  async getInvoices() {
      const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      return { data: (data || []).map(this.mapInvoice) };
  }
  
  subscribeToInvoices(uid: string, callback: (invoices: Invoice[]) => void) {
      this.getUserInvoices(uid).then(callback);
      return () => {};
  }
  
  async getUserInvoices(uid: string) {
      const { data } = await supabase.from('invoices').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      return (data || []).map(this.mapInvoice);
  }
  
  async createManualInvoice(userId: string, planId: string, amount: number): Promise<Invoice> {
      const user = await this.getUser(userId);
      const row = {
          user_id: userId,
          user_name: user?.name || 'Unknown',
          plan_id: planId,
          amount,
          date: new Date().toISOString(),
          status: 'PAID',
          track_id: `MANUAL_${Date.now()}`,
          auth_code: 'ADMIN_ENTRY'
      };
      
      const { data, error } = await supabase.from('invoices').insert([row]).select().single();
      if (error) throw error;
      
      await this.updateUserRole(userId, user?.role || 'student');
      await supabase.from('profiles').update({ subscription_status: 'premium' }).eq('id', userId);

      return this.mapInvoice(data);
  }
  
  async deleteInvoice(id: string) { await supabase.from('invoices').delete().eq('id', id); }
  
  private mapInvoice(row: any): Invoice {
      return {
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          planId: row.plan_id,
          amount: row.amount,
          date: row.date || row.created_at,
          status: row.status,
          trackId: row.track_id,
          authCode: row.auth_code,
          paymentId: row.payment_id
      };
  }
  
  async updateStudentSubscription(uid: string, tier: 'free' | 'premium', amount: number) {
      await supabase.from('profiles').update({ subscription_status: tier }).eq('id', uid);
      await this.createManualInvoice(uid, tier === 'premium' ? 'plan_premium' : 'plan_basic', amount);
  }

  // --- 💬 Forum ---
  
  async getForumSections(): Promise<ForumSection[]> {
      const { data } = await supabase.from('forum_sections').select('*, forums(*)').order('order', { ascending: true });
      return (data || []).map(s => ({
          id: s.id,
          title: s.title,
          description: s.description,
          order: s.order,
          forums: (s.forums || []).map((f: any) => ({
              id: f.id,
              title: f.title,
              description: f.description,
              icon: f.icon,
              imageUrl: f.image_url,
              order: f.order,
              moderatorUid: f.moderator_uid,
              moderatorName: f.moderator_name
          }))
      }));
  }
  
  async saveForumSections(sections: ForumSection[]) {
      for (const section of sections) {
          const { data: s } = await supabase.from('forum_sections').upsert({
              id: section.id.startsWith('sec_') ? undefined : section.id,
              title: section.title,
              description: section.description,
              order: section.order
          }).select().single();
          
          if (s && section.forums) {
              for (const forum of section.forums) {
                  await supabase.from('forums').upsert({
                      id: forum.id.startsWith('forum_') ? undefined : forum.id,
                      section_id: s.id,
                      title: forum.title,
                      description: forum.description,
                      icon: forum.icon,
                      image_url: forum.imageUrl,
                      order: forum.order,
                      moderator_uid: forum.moderatorUid,
                      moderator_name: forum.moderatorName
                  });
              }
          }
      }
  }
  
  async getForumPosts(forumId?: string): Promise<ForumPost[]> {
      let query = supabase.from('forum_posts').select('*');
      if (forumId) query = query.contains('tags', [forumId]);
      
      const { data } = await query.order('created_at', { ascending: false });
      return (data || []).map(p => ({
          id: p.id,
          authorUid: p.author_uid,
          authorName: p.author_name,
          authorEmail: p.author_email,
          title: p.title,
          content: p.content,
          tags: p.tags || [],
          upvotes: p.upvotes,
          replies: p.replies || [],
          timestamp: p.created_at,
          isPinned: p.is_pinned,
          isEscalated: p.is_escalated
      }));
  }
  
  async createForumPost(post: Omit<ForumPost, 'id'>) {
      await supabase.from('forum_posts').insert([{
          author_uid: post.authorUid,
          author_name: post.authorName,
          author_email: post.authorEmail,
          title: post.title,
          content: post.content,
          tags: post.tags,
          upvotes: 0,
          is_pinned: false,
          is_escalated: false
      }]);
  }
  
  async addForumReply(postId: string, reply: any) {
      const newReply = { ...reply, id: `rep_${Date.now()}`, timestamp: new Date().toISOString() };
      const { data } = await supabase.from('forum_posts').select('replies').eq('id', postId).single();
      const replies = data?.replies || [];
      replies.push(newReply);
      await supabase.from('forum_posts').update({ replies }).eq('id', postId);
  }
  
  async updateForumPost(id: string, updates: any) {
      const row: any = {};
      if (updates.isPinned !== undefined) row.is_pinned = updates.isPinned;
      if (updates.isEscalated !== undefined) row.is_escalated = updates.isEscalated;
      await supabase.from('forum_posts').update(row).eq('id', id);
  }
  
  async deleteForumPost(id: string) { await supabase.from('forum_posts').delete().eq('id', id); }

  async initializeForumSystem() {
      // Placeholder for future initialization logic
  }

  // --- Notifications ---
  
  subscribeToNotifications(uid: string, callback: (n: AppNotification[]) => void) {
      const channel = supabase.channel(`notifications:${uid}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, () => {
              this.getNotifications(uid).then(callback);
          })
          .subscribe();
      this.getNotifications(uid).then(callback);
      return () => { supabase.removeChannel(channel); };
  }
  
  async getNotifications(uid: string): Promise<AppNotification[]> {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20);
      return (data || []).map(n => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          timestamp: n.created_at,
          isRead: n.is_read,
          type: n.type,
          category: n.category
      }));
  }
  
  async createNotification(n: any) {
      await supabase.from('notifications').insert([{
          user_id: n.userId,
          title: n.title,
          message: n.message,
          is_read: false,
          type: n.type,
          category: n.category
      }]);
  }
  
  async markNotificationsAsRead(uid: string) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', uid);
  }

  // --- Misc Stubs ---
  async getResources() { return []; }
  async getExperiments(grade?: string) { 
      let q = supabase.from('experiments').select('*');
      if (grade) q = q.eq('grade', grade);
      const { data } = await q;
      return (data || []).map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          thumbnail: e.thumbnail,
          grade: e.grade,
          type: e.type,
          customHtml: e.custom_html,
          isFutureLab: e.is_future_lab,
          parameters: e.parameters || []
      }));
  }
  async saveExperiment(e: any) {
      const row = {
          title: e.title,
          description: e.description,
          thumbnail: e.thumbnail,
          grade: e.grade,
          type: e.type,
          custom_html: e.customHtml,
          is_future_lab: e.isFutureLab
      };
      if (e.id) await supabase.from('experiments').update(row).eq('id', e.id);
      else await supabase.from('experiments').insert([row]);
  }
  async deleteExperiment(id: string) { await supabase.from('experiments').delete().eq('id', id); }
  
  async getEquations() { return []; }
  async getArticles() { return []; }
  async getStudyGroups() { return []; }
  async getTeacherReviews(tid: string): Promise<Review[]> { return []; }
  async addReview(r: Review) {}
  
  async getAllTeacherMessages(tid: string): Promise<TeacherMessage[]> { return []; }
  async saveTeacherMessage(m: TeacherMessage) {}
  
  async getTodos(uid: string): Promise<Todo[]> { return []; }
  async saveTodo(uid: string, todo: any) { return 'todo_id'; }
  async updateTodo(uid: string, id: string, u: any) {}
  async deleteTodo(uid: string, id: string) {}
  
  async getAIRecommendations(user: any): Promise<AIRecommendation[]> { return []; }
  async saveRecommendation(r: any) {}
  async deleteRecommendation(id: string) {}
  
  async checkConnection() {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      return { alive: !error, error: error?.message };
  }
  
  async toggleLessonComplete(uid: string, lessonId: string) {
      const user = await this.getUser(uid);
      if (!user) return;
      
      const completed = new Set(user.progress.completedLessonIds);
      if (completed.has(lessonId)) {
          completed.delete(lessonId);
          user.progress.points -= 10;
      } else {
          completed.add(lessonId);
          user.progress.points += 10;
      }
      user.progress.completedLessonIds = Array.from(completed);
      await this.saveUser(user);
  }
  
  async getGlobalStats() {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return { totalStudents: count || 0, totalTeachers: 0 };
  }
  
  subscribeToGlobalStats(cb: any) { return () => {}; }
  
  async getStudentProgressForParent(uid: string) {
      const u = await this.getUser(uid);
      return { user: u, report: null };
  }
  
  async getAdvancedFinancialStats() {
      const { data } = await supabase.from('invoices').select('amount, status, created_at');
      let total = 0;
      (data || []).forEach((i: any) => { if (i.status === 'PAID') total += i.amount; });
      return { daily: 0, monthly: 0, yearly: 0, total, pending: 0 };
  }
}

export const dbService = new DBService();
