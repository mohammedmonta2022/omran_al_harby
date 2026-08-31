import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  UserCheck,
  BookOpen,
  MessageCircle,
  Award,
  Sparkles,
  Database,
  Sliders,
  LogOut,
  Calendar,
  Lock,
  Unlock
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  StudentEvaluation,
  EvaluationCriteria,
  AppSettings,
  ChatMessage,
  UserRole
} from './types';
import {
  OmranDataService,
  DEFAULT_CRITERIA,
  DEFAULT_SETTINGS,
  INITIAL_STUDENTS
} from './lib/firebase';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { ParentPortalView } from './components/ParentPortalView';
import { HomeTab } from './components/tabs/HomeTab';
import { StudentsTab } from './components/tabs/StudentsTab';
import { AttendanceTab } from './components/tabs/AttendanceTab';
import { EvaluationTab } from './components/tabs/EvaluationTab';
import { ParentsWhatsAppTab } from './components/tabs/ParentsWhatsAppTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { AICoachTab } from './components/tabs/AICoachTab';
import { DataBackupTab } from './components/tabs/DataBackupTab';

export function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: UserRole;
    studentId?: string;
  } | null>(() => {
    const saved = localStorage.getItem('omran_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Check URL portal query param for direct parent portal link (?portal=std-1 or ?id=std-1)
  const [portalStudentId, setPortalStudentId] = useState<string | null>(null);
  const [directPortalStudent, setDirectPortalStudent] = useState<Student | null>(null);

  // Active Tab for Admin
  const [activeTab, setActiveTab] = useState<string>('home');
  const [targetStudentForEval, setTargetStudentForEval] = useState<string | undefined>();
  const [targetStudentForWhatsApp, setTargetStudentForWhatsApp] = useState<string | undefined>();

  // Main Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>(DEFAULT_CRITERIA);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Parse URL on initial load and handle hash / search changes
  useEffect(() => {
    const parsePortalParam = () => {
      // Check search params ?portal=... or ?id=... or ?student=...
      const urlParams = new URLSearchParams(window.location.search);
      let portalId =
        urlParams.get('portal') ||
        urlParams.get('id') ||
        urlParams.get('student') ||
        urlParams.get('studentId');

      // Check hash #portal=... or #id=...
      if (!portalId && window.location.hash) {
        const hash = window.location.hash.replace(/^#\/?/, '');
        const hashParams = new URLSearchParams(hash);
        portalId =
          hashParams.get('portal') ||
          hashParams.get('id') ||
          hashParams.get('student') ||
          (hash.startsWith('portal=') ? hash.split('portal=')[1] : null) ||
          (hash.startsWith('id=') ? hash.split('id=')[1] : null);
      }

      if (portalId) {
        setPortalStudentId(decodeURIComponent(portalId));
      }
    };

    parsePortalParam();
    window.addEventListener('popstate', parsePortalParam);
    window.addEventListener('hashchange', parsePortalParam);
    return () => {
      window.removeEventListener('popstate', parsePortalParam);
      window.removeEventListener('hashchange', parsePortalParam);
    };
  }, []);

  // Dedicated effect to resolve portal student directly from storage/firestore if needed
  useEffect(() => {
    if (!portalStudentId) {
      setDirectPortalStudent(null);
      return;
    }

    const resolvePortalStudent = async () => {
      const clean = decodeURIComponent(portalStudentId).trim();
      const match = students.find(
        s =>
          s.id === clean ||
          s.id.toLowerCase() === clean.toLowerCase() ||
          s.name.trim() === clean ||
          s.name.replace(/\s+/g, '') === clean.replace(/\s+/g, '') ||
          s.phone.replace(/\D/g, '') === clean.replace(/\D/g, '') ||
          (s.parentPhones && s.parentPhones.some(p => p.replace(/\D/g, '') === clean.replace(/\D/g, '')))
      );
      if (match) {
        setDirectPortalStudent(match);
        return;
      }

      const fetched = await OmranDataService.findStudentByIdOrQuery(portalStudentId);
      if (fetched) {
        setDirectPortalStudent(fetched);
        setStudents(prev => (prev.some(s => s.id === fetched.id) ? prev : [...prev, fetched]));
      }
    };

    resolvePortalStudent();
  }, [portalStudentId, students]);

  // Load all data from Firestore / LocalCache
  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      const [
        loadedStudents,
        loadedAttendance,
        loadedEvaluations,
        loadedCriteria,
        loadedSettings,
        loadedChats
      ] = await Promise.all([
        OmranDataService.loadStudents(),
        OmranDataService.loadAttendance(),
        OmranDataService.loadEvaluations(),
        OmranDataService.loadCriteria(),
        OmranDataService.loadSettings(),
        OmranDataService.loadChats()
      ]);

      setStudents(loadedStudents);
      setAttendance(loadedAttendance);
      setEvaluations(loadedEvaluations);
      setCriteria(loadedCriteria);
      setSettings(loadedSettings);
      setChatHistory(loadedChats);
    } catch (e) {
      console.error('Error loading initial data:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    OmranDataService.testConnection();
    loadAllData();
  }, []);

  // Save session on login
  const handleLoginSuccess = (user: { username: string; role: UserRole; studentId?: string }) => {
    setCurrentUser(user);
    localStorage.setItem('omran_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('omran_session');
    setPortalStudentId(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  // 1. Student Registration / Addition
  const handleAddStudent = async (studentData: Partial<Student>): Promise<boolean> => {
    const newStudent: Student = {
      id: `std_${Date.now()}`,
      name: studentData.name || 'طالب جديد',
      password: studentData.password || '123',
      phone: studentData.phone || '',
      age: studentData.age || 10,
      parentName: studentData.parentName || `ولي أمر ${studentData.name}`,
      parentPhones: studentData.parentPhones || [studentData.phone || ''],
      currentSurah: studentData.currentSurah || 78,
      currentSurahName: studentData.currentSurahName || 'النبأ',
      currentAyah: studentData.currentAyah || 1,
      dailyNewTarget: studentData.dailyNewTarget || 'نصف وجه',
      dailyReviewTarget: studentData.dailyReviewTarget || 'وجه واحد',
      level: studentData.level || 'متوسط',
      notes: studentData.notes || '',
      createdAt: new Date().toISOString()
    };

    // Auto trigger Gemini AI plan generation
    try {
      const res = await fetch('/api/gemini/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: newStudent })
      });
      const data = await res.json();
      if (data?.plan) {
        newStudent.aiPlan = {
          ...data.plan,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('AI Plan generation warning:', e);
    }

    await OmranDataService.saveStudent(newStudent);
    const updated = await OmranDataService.loadStudents();
    setStudents(updated);
    return true;
  };

  // 2. Update Student
  const handleUpdateStudent = async (student: Student): Promise<boolean> => {
    await OmranDataService.saveStudent(student);
    const updated = await OmranDataService.loadStudents();
    setStudents(updated);
    return true;
  };

  // 3. Delete Student
  const handleDeleteStudent = async (studentId: string): Promise<boolean> => {
    // 1. Optimistic instant UI update
    setStudents(prev => prev.filter(s => s.id !== studentId));
    // 2. Persist to Firestore and storage
    await OmranDataService.deleteStudent(studentId);
    const updatedSeq = await OmranDataService.loadStudents();
    setStudents(updatedSeq);
    return true;
  };

  // 4. Toggle Student Registration
  const handleToggleRegistration = async () => {
    const newSettings: AppSettings = {
      ...settings,
      allowStudentRegistration: !settings.allowStudentRegistration
    };
    setSettings(newSettings);
    await OmranDataService.saveSettings(newSettings);
  };

  // 5. Trigger AI Plan for specific student
  const handleTriggerAIPlan = async (student: Student) => {
    try {
      const res = await fetch('/api/gemini/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student })
      });
      const data = await res.json();
      if (data?.plan) {
        const updatedStudent: Student = {
          ...student,
          aiPlan: {
            ...data.plan,
            lastUpdated: new Date().toISOString()
          }
        };
        await OmranDataService.saveStudent(updatedStudent);
        const list = await OmranDataService.loadStudents();
        setStudents(list);
      }
    } catch (e) {
      console.error('Trigger AI plan error:', e);
    }
  };

  // 6. Save Attendance
  const handleSaveAttendance = async (records: AttendanceRecord[]) => {
    await OmranDataService.saveAttendanceRecords(records);
    const list = await OmranDataService.loadAttendance();
    setAttendance(list);
  };

  // 7. Save Evaluation
  const handleSaveEvaluation = async (evaluation: StudentEvaluation) => {
    await OmranDataService.saveEvaluation(evaluation);
    const list = await OmranDataService.loadEvaluations();
    setEvaluations(list);
  };

  // 8. Update Criteria
  const handleSaveCriteria = async (list: EvaluationCriteria[]) => {
    setCriteria(list);
    await OmranDataService.saveCriteriaList(list);
  };

  const handleDeleteCriteria = async (id: string) => {
    await OmranDataService.deleteCriteria(id);
    const list = await OmranDataService.loadCriteria();
    setCriteria(list);
  };

  // 9. Update Student AI Plan Assignment
  const handleUpdateStudentAIPlan = async (studentId: string, newAssignment: any) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const updatedStudent: Student = {
      ...student,
      aiPlan: {
        roadmapSummary: student.aiPlan?.roadmapSummary || 'خطة الحفظ والمراجعة التراكمية',
        difficultyAdjustment: student.aiPlan?.difficultyAdjustment || 'وتيرة متوازنة',
        estimatedDaysToFinishJuz: student.aiPlan?.estimatedDaysToFinishJuz || 30,
        currentDailyAssignment: newAssignment,
        lastUpdated: new Date().toISOString()
      }
    };

    await OmranDataService.saveStudent(updatedStudent);
    const list = await OmranDataService.loadStudents();
    setStudents(list);
  };

  // 10. Update Settings
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await OmranDataService.saveSettings(newSettings);
  };

  // 11. Send Chat
  const handleSendChatMessage = async (msg: ChatMessage) => {
    await OmranDataService.saveChatMessage(msg);
    const list = await OmranDataService.loadChats();
    setChatHistory(list);
  };

  const handleClearChat = async () => {
    await OmranDataService.clearChats();
    setChatHistory([]);
  };

  // 12. Navigation Handlers
  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSelectStudentForEval = (studentId: string) => {
    setTargetStudentForEval(studentId);
    setActiveTab('evaluation');
  };

  const handleNavigateToWhatsApp = (studentId: string) => {
    setTargetStudentForWhatsApp(studentId);
    setActiveTab('parents');
  };

  // If URL contains portal query param or logged in as student:
  const activePortalStudent = portalStudentId
    ? directPortalStudent ||
      students.find(
        s =>
          s.id === portalStudentId ||
          s.id.toLowerCase() === portalStudentId.toLowerCase() ||
          s.name.trim() === portalStudentId.trim() ||
          s.name.replace(/\s+/g, '') === portalStudentId.replace(/\s+/g, '') ||
          s.phone.replace(/\D/g, '') === portalStudentId.replace(/\D/g, '') ||
          (s.parentPhones && s.parentPhones.some(p => p.replace(/\D/g, '') === portalStudentId.replace(/\D/g, '')))
      )
    : currentUser?.role === 'student'
    ? students.find(s => s.id === currentUser.studentId || s.name === currentUser.username)
    : null;

  // 1. Loading State when accessing via direct Portal Link
  if (portalStudentId && isLoadingData) {
    return (
      <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans flex flex-col items-center justify-center p-6" dir="rtl">
        <AnimatedBackground />
        <div className="relative z-10 text-center space-y-4 max-w-sm bg-[#064e3b]/80 border border-[#065f46] p-8 rounded-[32px] backdrop-blur-md shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#064e3b] flex items-center justify-center mx-auto shadow-xl animate-pulse">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-heading text-white">بوابة المتابعة الحية</h2>
          <p className="text-xs text-[#86efac]">جاري تحميل ملف الطالب والبيانات القرآنية المحدثة...</p>
          <div className="w-full bg-[#022c22] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#fbbf24] h-full rounded-full animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Direct Student / Parent Portal View
  if (activePortalStudent) {
    return (
      <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b]" dir="rtl">
        <AnimatedBackground />
        <ParentPortalView
          student={activePortalStudent}
          attendance={attendance}
          evaluations={evaluations}
          settings={settings}
          isLoggedInStudent={!!currentUser}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // 3. If Portal Link was invalid / not found after data loaded
  if (portalStudentId && !isLoadingData && !activePortalStudent) {
    return (
      <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans flex flex-col items-center justify-center p-6" dir="rtl">
        <AnimatedBackground />
        <div className="relative z-10 text-center space-y-5 max-w-md bg-[#064e3b]/90 border border-amber-500/40 p-8 rounded-[32px] backdrop-blur-md shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-[#fbbf24] flex items-center justify-center mx-auto border border-amber-500/30">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">لم يتم العثور على ملف الطالب</h2>
            <p className="text-xs text-[#86efac]/90 mt-2 leading-relaxed">
              تعذر العثور على سجل الطالب بالمعرّف المرفق. قد يكون تم تحديث السجل أو تعديل بيانات الحلقة.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                setPortalStudentId(null);
                window.history.replaceState({}, '', window.location.pathname);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#fbbf24] text-[#064e3b] font-black text-xs hover:bg-[#f59e0b] shadow-lg cursor-pointer transition-all"
            >
              الذهاب إلى البوابة الرئيسية
            </button>
            <button
              onClick={() => loadAllData()}
              className="py-3 px-4 rounded-2xl bg-[#022c22] text-[#86efac] font-bold text-xs border border-[#065f46] hover:text-white cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, show Login / Register Modal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b]" dir="rtl">
        <AnimatedBackground />
        <LoginModal
          onLoginSuccess={handleLoginSuccess}
          onRegisterStudent={handleAddStudent}
          students={students}
          settings={settings}
        />
      </div>
    );
  }

  // Navigation Items for Admin/Teacher
  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'students', label: 'الطلاب والتسجيل', icon: Users, badge: students.length },
    { id: 'attendance', label: 'الحضور والغياب', icon: UserCheck },
    { id: 'evaluation', label: 'تقييم التسميع', icon: BookOpen },
    { id: 'parents', label: 'رسائل الواتساب', icon: MessageCircle },
    { id: 'reports', label: 'التقارير الدورية', icon: Award },
    { id: 'aicoach', label: 'المستشار الذكي', icon: Sparkles, isHighlight: true },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: Database }
  ];

  return (
    <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] font-sans selection:bg-[#fbbf24] selection:text-[#064e3b] pb-12" dir="rtl">
      <AnimatedBackground />

      {/* Main Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        settings={settings}
        studentsCount={students.length}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 relative z-10 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none bg-[#064e3b]/80 p-1.5 rounded-2xl border border-[#065f46] backdrop-blur-md shadow-lg">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? item.isHighlight
                      ? 'bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-[#064e3b] shadow-lg shadow-amber-950/60 font-black'
                      : 'bg-[#fbbf24] text-[#064e3b] shadow-lg shadow-amber-950/40 font-black'
                    : item.isHighlight
                    ? 'text-[#fbbf24] hover:bg-[#022c22]/70'
                    : 'text-[#86efac]/80 hover:text-white hover:bg-[#022c22]/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#064e3b]' : item.isHighlight ? 'text-[#fbbf24]' : 'text-[#86efac]'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-[#064e3b]/20 text-[#064e3b] font-black' : 'bg-[#022c22] text-[#86efac]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        {activeTab === 'home' && (
          <HomeTab
            students={students}
            attendance={attendance}
            evaluations={evaluations}
            settings={settings}
            onNavigateTab={handleNavigateTab}
            onSelectStudentForEval={handleSelectStudentForEval}
          />
        )}

        {activeTab === 'students' && (
          <StudentsTab
            students={students}
            settings={settings}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onToggleRegistration={handleToggleRegistration}
            onTriggerAIPlan={handleTriggerAIPlan}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            students={students}
            attendanceRecords={attendance}
            onSaveAttendance={handleSaveAttendance}
          />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationTab
            students={students}
            attendance={attendance}
            evaluations={evaluations}
            criteria={criteria}
            selectedStudentId={targetStudentForEval}
            onSaveEvaluation={handleSaveEvaluation}
            onSaveCriteria={handleSaveCriteria}
            onDeleteCriteria={handleDeleteCriteria}
            onUpdateStudentAIPlan={handleUpdateStudentAIPlan}
            onNavigateToWhatsApp={handleNavigateToWhatsApp}
          />
        )}

        {activeTab === 'parents' && (
          <ParentsWhatsAppTab
            students={students}
            attendance={attendance}
            evaluations={evaluations}
            settings={settings}
            preselectedStudentId={targetStudentForWhatsApp}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            students={students}
            attendance={attendance}
            evaluations={evaluations}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'aicoach' && (
          <AICoachTab
            students={students}
            settings={settings}
            chatHistory={chatHistory}
            onSendMessage={handleSendChatMessage}
            onClearChat={handleClearChat}
          />
        )}

        {activeTab === 'backup' && (
          <DataBackupTab
            onRefreshAllData={loadAllData}
          />
        )}
      </main>
    </div>
  );
}

export default App;
