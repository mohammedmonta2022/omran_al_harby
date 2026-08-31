import React from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
  Send,
  Award,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Flame,
  Volume2
} from 'lucide-react';
import { Student, AttendanceRecord, StudentEvaluation, AppSettings } from '../../types';

interface HomeTabProps {
  students: Student[];
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  settings: AppSettings;
  onNavigateTab: (tab: string) => void;
  onSelectStudentForEval?: (studentId: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  students,
  attendance,
  evaluations,
  settings,
  onNavigateTab,
  onSelectStudentForEval
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Today's attendance calculation
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentCount = todayAttendance.filter(a => a.status === 'حاضر').length;
  const absentCount = todayAttendance.filter(a => a.status === 'غائب').length;
  const lateCount = todayAttendance.filter(a => a.status === 'متأخر').length;
  const excusedCount = todayAttendance.filter(a => a.status === 'معتذر').length;
  const unrecordedCount = Math.max(0, students.length - todayAttendance.length);

  const attendanceRate = students.length > 0
    ? Math.round(((presentCount + lateCount) / students.length) * 100)
    : 0;

  // Today's evaluations
  const todayEvals = evaluations.filter(e => e.date === todayStr);
  const evaluatedCount = todayEvals.length;
  const evalRate = presentCount > 0
    ? Math.round((evaluatedCount / presentCount) * 100)
    : 0;

  // Students by level
  const strongCount = students.filter(s => s.level === 'قوي').length;
  const mediumCount = students.filter(s => s.level === 'متوسط').length;
  const weakCount = students.filter(s => s.level === 'ضعيف').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#064e3b] via-[#022c22] to-[#064e3b] border border-[#fbbf24]/30 p-6 sm:p-8 shadow-2xl shadow-emerald-950/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40 text-xs font-bold mb-3 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>لوحة القيادة الذكية والمتابعة الحية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white">
              مرحباً بك، <span className="text-[#fbbf24]">{settings.teacherName || 'الشيخ محمد منتصر'}</span> 🌿
            </h2>
            <p className="text-[#86efac]/90 text-sm mt-1 max-w-xl">
              تسميع وحفظ اليوم في {settings.halaqahName}. يتابع الذكاء الاصطناعي تقدم كل طالب ويضبط خططه اليومية تلقائياً.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-5 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-[#064e3b]" />
              <span>تسجيل حضور اليوم</span>
            </button>
            <button
              onClick={() => onNavigateTab('evaluation')}
              className="px-5 py-2.5 rounded-2xl bg-[#064e3b] hover:bg-[#065f46] text-[#fbbf24] border border-[#fbbf24]/30 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#fbbf24]" />
              <span>تقييم التسميع</span>
            </button>
          </div>
        </div>

        {/* Decorative Arabesque Corner */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-radial from-[#fbbf24]/10 to-transparent pointer-events-none" />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-[#064e3b]/50 border border-[#065f46] rounded-[24px] p-5 hover:border-[#fbbf24]/40 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#86efac]/90">إجمالي طلاب الحلقة</span>
            <div className="w-10 h-10 rounded-2xl bg-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center border border-[#fbbf24]/30">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#fbbf24] font-heading">
            {students.length}
          </div>
          <div className="text-[11px] text-[#86efac] mt-1 flex items-center gap-1 font-medium">
            <span>{strongCount} متقدم</span> • <span>{mediumCount} متوسط</span> • <span>{weakCount} متابعة</span>
          </div>
        </div>

        {/* Today Attendance Rate */}
        <div className="bg-[#064e3b]/50 border border-[#065f46] rounded-[24px] p-5 hover:border-[#fbbf24]/40 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#86efac]/90">حضور اليوم ({todayStr})</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-[#86efac] flex items-center justify-center border border-emerald-500/30">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            {presentCount} <span className="text-xs text-[#86efac]/70 font-normal">/ {students.length} طالب</span>
          </div>
          <div className="text-[11px] text-[#86efac] mt-1 flex items-center gap-1">
            <span>نسبة الحضور: <strong className="text-[#fbbf24]">{attendanceRate}%</strong></span>
          </div>
        </div>

        {/* Today Recited */}
        <div className="bg-[#064e3b]/50 border border-[#065f46] rounded-[24px] p-5 hover:border-[#fbbf24]/40 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#86efac]/90">التسميع المنجز اليوم</span>
            <div className="w-10 h-10 rounded-2xl bg-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center border border-[#fbbf24]/30">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#fbbf24] font-heading">
            {evaluatedCount} <span className="text-xs text-[#86efac]/70 font-normal">من {presentCount} حاضر</span>
          </div>
          <div className="text-[11px] text-[#86efac] mt-1">
            <span>نسبة إنجاز التسميع: <strong className="text-[#fbbf24]">{evalRate}%</strong></span>
          </div>
        </div>

        {/* AI Plans Active */}
        <div className="bg-[#064e3b]/50 border border-[#065f46] rounded-[24px] p-5 hover:border-[#fbbf24]/40 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#86efac]/90">خطط الذكاء الاصطناعي</span>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#d97706] text-[#064e3b] flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#fbbf24] font-heading">
            {students.filter(s => s.aiPlan).length}
          </div>
          <div className="text-[11px] text-[#86efac] mt-1">
            <span>خطط مخصصة نشطة ومحدثة</span>
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Student Roster Quick Review */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#fbbf24]" />
              <span>متابعة تسميع طلاب الحلقة اليوم</span>
            </h3>
            <button
              onClick={() => onNavigateTab('evaluation')}
              className="text-xs text-[#fbbf24] hover:text-amber-300 flex items-center gap-1 font-bold cursor-pointer"
            >
              <span>فتح شاشة التقييم الكاملة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-[#064e3b]/50 border border-[#065f46] rounded-[24px] divide-y divide-[#065f46]/60 overflow-hidden shadow-lg">
            {students.length === 0 ? (
              <div className="p-8 text-center text-[#86efac]/80 text-sm">
                لم يتم تسجيل أي طلاب بعد. يمكنك إضافة طلاب من تبويب "الطلاب والتسجيل".
              </div>
            ) : (
              students.map(student => {
                const att = todayAttendance.find(a => a.studentId === student.id);
                const isPresent = att?.status === 'حاضر';
                const isAbsent = att?.status === 'غائب';
                const isExcused = att?.status === 'معتذر';
                const hasEvaluation = todayEvals.some(e => e.studentId === student.id);

                return (
                  <div
                    key={student.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isAbsent
                        ? 'opacity-50 bg-[#022c22]/60'
                        : isExcused
                        ? 'opacity-60 bg-purple-950/20'
                        : 'hover:bg-[#065f46]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#022c22] border border-[#065f46] flex items-center justify-center font-bold text-sm text-[#fbbf24] shrink-0 shadow-inner">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{student.name}</h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              student.level === 'قوي'
                                ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30'
                                : student.level === 'متوسط'
                                ? 'bg-emerald-500/20 text-[#86efac] border border-emerald-500/30'
                                : 'bg-amber-600/20 text-amber-300 border border-amber-600/30'
                            }`}
                          >
                            {student.level}
                          </span>
                        </div>
                        <p className="text-xs text-[#86efac]/80 mt-0.5">
                          سورة {student.currentSurahName} (الآية {student.currentAyah}) • ورد الحفظ:{' '}
                          <span className="text-[#fbbf24] font-medium">{student.dailyNewTarget}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Attendance Badge */}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold ${
                          isPresent
                            ? 'bg-emerald-500/20 text-[#86efac] border border-emerald-500/30'
                            : isAbsent
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : isExcused
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : att?.status === 'متأخر'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-[#022c22] text-[#86efac]/60 border border-[#065f46]'
                        }`}
                      >
                        {att?.status || 'لم يسجل'}
                      </span>

                      {/* Evaluation button / status */}
                      {hasEvaluation ? (
                        <span className="text-xs px-3 py-1 rounded-xl bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30 font-bold flex items-center gap-1 shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>تم التسميع</span>
                        </span>
                      ) : isPresent ? (
                        <button
                          onClick={() => {
                            if (onSelectStudentForEval) {
                              onSelectStudentForEval(student.id);
                            }
                            onNavigateTab('evaluation');
                          }}
                          className="text-xs px-3.5 py-1.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black transition-all shadow-[0_0_12px_rgba(251,191,36,0.3)] cursor-pointer"
                        >
                          تسميع الآن
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & AI Assistant Widget */}
        <div className="space-y-4">
          {/* Quick Shortcuts */}
          <div className="bg-[#064e3b]/50 border border-[#065f46] rounded-[24px] p-5 shadow-lg">
            <h3 className="text-sm font-bold font-heading text-[#fbbf24] mb-3.5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#fbbf24]" />
              <span>الوصول السريع للأقسام</span>
            </h3>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigateTab('students')}
                className="w-full p-3 rounded-2xl bg-[#022c22]/70 hover:bg-[#022c22] border border-[#065f46] flex items-center justify-between text-right transition-all text-xs font-bold text-[#f0f9f6] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center border border-[#fbbf24]/30">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>إدارة الطلاب وتسجيلهم</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-[#86efac]" />
              </button>

              <button
                onClick={() => onNavigateTab('parents')}
                className="w-full p-3 rounded-2xl bg-[#022c22]/70 hover:bg-[#022c22] border border-[#065f46] flex items-center justify-between text-right transition-all text-xs font-bold text-[#f0f9f6] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#86efac] flex items-center justify-center border border-emerald-500/30">
                    <Send className="w-4 h-4" />
                  </div>
                  <span>إرسال رسائل الواتساب لأولياء الأمور</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-[#86efac]" />
              </button>

              <button
                onClick={() => onNavigateTab('reports')}
                className="w-full p-3 rounded-2xl bg-[#022c22]/70 hover:bg-[#022c22] border border-[#065f46] flex items-center justify-between text-right transition-all text-xs font-bold text-[#f0f9f6] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center border border-[#fbbf24]/30">
                    <Award className="w-4 h-4" />
                  </div>
                  <span>التقارير الأسبوعية والشهرية</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-[#86efac]" />
              </button>

              <button
                onClick={() => onNavigateTab('aicoach')}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#fbbf24]/15 to-[#064e3b] hover:from-[#fbbf24]/25 hover:to-[#064e3b] border border-[#fbbf24]/40 flex items-center justify-between text-right transition-all text-xs font-bold text-[#fbbf24] cursor-pointer shadow-[0_0_15px_rgba(251,191,36,0.15)]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#fbbf24] text-[#064e3b] flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>استشارة الذكاء الاصطناعي القرآني</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-[#fbbf24]" />
              </button>
            </div>
          </div>

          {/* Reciter Recommendation Spotlight */}
          <div className="bg-gradient-to-br from-[#064e3b] to-[#022c22] border border-[#fbbf24]/30 rounded-[24px] p-5 shadow-lg">
            <div className="flex items-center gap-2 text-[#fbbf24] text-xs font-bold mb-2">
              <Volume2 className="w-4 h-4" />
              <span>القارئ الموصى به اليوم للحلقة</span>
            </div>
            <h4 className="text-sm font-bold text-white">الشيخ محمود خليل الحصري (المصحف المعلم)</h4>
            <p className="text-xs text-[#86efac]/90 mt-1 leading-relaxed">
              يوصي الذكاء الاصطناعي بتشغيل سورة البقرة وقصار السور بصوت الشيخ الحصري لترسيخ مخارج الحروف وأحكام الإدغام والغنة قبل الحفظ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
