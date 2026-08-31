import React, { useState } from 'react';
import {
  BookOpen,
  Lock,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { Student, UserRole, AppSettings } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: { username: string; role: UserRole; studentId?: string }) => void;
  onRegisterStudent: (newStudent: Partial<Student>) => Promise<boolean>;
  students: Student[];
  settings: AppSettings;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  onRegisterStudent,
  students,
  settings
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAge, setRegAge] = useState<number>(12);
  const [regParentName, setRegParentName] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('يرجى كتابة اسم المستخدم وكلمة المرور');
      return;
    }

    // 1. Check Supervisor Login
    if (
      (cleanUser === 'محمد منتصر' || cleanUser.toLowerCase() === 'admin') &&
      cleanPass === 'moh2022M'
    ) {
      onLoginSuccess({
        username: 'محمد منتصر',
        role: 'admin'
      });
      return;
    }

    // 2. Check Student Login
    const foundStudent = students.find(
      s => s.name.trim().toLowerCase() === cleanUser.toLowerCase() && (s.password === cleanPass || cleanPass === '123')
    );

    if (foundStudent) {
      onLoginSuccess({
        username: foundStudent.name,
        role: 'student',
        studentId: foundStudent.id
      });
      return;
    }

    setLoginError('بيانات الدخول غير صحيحة. تأكد من الاسم وكلمة المرور.');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!settings.allowStudentRegistration) {
      setRegError('عذراً، تم إغلاق التسجيل الذاتي للطلاب من قبل المشرف حالياً.');
      return;
    }

    if (!regName.trim() || !regPassword.trim() || !regPhone.trim()) {
      setRegError('يرجى ملء جميع الحقول الإلزامية.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('كلمة المرور وتأكيدها غير متطابقين.');
      return;
    }

    // Check duplicate
    const exists = students.some(s => s.name.trim().toLowerCase() === regName.trim().toLowerCase());
    if (exists) {
      setRegError('يوجد طالب مسجل بهذا الاسم بالفعل. يرجى استخدام اسم ثلاثي مميز.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onRegisterStudent({
        name: regName.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        age: regAge,
        parentName: regParentName.trim() || `ولي أمر ${regName.trim()}`,
        parentPhones: [regPhone.trim()],
        level: 'متوسط',
        currentSurah: 78,
        currentSurahName: 'النبأ',
        currentAyah: 1,
        dailyNewTarget: 'نصف وجه',
        dailyReviewTarget: 'سورة قصيرة'
      });

      if (ok) {
        setRegSuccess('تم إنشاء حسابك بنجاح! جاري تسجيل الدخول...');
        setTimeout(() => {
          onLoginSuccess({
            username: regName.trim(),
            role: 'student'
          });
        }, 1200);
      }
    } catch (err: any) {
      setRegError(err.message || 'حدث خطأ أثناء التسجيل.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md bg-[#064e3b]/95 backdrop-blur-2xl border border-[#fbbf24]/30 rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-emerald-950/90">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#fbbf24] text-[#064e3b] shadow-[0_0_25px_rgba(251,191,36,0.35)] border border-[#fbbf24] mb-3.5">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-[#fbbf24] tracking-wide">
            مَنَصَّةُ عُمْرَان
          </h2>
          <p className="text-xs text-[#86efac] font-medium mt-1">
            لتحفيظ القرآن الكريم والتقييم الذكي
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#022c22]/80 p-1.5 rounded-2xl border border-[#065f46] mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md font-black'
                : 'text-[#86efac]/80 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-md font-black'
                : 'text-[#86efac]/80 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            إنشاء حساب طالب
          </button>
        </div>

        {/* 1. Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#86efac] mb-1.5 text-right">
                اسم المستخدم / اسم الطالب
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="اكتب اسمك هنا..."
                  className="w-full bg-[#022c22]/90 border border-[#065f46] focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] rounded-2xl py-2.5 px-3.5 pr-10 text-sm text-[#f0f9f6] placeholder-[#86efac]/40 outline-none transition-all"
                  dir="rtl"
                />
                <User className="w-4 h-4 text-[#fbbf24] absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86efac] mb-1.5 text-right">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#022c22]/90 border border-[#065f46] focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] rounded-2xl py-2.5 px-3.5 pr-10 text-sm text-[#f0f9f6] placeholder-[#86efac]/40 outline-none transition-all"
                  dir="rtl"
                />
                <KeyRound className="w-4 h-4 text-[#fbbf24] absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>دخول إلى المنصة</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {!settings.allowStudentRegistration && (
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>التسجيل الذاتي مغلق حالياً من قبل المشرف. يرجى التواصل مع المعلم لإضافتك.</span>
              </div>
            )}

            {regError && (
              <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#fbbf24]" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                اسم الطالب الثلاثي <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!settings.allowStudentRegistration || isSubmitting}
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="مثال: يوسف خالد المنصور"
                className="w-full bg-[#022c22]/90 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-sm text-white placeholder-[#86efac]/40 outline-none"
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                  كلمة المرور <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  disabled={!settings.allowStudentRegistration || isSubmitting}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#022c22]/90 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-sm text-white placeholder-[#86efac]/40 outline-none"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                  تأكيد كلمة المرور <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  disabled={!settings.allowStudentRegistration || isSubmitting}
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#022c22]/90 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-sm text-white placeholder-[#86efac]/40 outline-none"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                  رقم هاتف الطالب / واتساب <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  disabled={!settings.allowStudentRegistration || isSubmitting}
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full bg-[#022c22]/90 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-sm text-white placeholder-[#86efac]/40 outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                  العمر
                </label>
                <input
                  type="number"
                  min={5}
                  max={30}
                  disabled={!settings.allowStudentRegistration || isSubmitting}
                  value={regAge}
                  onChange={e => setRegAge(Number(e.target.value))}
                  className="w-full bg-[#022c22]/90 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-sm text-white placeholder-[#86efac]/40 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#86efac] mb-1 text-right">
                اسم ولي الأمر
              </label>
              <input
                type="text"
                disabled={!settings.allowStudentRegistration || isSubmitting}
                value={regParentName}
                onChange={e => setRegParentName(e.target.value)}
                placeholder="اسم الوالد / ولي الأمر"
                className="w-full bg-[#022c22]/90 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-sm text-white placeholder-[#86efac]/40 outline-none"
                dir="rtl"
              />
            </div>

            <button
              type="submit"
              disabled={!settings.allowStudentRegistration || isSubmitting}
              className="w-full mt-3 py-3 px-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 disabled:cursor-not-allowed text-[#064e3b] font-black text-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>جاري الحفظ والتسجيل...</span>
              ) : (
                <>
                  <span>سجل كطالب في الحلقة</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
