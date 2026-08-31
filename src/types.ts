export type UserRole = 'admin' | 'student';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  studentId?: string;
  phone: string;
  createdAt: string;
}

export type StudentLevel = 'ضعيف' | 'متوسط' | 'قوي';

export interface DailyAssignment {
  newMemorization: string; // الحفظ الجديد المقرر اليوم
  review: string; // ورد المراجعة المقرر اليوم
  suggestedSheikh: string; // الشيخ المقترح للاستماع
  tajweedFocus: string; // تركيز التجويد
  dailyNote: string; // نصيحة ذكية للطالب
}

export interface StudentAIPlan {
  roadmapSummary: string;
  currentDailyAssignment: DailyAssignment;
  difficultyAdjustment: string; // e.g. "تم تسهيل الورد نظراً لصعوبة السورة" or "تم تسريع الوتيرة لتميز الطالب"
  estimatedDaysToFinishJuz: number;
  lastUpdated: string;
}

export interface Student {
  id: string;
  name: string;
  password: string;
  phone: string; // رقم هاتف الطالب
  age: number;
  parentName: string;
  parentPhones: string[]; // أرقام أولياء الأمور (الأب، الأم، الأخ، إلخ)
  currentSurah: number; // 1 - 114
  currentSurahName: string;
  currentAyah: number;
  dailyNewTarget: string; // كم يقدر يحفظ باليوم (مثلاً: نصف وجه، وجه كامل، 5 آيات، سورة كاملة)
  dailyReviewTarget: string; // كم يقدر يراجع (مثلاً: وجه واحد، نصف جزء، ربع حزب)
  level: StudentLevel;
  aiPlan?: StudentAIPlan;
  notes?: string;
  createdAt: string;
}

export type AttendanceStatus = 'حاضر' | 'غائب' | 'متأخر' | 'معتذر';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  savedAt: string;
}

export type CriteriaType = 'stars' | 'score' | 'options' | 'text';

export interface EvaluationCriteria {
  id: string;
  name: string; // e.g. "حفظ", "مراجعة", "تجويد", "أخلاق وسلوك"
  type: CriteriaType;
  maxScore?: number; // للدرجات مثل 10 أو 7 أو 100
  options?: string[]; // للخيارات مثل: ممتاز، جيد، ضعيف
  isDefault?: boolean;
}

export interface StudentEvaluation {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  criteriaValues: Record<string, any>; // criteriaId -> value (e.g. score, stars, option, text)
  recitationDetails: {
    newMemorizationAchieved: string; // ماذا أتم الطالب من الحفظ الجديد
    reviewAchieved: string; // ماذا أتم من المراجعة
    teacherNotes: string; // ملاحظات المعلم
  };
  aiFeedback?: {
    studentProgressStatus: 'متقدم' | 'منتظم' | 'متأخر' | 'يحتاج مساعدة';
    analysis: string;
    nextDayPlan: DailyAssignment;
    reasoning: string;
  };
  evaluatedAt: string;
}

export interface AppSettings {
  allowStudentRegistration: boolean;
  workDaysPerWeek: number;
  workDaysNames: string[];
  halaqahName: string;
  teacherName: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionTaken?: string;
}

export interface FullBackupData {
  version: string;
  exportDate: string;
  students: Student[];
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  evaluationCriteria: EvaluationCriteria[];
  settings: AppSettings;
  chatMessages: ChatMessage[];
  userAccounts: UserAccount[];
}
