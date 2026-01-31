
import { Curriculum, Quiz, Question, SubscriptionPlan, EducationalResource, Article, StudyGroup, PhysicsExperiment, PhysicsEquation } from './types';

// كافة البيانات تم نقلها لقاعدة البيانات Firestore
// المدير لديه التحكم الكامل من لوحة الإدارة
export const CURRICULUM_DATA: Curriculum[] = [];
export const PHYSICS_TOPICS = CURRICULUM_DATA;
export const ANSWERS_DB: any[] = [];
export const QUESTIONS_DB: Question[] = [];
export const QUIZZES_DB: Quiz[] = [];
export const MOCK_RESOURCES: EducationalResource[] = [];
export const MOCK_ARTICLES: Article[] = [];
export const MOCK_STUDY_GROUPS: StudyGroup[] = [];
export const INITIAL_EXPERIMENTS: PhysicsExperiment[] = [];
export const MOCK_EQUATIONS: PhysicsEquation[] = [];

// الباقات تُجلب الآن عبر dbService.getSubscriptionPlans()
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [];
export const PRICING_PLANS = SUBSCRIPTION_PLANS;
