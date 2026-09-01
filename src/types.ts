export type UserRole = 'admin' | 'student';

export interface TeacherAccount {
  id: string;
  name: string; // e.g. "الشيخ محمد منتصر", "الشيخ عبد الله بن فهد"
  username: string; // username used to log in
  password?: string; // password used to log in
  phone: string; // teacher's phone number
  title?: string; // e.g. "المعلم الأساسي", "معلم شريك / ثانٍ", "محفظ ومساعد"
  isPrimary?: boolean;
  createdAt: string;
}

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

export interface QuranRecitationItem {
  id: string;
  type: string; // e.g. "حفظ جديد" | "مراجعة صغرى" | "مراجعة كبرى" | "مراجعة تراكمية" | "تثبيت مصحف" | "اختبار مرحلي" | "سورة مخصصة"
  surahNumber: number; // Start surah number (1-114)
  surahName: string;   // Start surah name
  fromAyah: number;    // Start ayah
  toSurahNumber?: number; // End surah number (1-114) - if reciting across multiple surahs
  toSurahName?: string;   // End surah name
  toAyah: number;      // End ayah
  isFullSurah?: boolean;
  notes?: string;
}

export interface DailyAssignment {
  newMemorization: string; // الحفظ الجديد المقرر
  review: string; // ورد المراجعة المقرر
  suggestedSheikh: string; // الشيخ المقترح للاستماع
  tajweedFocus?: string; // تركيز التجويد
  dailyNote: string; // توجيه المعلم المنزلي
  // Detailed items
  newItem?: QuranRecitationItem;
  reviewItem?: QuranRecitationItem;
  reviewItems?: QuranRecitationItem[];
}

export interface StudentAIPlan {
  roadmapSummary: string;
  currentDailyAssignment: DailyAssignment;
  difficultyAdjustment: string;
  estimatedDaysToFinishJuz: number;
  lastUpdated: string;
}

export interface Student {
  id: string;
  name: string;
  password: string;
  phone: string;
  age: number;
  parentName: string;
  parentPhones: string[];
  currentSurah: number; // 1 - 114
  currentSurahName: string;
  currentAyah: number;
  dailyNewTarget: string;
  dailyReviewTarget: string;
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
  maxScore?: number;
  options?: string[];
  isDefault?: boolean;
}

export interface StudentEvaluation {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  criteriaValues: Record<string, any>;
  recitationDetails: {
    // Today's recitation (ما تم تسميعه اليوم)
    newMemorizationAchieved: string;
    reviewAchieved: string;
    teacherNotes: string;
    todayNewItem?: QuranRecitationItem;
    todayReviewItems?: QuranRecitationItem[];
    // Tomorrow's required assignment (مقرر الغد الذي حدده المعلم)
    tomorrowNewItem?: QuranRecitationItem;
    tomorrowReviewItem?: QuranRecitationItem;
    tomorrowReviewItems?: QuranRecitationItem[];
    tomorrowSuggestedSheikh?: string;
    tomorrowDailyNote?: string;
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
  teachers?: TeacherAccount[];
}
