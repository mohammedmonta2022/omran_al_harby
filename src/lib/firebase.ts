import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Student,
  AttendanceRecord,
  StudentEvaluation,
  EvaluationCriteria,
  AppSettings,
  ChatMessage,
  UserAccount,
  FullBackupData
} from '../types';

export { firebaseConfig };

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initial Default Evaluation Criteria
export const DEFAULT_CRITERIA: EvaluationCriteria[] = [
  {
    id: 'crit-memorization',
    name: 'حفظ الورد الجديد',
    type: 'score',
    maxScore: 10,
    isDefault: true
  },
  {
    id: 'crit-review',
    name: 'مراجعة الماضي',
    type: 'score',
    maxScore: 10,
    isDefault: true
  },
  {
    id: 'crit-tajweed',
    name: 'التجويد ومخارج الحروف',
    type: 'stars',
    isDefault: false
  },
  {
    id: 'crit-behavior',
    name: 'الآداب وحسن الاستماع',
    type: 'options',
    options: ['متميز ومؤدب', 'جيد ومتعاون', 'يحتاج إلى تنبيه'],
    isDefault: false
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  allowStudentRegistration: true,
  workDaysPerWeek: 5,
  workDaysNames: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  halaqahName: 'حلقة الإمام الشاطبي لتحفيظ القرآن الكريم',
  teacherName: 'الشيخ محمد منتصر'
};

// Initial Seed Students for demonstration
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    name: 'عبد الرحمن أحمد السعيد',
    password: '123',
    phone: '0501234567',
    age: 12,
    parentName: 'أحمد السعيد',
    parentPhones: ['966501234567', '966551234567'],
    currentSurah: 2,
    currentSurahName: 'البقرة',
    currentAyah: 45,
    dailyNewTarget: 'وجه كامل',
    dailyReviewTarget: 'نصف جزء',
    level: 'قوي',
    aiPlan: {
      roadmapSummary: 'خطة حفظ سورة البقرة بمعدل وجه يومياً مع مراجعة نصف جزء من جزء عم وتبارك.',
      currentDailyAssignment: {
        newMemorization: 'سورة البقرة: الآيات (46 - 52)',
        review: 'سورة النبأ وسورة النازعات كاملتين',
        suggestedSheikh: 'الشيخ محمود خليل الحصري (المصحف المعلم)',
        tajweedFocus: 'تطبيق أحكام النون الساكنة والتنوين (الإدغام بغنة)',
        dailyNote: 'كرر كل آية 5 مرات بالربط مع الآية التي قبلها قبل التسميع على المعلم.'
      },
      difficultyAdjustment: 'وتيرة ممتازة تناسب قدرات الطالب العالية',
      estimatedDaysToFinishJuz: 22,
      lastUpdated: new Date().toISOString()
    },
    notes: 'طالب مجتهد وحافظ متميز',
    createdAt: new Date().toISOString()
  },
  {
    id: 'std-2',
    name: 'يوسف عمر الكردي',
    password: '123',
    phone: '0507654321',
    age: 10,
    parentName: 'عمر الكردي',
    parentPhones: ['966507654321'],
    currentSurah: 78,
    currentSurahName: 'النبأ',
    currentAyah: 16,
    dailyNewTarget: 'نصف وجه',
    dailyReviewTarget: 'سورة واحدة',
    level: 'متوسط',
    aiPlan: {
      roadmapSummary: 'إتمام جزء عم خلال 3 أسابيع بمعدل 6 إلى 8 آيات يومياً مع تكرار الاستماع.',
      currentDailyAssignment: {
        newMemorization: 'سورة النبأ: الآيات (17 - 30)',
        review: 'سورة الإخلاص والفلق والناس وقريش',
        suggestedSheikh: 'الشيخ محمد صديق المنشاوي (المعلم)',
        tajweedFocus: 'قلقلة حروف (قطب جد) والمد المتصل',
        dailyNote: 'استمع للشيخ المنشاوي 3 مرات وركز على نطق الحركات بدقة.'
      },
      difficultyAdjustment: 'خطة متوازنة لتعزيز الثقة والتجويد',
      estimatedDaysToFinishJuz: 18,
      lastUpdated: new Date().toISOString()
    },
    notes: 'يحتاج تركيز على المدود',
    createdAt: new Date().toISOString()
  },
  {
    id: 'std-3',
    name: 'بلال خالد القحطاني',
    password: '123',
    phone: '0509876543',
    age: 8,
    parentName: 'خالد القحطاني',
    parentPhones: ['966509876543'],
    currentSurah: 93,
    currentSurahName: 'الضحى',
    currentAyah: 1,
    dailyNewTarget: '3 آيات',
    dailyReviewTarget: 'سورة قصيرة',
    level: 'ضعيف',
    aiPlan: {
      roadmapSummary: 'خطة تشجيعية وتيسيرية لقصار السور بمعدل 3 آيات يومياً مع تقنية التكرار المرحلي.',
      currentDailyAssignment: {
        newMemorization: 'سورة الضحى كاملة (11 آية)',
        review: 'سورة الشرح والتين والعلق',
        suggestedSheikh: 'الشيخ مشاري بن راشد العفاسي',
        tajweedFocus: 'مخارج الحروف الأساسية والوضوح',
        dailyNote: 'قسّم السورة إلى مقطعين، 5 آيات صباحاً و6 آيات مساءً مع الوالد.'
      },
      difficultyAdjustment: 'تم تيسير الورد وتقسيمه ليناسب عمر الطالب وقدرته',
      estimatedDaysToFinishJuz: 45,
      lastUpdated: new Date().toISOString()
    },
    notes: 'يحتاج تشجيع ومكافآت مستمرة',
    createdAt: new Date().toISOString()
  }
];

// LocalStorage helpers to provide instant offline-first sync
const LS_KEYS = {
  STUDENTS: 'omran_students_data',
  ATTENDANCE: 'omran_attendance_data',
  EVALUATIONS: 'omran_evaluations_data',
  CRITERIA: 'omran_criteria_data',
  SETTINGS: 'omran_settings_data',
  CHATS: 'omran_chats_data'
};

export const getLocalData = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    return fallback;
  }
};

export const setLocalData = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

// Firestore Sync & Service
export class OmranDataService {
  // Check Connection and Seed initial data if empty
  static async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (e) {
      // ignore
    }
    await this.seedInitialDataIfEmpty();
    return true;
  }

  static async seedInitialDataIfEmpty() {
    try {
      const snap = await getDocs(collection(db, 'students'));
      if (snap.empty) {
        const raw = localStorage.getItem(LS_KEYS.STUDENTS);
        if (raw === null) {
          for (const s of INITIAL_STUDENTS) {
            await setDoc(doc(db, 'students', s.id), s);
          }
          setLocalData(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
        }
      }

      const critSnap = await getDocs(collection(db, 'criteria'));
      if (critSnap.empty) {
        const rawCrit = localStorage.getItem(LS_KEYS.CRITERIA);
        if (rawCrit === null) {
          for (const c of DEFAULT_CRITERIA) {
            await setDoc(doc(db, 'criteria', c.id), c);
          }
          setLocalData(LS_KEYS.CRITERIA, DEFAULT_CRITERIA);
        }
      }

      const setSnap = await getDoc(doc(db, 'settings', 'main'));
      if (!setSnap.exists()) {
        await setDoc(doc(db, 'settings', 'main'), DEFAULT_SETTINGS);
        setLocalData(LS_KEYS.SETTINGS, DEFAULT_SETTINGS);
      }
    } catch (e) {
      console.warn('Seeding initial data error:', e);
    }
  }

  // Load Students
  static async loadStudents(): Promise<Student[]> {
    try {
      const snap = await getDocs(collection(db, 'students'));
      if (!snap.empty) {
        const list: Student[] = [];
        snap.forEach(d => list.push(d.data() as Student));
        setLocalData(LS_KEYS.STUDENTS, list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore loadStudents error, using local fallback:', e);
    }
    const raw = localStorage.getItem(LS_KEYS.STUDENTS);
    if (raw === null) {
      setLocalData(LS_KEYS.STUDENTS, INITIAL_STUDENTS);
      return INITIAL_STUDENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // Save Student
  static async saveStudent(student: Student): Promise<void> {
    const raw = localStorage.getItem(LS_KEYS.STUDENTS);
    let localList: Student[] = raw ? JSON.parse(raw) : [...INITIAL_STUDENTS];
    const idx = localList.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      localList[idx] = student;
    } else {
      localList.push(student);
    }
    setLocalData(LS_KEYS.STUDENTS, localList);

    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (e) {
      console.warn('Firestore saveStudent fallback to local:', e);
    }
  }

  // Delete Student
  static async deleteStudent(studentId: string): Promise<void> {
    const raw = localStorage.getItem(LS_KEYS.STUDENTS);
    let localList: Student[] = raw ? JSON.parse(raw) : [...INITIAL_STUDENTS];
    const updated = localList.filter(s => s.id !== studentId);
    setLocalData(LS_KEYS.STUDENTS, updated);

    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (e) {
      console.warn('Firestore deleteStudent fallback to local:', e);
    }
  }

  // Load Attendance
  static async loadAttendance(): Promise<AttendanceRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      if (!snap.empty) {
        const list: AttendanceRecord[] = [];
        snap.forEach(d => list.push(d.data() as AttendanceRecord));
        setLocalData(LS_KEYS.ATTENDANCE, list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore loadAttendance error:', e);
    }
    return getLocalData<AttendanceRecord[]>(LS_KEYS.ATTENDANCE, []);
  }

  // Save Batch Attendance
  static async saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
    const localList = getLocalData<AttendanceRecord[]>(LS_KEYS.ATTENDANCE, []);
    const map = new Map<string, AttendanceRecord>();
    localList.forEach(r => map.set(r.id, r));
    records.forEach(r => map.set(r.id, r));
    const merged = Array.from(map.values());
    setLocalData(LS_KEYS.ATTENDANCE, merged);

    try {
      for (const rec of records) {
        await setDoc(doc(db, 'attendance', rec.id), rec);
      }
    } catch (e) {
      console.warn('Firestore saveAttendanceRecords fallback to local:', e);
    }
  }

  // Load Evaluations
  static async loadEvaluations(): Promise<StudentEvaluation[]> {
    try {
      const snap = await getDocs(collection(db, 'evaluations'));
      if (!snap.empty) {
        const list: StudentEvaluation[] = [];
        snap.forEach(d => list.push(d.data() as StudentEvaluation));
        setLocalData(LS_KEYS.EVALUATIONS, list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore loadEvaluations error:', e);
    }
    return getLocalData<StudentEvaluation[]>(LS_KEYS.EVALUATIONS, []);
  }

  // Save Evaluation
  static async saveEvaluation(evaluation: StudentEvaluation): Promise<void> {
    const localList = getLocalData<StudentEvaluation[]>(LS_KEYS.EVALUATIONS, []);
    const idx = localList.findIndex(e => e.id === evaluation.id);
    if (idx >= 0) {
      localList[idx] = evaluation;
    } else {
      localList.push(evaluation);
    }
    setLocalData(LS_KEYS.EVALUATIONS, localList);

    try {
      await setDoc(doc(db, 'evaluations', evaluation.id), evaluation);
    } catch (e) {
      console.warn('Firestore saveEvaluation fallback to local:', e);
    }
  }

  // Load Criteria
  static async loadCriteria(): Promise<EvaluationCriteria[]> {
    try {
      const snap = await getDocs(collection(db, 'criteria'));
      if (!snap.empty) {
        const list: EvaluationCriteria[] = [];
        snap.forEach(d => list.push(d.data() as EvaluationCriteria));
        setLocalData(LS_KEYS.CRITERIA, list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore loadCriteria error:', e);
    }
    const raw = localStorage.getItem(LS_KEYS.CRITERIA);
    if (raw === null) {
      setLocalData(LS_KEYS.CRITERIA, DEFAULT_CRITERIA);
      return DEFAULT_CRITERIA;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // Save Criteria List
  static async saveCriteriaList(list: EvaluationCriteria[]): Promise<void> {
    setLocalData(LS_KEYS.CRITERIA, list);
    try {
      for (const item of list) {
        await setDoc(doc(db, 'criteria', item.id), item);
      }
    } catch (e) {
      console.warn('Firestore saveCriteriaList fallback to local:', e);
    }
  }

  // Delete Criteria
  static async deleteCriteria(id: string): Promise<void> {
    const raw = localStorage.getItem(LS_KEYS.CRITERIA);
    let current: EvaluationCriteria[] = raw ? JSON.parse(raw) : [...DEFAULT_CRITERIA];
    const updated = current.filter(c => c.id !== id);
    setLocalData(LS_KEYS.CRITERIA, updated);
    try {
      await deleteDoc(doc(db, 'criteria', id));
    } catch (e) {
      console.warn('Firestore deleteCriteria fallback to local:', e);
    }
  }

  // Load Settings
  static async loadSettings(): Promise<AppSettings> {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'main'));
      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        setLocalData(LS_KEYS.SETTINGS, data);
        return data;
      }
    } catch (e) {
      console.warn('Firestore loadSettings error:', e);
    }
    return getLocalData<AppSettings>(LS_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  // Save Settings
  static async saveSettings(settings: AppSettings): Promise<void> {
    setLocalData(LS_KEYS.SETTINGS, settings);
    try {
      await setDoc(doc(db, 'settings', 'main'), settings);
    } catch (e) {
      console.warn('Firestore saveSettings fallback to local:', e);
    }
  }

  // Load Chats
  static async loadChats(): Promise<ChatMessage[]> {
    try {
      const snap = await getDocs(collection(db, 'chats'));
      if (!snap.empty) {
        const list: ChatMessage[] = [];
        snap.forEach(d => list.push(d.data() as ChatMessage));
        setLocalData(LS_KEYS.CHATS, list);
        return list;
      }
    } catch (e) {
      console.warn('Firestore loadChats error:', e);
    }
    return getLocalData<ChatMessage[]>(LS_KEYS.CHATS, []);
  }

  // Save Chat Message
  static async saveChatMessage(msg: ChatMessage): Promise<void> {
    const list = getLocalData<ChatMessage[]>(LS_KEYS.CHATS, []);
    list.push(msg);
    setLocalData(LS_KEYS.CHATS, list);
    try {
      await setDoc(doc(db, 'chats', msg.id), msg);
    } catch (e) {
      console.warn('Firestore saveChatMessage fallback to local:', e);
    }
  }

  // Clear Chats
  static async clearChats(): Promise<void> {
    setLocalData(LS_KEYS.CHATS, []);
    try {
      const snap = await getDocs(collection(db, 'chats'));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      console.warn('Firestore clearChats error:', e);
    }
  }

  // Export Full Database
  static async exportFullBackup(): Promise<FullBackupData> {
    const students = await this.loadStudents();
    const attendance = await this.loadAttendance();
    const evaluations = await this.loadEvaluations();
    const evaluationCriteria = await this.loadCriteria();
    const settings = await this.loadSettings();
    const chatMessages = await this.loadChats();

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      students,
      attendance,
      evaluations,
      evaluationCriteria,
      settings,
      chatMessages,
      userAccounts: [
        {
          id: 'admin-1',
          username: 'محمد منتصر',
          role: 'admin',
          phone: '0500000000',
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  // Import / Restore Full Database
  static async importFullBackup(backup: FullBackupData): Promise<void> {
    if (!backup || !backup.students) {
      throw new Error('ملف النسخة الاحتياطية غير صالح');
    }

    // Save to local storage
    setLocalData(LS_KEYS.STUDENTS, backup.students || []);
    setLocalData(LS_KEYS.ATTENDANCE, backup.attendance || []);
    setLocalData(LS_KEYS.EVALUATIONS, backup.evaluations || []);
    setLocalData(LS_KEYS.CRITERIA, backup.evaluationCriteria || DEFAULT_CRITERIA);
    setLocalData(LS_KEYS.SETTINGS, backup.settings || DEFAULT_SETTINGS);
    setLocalData(LS_KEYS.CHATS, backup.chatMessages || []);

    // Try saving to Firestore
    try {
      if (backup.students) {
        for (const s of backup.students) {
          await setDoc(doc(db, 'students', s.id), s);
        }
      }
      if (backup.attendance) {
        for (const a of backup.attendance) {
          await setDoc(doc(db, 'attendance', a.id), a);
        }
      }
      if (backup.evaluations) {
        for (const ev of backup.evaluations) {
          await setDoc(doc(db, 'evaluations', ev.id), ev);
        }
      }
      if (backup.evaluationCriteria) {
        for (const c of backup.evaluationCriteria) {
          await setDoc(doc(db, 'criteria', c.id), c);
        }
      }
      if (backup.settings) {
        await setDoc(doc(db, 'settings', 'main'), backup.settings);
      }
    } catch (e) {
      console.warn('Firestore restore partially skipped to local:', e);
    }
  }
}
