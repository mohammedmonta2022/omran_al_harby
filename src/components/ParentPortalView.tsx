import React from 'react';
import {
  BookOpen,
  Sparkles,
  Award,
  Volume2,
  Share2,
  LogOut
} from 'lucide-react';
import { Student, AttendanceRecord, StudentEvaluation, AppSettings } from '../types';

interface ParentPortalViewProps {
  student: Student;
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  settings: AppSettings;
  isLoggedInStudent?: boolean;
  onLogout?: () => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  student,
  attendance,
  evaluations,
  settings,
  isLoggedInStudent,
  onLogout
}) => {
  const studentAttendance = attendance.filter(a => a.studentId === student.id);
  const studentEvaluations = evaluations.filter(e => e.studentId === student.id);

  const presentsCount = studentAttendance.filter(a => a.status === 'حاضر').length;
  const attendanceRate =
    studentAttendance.length > 0
      ? Math.round((presentsCount / studentAttendance.length) * 100)
      : 100;

  const latestEvaluation = studentEvaluations.length > 0 ? studentEvaluations[studentEvaluations.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#022c22] text-[#f0f9f6] p-4 sm:p-6 lg:p-8 relative z-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Portal Header */}
        <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 flex items-center justify-between gap-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#064e3b] flex items-center justify-center border border-[#fbbf24]/40 shadow-lg font-black">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-heading text-white flex items-center gap-2">
                بوابة المتابعة الحية لطلاب القرآن الكريم
              </h1>
              <p className="text-xs text-[#fbbf24] font-bold">
                {settings.halaqahName} • إشراف: {settings.teacherName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedInStudent && onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2.5 rounded-2xl bg-[#022c22] hover:bg-red-500/15 border border-[#065f46] text-[#86efac] hover:text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            )}
          </div>
        </div>

        {/* Student Profile Card Hero */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#064e3b] border border-[#fbbf24]/40 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#064e3b] text-2xl font-black font-heading flex items-center justify-center shadow-lg border border-[#fbbf24]/40 shrink-0">
                {student.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
                    {student.name}
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] text-xs font-bold border border-[#fbbf24]/30">
                    مستوى {student.level}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#f0f9f6]/90 mt-1">
                  موضع الحفظ الحالي: <strong className="text-[#fbbf24]">سورة {student.currentSurahName} (الآية {student.currentAyah})</strong>
                </p>
                <p className="text-xs text-[#86efac]/80 mt-0.5">
                  ولي الأمر: {student.parentName}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 bg-[#022c22] sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-[#065f46]">
              <span className="text-xs text-[#86efac]">نسبة التزام الحضور:</span>
              <span className="text-2xl sm:text-3xl font-black text-[#fbbf24] font-heading">
                {attendanceRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Today's AI Assignment Box */}
        <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-8 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#fbbf24]" />
              <span>الورد اليومي المطلوب (خطة الذكاء الاصطناعي)</span>
            </h3>
            <span className="text-xs px-3 py-1 rounded-xl bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/30">
              محدثة لليوم
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#022c22] border border-[#065f46]">
              <span className="text-xs font-bold text-[#fbbf24] block mb-1">
                الحفظ الجديد المقرر لليوم:
              </span>
              <span className="text-base font-bold text-white font-heading">
                {student.aiPlan?.currentDailyAssignment?.newMemorization ||
                  `سورة ${student.currentSurahName} (الآيات القادمة)`}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#022c22] border border-[#065f46]">
              <span className="text-xs font-bold text-[#86efac] block mb-1">
                المراجعة والتثبيت المقررة:
              </span>
              <span className="text-base font-bold text-white font-heading">
                {student.aiPlan?.currentDailyAssignment?.review ||
                  `مراجعة السور السابقة`}
              </span>
            </div>
          </div>

          {student.aiPlan?.currentDailyAssignment?.suggestedSheikh && (
            <div className="p-4 rounded-2xl bg-[#022c22] border border-[#065f46] flex items-center gap-3 text-xs text-[#f0f9f6]">
              <Volume2 className="w-5 h-5 text-[#fbbf24] shrink-0" />
              <div>
                <span className="font-semibold text-[#86efac] block">القارئ المقترح للاستماع بالمنزل:</span>
                <span className="font-bold text-[#fbbf24] text-sm">
                  {student.aiPlan.currentDailyAssignment.suggestedSheikh}
                </span>
              </div>
            </div>
          )}

          {student.aiPlan?.currentDailyAssignment?.dailyNote && (
            <div className="p-4 rounded-2xl bg-[#022c22] border border-[#065f46] text-xs text-[#86efac]">
              <strong className="text-[#fbbf24]">توجيه منزلي مبارك: </strong>
              {student.aiPlan.currentDailyAssignment.dailyNote}
            </div>
          )}
        </div>

        {/* Latest Evaluation & Recitation Result */}
        {latestEvaluation && (
          <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 space-y-4 shadow-xl backdrop-blur-md">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#fbbf24]" />
              <span>آخر تقييم وتسميع معتمد في الحلقة ({latestEvaluation.date})</span>
            </h3>

            <div className="p-5 rounded-2xl bg-[#022c22] border border-[#065f46] space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-200">
                <span className="text-[#86efac]">ما تم تسميعه:</span>
                <span className="font-bold text-[#fbbf24]">
                  {latestEvaluation.recitationDetails?.newMemorizationAchieved}
                </span>
              </div>

              {latestEvaluation.recitationDetails?.teacherNotes && (
                <div className="text-[#f0f9f6] pt-2 border-t border-[#065f46]">
                  <span className="text-[#fbbf24] font-bold">ملاحظات المعلم: </span>
                  {latestEvaluation.recitationDetails.teacherNotes}
                </div>
              )}

              {latestEvaluation.aiFeedback?.analysis && (
                <div className="p-3.5 rounded-2xl bg-[#064e3b]/50 border border-[#065f46] text-[#f0f9f6]">
                  <span className="text-[#86efac] font-bold block mb-1">التحليل القرآني الذكي:</span>
                  <p>{latestEvaluation.aiFeedback.analysis}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
