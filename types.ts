export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';

export type ViewState = 
  | 'landing' | 'auth' | 'dashboard' | 'curriculum' | 'quiz_center' 
  | 'discussions' | 'subscription' | 'lesson' | 'quiz_player' 
  | 'privacy-policy' | 'ai-chat' | 'recommendations' | 'virtual-lab' 
  | 'live-sessions' | 'reports' | 'help-center' | 'admin-curriculum' 
  | 'admin-students' | 'admin-teachers' | 'admin-financials' 
  | 'quiz-performance' | 'admin-settings' | 'journey-map' 
  | 'payment-certificate' | 'admin-live-sessions' | 'admin-quizzes' 
  | 'attempt_review' | 'admin-content' | 'admin-assets' | 'admin-parents' 
  | 'admin-videos' | 'admin-quiz-attempts' | 'admin-certificates' 
  | 'admin-reviews' | 'admin-pricing' | 'admin-subscriptions' 
  | 'admin-payments-log' | 'admin-payment-settings' | 'admin-email-notifications' 
  | 'admin-internal-messages' | 'admin-forums' | 'admin-forum-posts' 
  | 'admin-security-fix' | 'verify-certificate' | 'resources-center' 
  | 'admin-managers' | 'admin-payment-manager' | 'admin-labs' 
  | 'admin-recommendations' | 'template-demo' | 'lesson-builder'
  | 'admin-brochure';

export type SubjectType = 'Physics' | 'Chemistry' | 'Math' | 'English';
export type BranchType = 'Scientific' | 'Literary';
export type QuestionType = 'mcq' | 'short_answer' | 'essay' | 'file_upload';
export type ContentBlockType = 'text' | 'image' | 'video' | 'youtube' | 'pdf' | 'audio' | 'html';
export type ContentPlacement = 'TOP_BANNER' | 'GRID_CARD' | 'SIDEBAR_WIDGET' | 'MODAL_POPUP';
export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED';
export type TeacherPermission = 'create_content' | 'reply_messages' | 'view_analytics' | 'manage_exams';

export interface MaintenanceSettings {
    isMaintenanceActive: boolean;
    expectedReturnTime?: string;
    maintenanceMessage?: string;
    showCountdown?: boolean;
    allowTeachers?: boolean;
}

export interface AppBranding {
    appName: string;
    logoUrl: string;
}

export interface User {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    gender?: 'male' | 'female';
    role: UserRole;
    grade: '10' | '11' | '12' | 'uni';
    subscription: 'free' | 'premium';
    status?: 'active' | 'suspended';
    createdAt: string;
    progress: {
        completedLessonIds: string[];
        points: number;
        achievements: string[];
        lastActivity?: string;
    };
    photoURL?: string;
    weeklyReports?: WeeklyReport[];
    linkedStudentUids?: string[]; // For parents
    specialization?: string; // For teachers
    yearsExperience?: number; // For teachers
    bio?: string; // For teachers
    avatar?: string; // For teachers
    gradesTaught?: string[]; // For teachers
    permissions?: TeacherPermission[]; // For teachers
    activityLog?: Record<string, number>; // date: minutes
    lastSeen?: string;
    jobTitle?: string;
}

export interface WeeklyReport {
    week: string;
    completedUnits: number;
    hoursSpent: number;
    scoreAverage: number;
    improvementAreas: string[];
    parentNote?: string;
}

export interface Curriculum {
    id: string;
    grade: string;
    subject: string;
    title: string;
    description: string;
    icon: string;
    units: Unit[];
}

export interface Unit {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
    order?: number;
}

export interface Lesson {
    id: string;
    title: string;
    type: string; // THEORY, EXAMPLE, EXERCISE
    duration: string;
    content?: ContentBlock[];
    templateType?: 'STANDARD' | 'UNIVERSAL' | 'PATH'; // New type for branching lessons
    pathRootSceneId?: string; // ID of the first scene
    isPinned?: boolean; // New property for highlighting lessons
    universalConfig?: UniversalLessonConfig;
    aiGeneratedData?: AILessonSchema;
}

export interface ContentBlock {
    type: ContentBlockType;
    content: string;
    caption?: string;
    linked_concept?: string;
    block_id?: string;
    locked_after_approval?: boolean;
    ui_component?: any;
}

export interface UniversalLessonConfig {
    objectives: string[];
    introduction: string;
    mainEquation: string;
    variables: {
        id: string;
        symbol: string;
        name: string;
        unit: string;
        defaultValue: number;
        min: number;
        max: number;
        step: number;
    }[];
    calculationFormula: string;
    resultUnit: string;
    interactiveQuiz?: {
        question: string;
        options: string[];
        correctIndex: number;
    };
    graphConfig?: {
        xAxisVariableId: string;
        yAxisLabel: string;
        chartType: 'line' | 'bar' | 'area';
        lineColor: string;
    };
}

export interface AILessonSchema {
    lesson_metadata: {
        grade: string;
        subject: string;
        lesson_title: string;
        unit: string;
        status: string;
        version: number;
    };
    learning_objectives: string[];
    content_blocks: {
        block_id: string;
        block_type: string;
        locked_after_approval: boolean;
        linked_concept: string;
        ui_component: {
            component_category: string;
            react_component: string;
        };
        textContent: string;
    }[];
    formulae: {
        formula_text: string;
        variables: string[];
    }[];
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    grade: string;
    subject: string;
    category: string;
    questionIds: string[];
    duration: number; // minutes
    totalScore: number;
    isPremium: boolean;
    maxAttempts?: number;
}

export interface Question {
    id: string;
    text: string;
    type: QuestionType;
    choices?: { id: string; text: string; key?: string }[];
    correctChoiceId?: string; 
    score: number;
    grade: string;
    subject: string;
    unit?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    category?: string;
    solution?: string;
    modelAnswer?: string;
    imageUrl?: string;
    branch?: BranchType;
    isVerified?: boolean;
    steps_array?: string[];
    common_errors?: string[];
    question_latex?: string;
    hasDiagram?: boolean;
    answers?: any[];
    correct_answer?: string;
}

export interface StudentQuizAttempt {
    id: string;
    studentId: string;
    studentName: string;
    quizId: string;
    score: number;
    totalQuestions: number;
    maxScore: number;
    completedAt: string;
    answers: Record<string, any>;
    timeSpent: number;
    attemptNumber: number;
    status: 'pending-review' | 'manually-graded' | 'completed';
    manualGrades?: Record<string, { awardedScore: number; feedback?: string }>;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    features: string[];
}

export interface EducationalResource {
    id: string;
    title: string;
    type: 'summary' | 'exam' | 'worksheet' | 'book';
    grade: string;
    year: string;
    term: string;
    size: string;
    url: string;
    downloadCount: number;
}

export interface Article {
    id: string;
    title: string;
    summary: string;
    content: string;
    imageUrl: string;
    category: string;
    readTime: string;
    author: string;
    date: string;
}

export interface StudyGroup {
    id: string;
    name: string;
    level: string;
    membersCount: number;
    activeChallenge: string;
}

export interface PhysicsExperiment {
    id: string;
    title: string;
    description: string;
    thumbnail?: string;
    grade: string;
    type: 'CUSTOM_HTML' | 'PHET';
    customHtml?: string;
    isFutureLab?: boolean;
    parameters: {
        id: string;
        name: string;
        min: number;
        max: number;
        step: number;
        defaultValue: number;
        unit: string;
    }[];
}

export interface SavedExperiment {
    id: string;
    experimentId: string;
    experimentTitle: string;
    timestamp: string;
    params: Record<string, number>;
    result: number;
}

export interface PhysicsEquation {
    id: string;
    title: string;
    latex: string;
    category: string;
    variables: Record<string, string>; 
    solveFor?: string;
}

export interface AISolverResult {
    law: string;
    steps: string[];
    finalResult: string;
    explanation: string;
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    thinking?: string | null;
}

export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'academic' | 'general' | 'system';
}

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    category: 'Study' | 'Homework' | 'Exam' | 'Lab' | 'Review';
    createdAt: number;
    dueDate?: string;
}

export interface TeacherMessage {
    id: string;
    studentId: string;
    studentName: string;
    teacherId: string;
    teacherName: string;
    content: string;
    timestamp: string;
    isRedacted: boolean;
}

export interface Review {
    id: string;
    teacherId: string;
    studentName: string;
    rating: number;
    comment: string;
    timestamp: string;
}

export interface HomePageContent {
    id: string;
    type: 'news' | 'announcement' | 'alert' | 'image' | 'carousel';
    placement: ContentPlacement;
    priority: 'normal' | 'high';
    title: string;
    content: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    createdAt: string;
}

export interface Asset {
    name: string;
    url: string;
    type: string;
    size: number;
}

export interface SubscriptionCode {
    code: string;
    type: 'premium' | 'basic';
    isUsed: boolean;
    usedBy?: string;
}

export interface ForumSection {
    id: string;
    title: string;
    description: string;
    order: number;
    forums: Forum[];
}

export interface Forum {
    id: string;
    title: string;
    description: string;
    icon: string;
    imageUrl?: string;
    order: number;
    moderatorUid?: string;
    moderatorName?: string;
}

export interface ForumPost {
    id: string;
    authorUid: string;
    authorName: string;
    authorEmail: string;
    title: string;
    content: string;
    tags: string[];
    upvotes: number;
    replies: ForumReply[];
    timestamp: string;
    isPinned: boolean;
    isEscalated: boolean;
}

export interface ForumReply {
    id: string;
    authorUid: string;
    authorName: string;
    authorEmail: string;
    content: string;
    timestamp: string;
    upvotes: number;
    role?: UserRole;
}

export interface LoggingSettings {
    logStudentProgress: boolean;
    saveAllQuizAttempts: boolean;
    logAIChatHistory: boolean;
    archiveTeacherMessages: boolean;
    forumAccessTier: 'free' | 'premium';
}

export interface NotificationSettings {
    pushForLiveSessions: boolean;
    pushForGradedQuizzes: boolean;
    pushForAdminAlerts: boolean;
}

export interface PaymentSettings {
    isOnlinePaymentEnabled: boolean;
    womdaPhoneNumber: string;
    planPrices: {
        premium: number;
        basic: number;
    };
}

export interface InvoiceSettings {
    headerText: string;
    footerText: string;
    accentColor: string;
    showSignature: boolean;
    signatureName: string;
    showWatermark: boolean;
    watermarkText: string;
}

export interface Invoice {
    id: string;
    userId: string;
    userName: string;
    planId: string;
    amount: number;
    date: string;
    status: PaymentStatus;
    trackId: string;
    authCode: string;
    paymentId?: string;
}

export interface AIRecommendation {
    id: string;
    title: string;
    reason: string;
    type: 'lesson' | 'quiz' | 'challenge' | 'discussion';
    urgency: 'high' | 'medium' | 'low';
    targetGrade: string;
    targetUserEmail?: string;
    targetId: string; 
    createdAt: string;
}

export interface LiveSession {
    id: string;
    title: string;
    teacherName: string;
    startTime: string;
    status: 'upcoming' | 'live' | 'ended';
    topic: string;
    platform: 'zoom' | 'youtube' | 'other';
    streamUrl: string;
    meetingId?: string;
    passcode?: string;
    targetGrades?: string[];
    isPremium?: boolean;
}

export interface PredictiveInsight {
    topicId: string;
    topicTitle: string;
    probabilityOfDifficulty: number;
    reasoning: string;
    suggestedPrep: string;
}

// --- NEW TYPES FOR INTERACTIVE LESSON PATH ---

export interface LessonScene {
  id: string;
  lesson_id: string;
  title: string;
  content: { // Simple content structure for now
      text: string;
      imageUrl?: string;
      videoUrl?: string;
      requiresUpload?: boolean;
  };
  decisions: {
      text: string; // Button text
      next_scene_id: string; // ID of the next scene
      is_correct?: boolean;
      remedial_scene_id?: string | null;
      advanced_scene_id?: string | null;
  }[];
  is_premium: boolean;
}

export interface StudentLessonProgress {
    id?: string;
    student_id: string;
    lesson_id: string;
    current_scene_id: string;
    answers: Record<string, string>; // sceneId: decisionText
    uploaded_files: Record<string, Asset>; // sceneId: Asset
    updated_at: string;
}

// --- NEW TYPES FOR ANALYTICS ---

export interface StudentInteractionEvent {
    id?: string;
    student_id: string;
    lesson_id: string;
    from_scene_id: string;
    to_scene_id: string;
    decision_text: string;
    created_at?: string;
    is_correct?: boolean;
    event_type?: 'navigation' | 'suggestion_shown' | 'suggestion_accepted' | 'suggestion_skipped' | 'ai_help_requested';
}

export interface LessonAnalyticsData {
    scene_visits: { scene_id: string; title: string; visit_count: number }[];
    decision_counts: { from_scene_id: string; decision_text: string; to_scene_id: string; choice_count: number }[];
    live_events: (StudentInteractionEvent & { student_name: string })[];
    ai_help_requests?: number;
}

// --- NEW TYPES FOR MARKETING BROCHURE ---

export interface BrochureFeature {
  id: string;
  icon: string; // e.g., 'Waypoints', 'BrainCircuit'
  title: string;
  description: string;
  color: 'amber' | 'cyan';
}

export interface BrochureSettings {
  heroTitle: string;
  heroSubtitle: string;
  section1Title: string;
  section1Features: BrochureFeature[];
  section2Title: string;
  section2Features: BrochureFeature[];
  section3Title: string;
  section3Features: BrochureFeature[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
}
