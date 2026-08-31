import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Sparkles,
  Send,
  Printer,
  Copy,
  Check,
  CheckCircle,
  FileText,
  User,
  Sliders,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { Student, AttendanceRecord, StudentEvaluation, AppSettings } from '../../types';

interface ReportsTabProps {
  students: Student[];
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => Promise<void>;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  students,
  attendance,
  evaluations,
  settings,
  onUpdateSettings
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students.length > 0 ? students[0].id : ''
  );
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [workDays, setWorkDays] = useState<number>(settings.workDaysPerWeek || 5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleSaveWorkDays = async (days: number) => {
    setWorkDays(days);
    const names =
      days === 4
        ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء']
        : ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    await onUpdateSettings({
      ...settings,
      workDaysPerWeek: days,
      workDaysNames: names
    });
  };

  // Generate Report with Gemini AI
  const handleGenerateReport = async () => {
    if (!selectedStudent) return;
    setIsGenerating(true);

    // Filter relevant attendance & evaluation
    const studentAttendance = attendance.filter(a => a.studentId === selectedStudent.id);
    const studentEvaluations = evaluations.filter(e => e.studentId === selectedStudent.id);

    const totalDays = studentAttendance.length || 1;
    const presents = studentAttendance.filter(a => a.status === 'حاضر').length;
    const absents = studentAttendance.filter(a => a.status === 'غائب').length;
    const excuseds = studentAttendance.filter(a => a.status === 'معتذر').length;
    const attendancePercentage = Math.round((presents / totalDays) * 100);

    const attendanceSummary = {
      totalDaysRecorded: totalDays,
      presents,
      absents,
      excuseds,
      attendancePercentage: `${attendancePercentage}%`
    };

    const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/?portal=${selectedStudent.id}` : '';
    const periodLabel = reportType === 'monthly' ? 'الشهري' : 'الأسبوعي';

    // Instant calculated fallback report data
    const localReport = {
      summary: `تقرير ${periodLabel} للطالب ${selectedStudent.name}`,
      achievementsText: `أتم الطالب حفظ وتسميع السور المقررة بمستوى ${selectedStudent.level}، وسجل حضوراً لـ ${presents} يوماً بحلقة القرآن الكريم مع الالتزام بالمراجعة المستمرة.`,
      tajweedAssessment: 'أداء صوتي طيب مع إتقان المدود الأساسية وأحكام النون والميم الساكنتين ومخارج الحروف.',
      recommendations: 'الاستمرار في الاستماع اليومي للمصحف المعلم بمعدل 15 دقيقة والتكرار المنزلي مع المتابعة الأسرية.',
      whatsappText: `السلام عليكم ورحمة الله وبركاته 🌿\nيسرنا في *${settings.halaqahName || 'حلقة القرآن الكريم'}* مشاركتكم التقرير ${periodLabel} للطالب النجيب / *${selectedStudent.name}*.\n📊 نسبة الحضور: *${attendancePercentage}%* (${presents} يوم حضور)\n✨ المحفوظ الحالي: سورة ${selectedStudent.currentSurahName}\n🔗 للاطلاع على التقرير التفصيلي وملف الطالب الحي عبر الرابط:\n${portalUrl}\nمع تحيات المعلم المشرف: *${settings.teacherName || 'الشيخ محمد منتصر'}*`,
      attendanceSummary
    };

    setReportData(localReport);

    try {
      const res = await fetch('/api/gemini/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: selectedStudent,
          reportType,
          attendanceSummary,
          evaluationList: studentEvaluations.slice(-8),
          halaqahName: settings.halaqahName,
          teacherName: settings.teacherName,
          clientPortalUrl: portalUrl
        })
      });

      const data = await res.json();
      if (data && (data.achievementsText || data.summary)) {
        setReportData({
          ...data,
          attendanceSummary
        });
      }
    } catch (e) {
      console.warn('Using local generated report:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendWhatsApp = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Settings */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#fbbf24]" />
            <span>التقارير الشاملة وجداول الدوام</span>
          </h2>
          <p className="text-xs text-[#86efac]/90 mt-1">
            إصدار تقارير دورية بالذكاء الاصطناعي وإرسالها بروابط حية لأولياء الأمور
          </p>
        </div>

        {/* Schedule settings */}
        <div className="flex items-center gap-2 bg-[#022c22] border border-[#065f46] px-3.5 py-2 rounded-2xl text-xs">
          <span className="text-[#86efac] font-bold">أيام الدوام بالحلقة:</span>
          <button
            onClick={() => handleSaveWorkDays(4)}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              workDays === 4
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-sm'
                : 'text-[#86efac]/60 hover:text-white'
            }`}
          >
            4 أيام (أحد-أربعاء)
          </button>
          <button
            onClick={() => handleSaveWorkDays(5)}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              workDays === 5
                ? 'bg-[#fbbf24] text-[#064e3b] shadow-sm'
                : 'text-[#86efac]/60 hover:text-white'
            }`}
          >
            5 أيام (أحد-خميس)
          </button>
        </div>
      </div>

      {/* Control Panel: Student & Period Selector */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-7 space-y-4 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#86efac] mb-2 text-right">
              اختر الطالب لإصدار التقرير:
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-3 px-4 text-xs sm:text-sm text-[#f0f9f6] outline-none"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (مستوى: {s.level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#86efac] mb-2 text-right">
              نوع التقرير:
            </label>
            <div className="flex bg-[#022c22] p-1 rounded-2xl border border-[#065f46]">
              <button
                type="button"
                onClick={() => setReportType('weekly')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  reportType === 'weekly'
                    ? 'bg-[#fbbf24] text-[#064e3b] shadow-sm'
                    : 'text-[#86efac]/70 hover:text-white'
                }`}
              >
                تقرير أسبوعي
              </button>
              <button
                type="button"
                onClick={() => setReportType('monthly')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  reportType === 'monthly'
                    ? 'bg-[#fbbf24] text-[#064e3b] shadow-sm'
                    : 'text-[#86efac]/70 hover:text-white'
                }`}
              >
                تقرير شهري
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || !selectedStudent}
              className="w-full py-3 px-4 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-[#064e3b] text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(251,191,36,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isGenerating ? (
                <span>جاري معالجة وتوليد التقرير...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#064e3b]" />
                  <span>توليد التقرير بالذكاء الاصطناعي</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report Display Card */}
      {reportData && selectedStudent && (
        <div className="bg-[#064e3b]/70 border border-[#fbbf24]/40 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
          {/* Header of Report */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#065f46]">
            <div>
              <span className="text-xs px-3.5 py-1 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/30">
                {reportType === 'monthly' ? 'التقرير الشهري الشامل' : 'التقرير الأسبوعي المفصل'}
              </span>
              <h3 className="text-xl font-bold font-heading text-white mt-2">
                تقرير الطالب: {selectedStudent.name}
              </h3>
              <p className="text-xs text-[#86efac]/80 mt-0.5">
                {settings.halaqahName} • المشرف: {settings.teacherName}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-2xl bg-[#022c22] hover:bg-[#065f46] text-[#86efac] hover:text-white border border-[#065f46] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#fbbf24]" />
                <span>طباعة التقرير</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#022c22] p-4 rounded-2xl border border-[#065f46] text-center">
              <span className="text-[11px] text-[#86efac] block mb-1">نسبة الحضور</span>
              <span className="text-xl font-black text-[#fbbf24] font-heading">
                {reportData.attendanceSummary?.attendancePercentage}
              </span>
            </div>
            <div className="bg-[#022c22] p-4 rounded-2xl border border-[#065f46] text-center">
              <span className="text-[11px] text-[#86efac] block mb-1">أيام الحضور</span>
              <span className="text-xl font-black text-white font-heading">
                {reportData.attendanceSummary?.presents} يوم
              </span>
            </div>
            <div className="bg-[#022c22] p-4 rounded-2xl border border-[#065f46] text-center">
              <span className="text-[11px] text-[#86efac] block mb-1">الغياب / الأعذار</span>
              <span className="text-xl font-black text-amber-300 font-heading">
                {reportData.attendanceSummary?.absents + reportData.attendanceSummary?.excuseds} يوم
              </span>
            </div>
            <div className="bg-[#022c22] p-4 rounded-2xl border border-[#065f46] text-center">
              <span className="text-[11px] text-[#86efac] block mb-1">المستوى والتقييم</span>
              <span className="text-xl font-black text-[#86efac] font-heading">
                {selectedStudent.level}
              </span>
            </div>
          </div>

          {/* Report Content Sections */}
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-5 rounded-2xl bg-[#022c22] border border-[#065f46]">
              <h4 className="font-bold text-[#fbbf24] mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#fbbf24]" />
                <span>إنجازات الحفظ والمراجعة خلال هذه الفترة:</span>
              </h4>
              <p className="text-[#f0f9f6] leading-relaxed">{reportData.achievementsText}</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#022c22] border border-[#065f46]">
              <h4 className="font-bold text-[#86efac] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#86efac]" />
                <span>تقييم التجويد والأداء الصوتي:</span>
              </h4>
              <p className="text-[#f0f9f6]/90 leading-relaxed">{reportData.tajweedAssessment}</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#022c22] border border-[#065f46]">
              <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-white" />
                <span>توجيهات ونصائح لولي الأمر والمنزل:</span>
              </h4>
              <p className="text-[#f0f9f6]/90 leading-relaxed">{reportData.recommendations}</p>
            </div>
          </div>

          {/* WhatsApp Report Dispatch */}
          <div className="bg-[#022c22] p-5 sm:p-6 rounded-2xl border border-[#065f46] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#fbbf24] flex items-center gap-1.5">
                <Send className="w-4 h-4" />
                <span>رسالة الواتساب الجاهزة للإرسال لولي الأمر:</span>
              </h4>
              <button
                onClick={() => handleCopy(reportData.whatsappText)}
                className="text-xs px-3 py-1.5 rounded-xl bg-[#064e3b] text-[#86efac] hover:text-white border border-[#065f46] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-[#fbbf24]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            </div>

            <div className="p-4 bg-[#064e3b]/50 rounded-2xl text-xs text-[#f0f9f6] whitespace-pre-line leading-relaxed border border-[#065f46]">
              {reportData.whatsappText}
            </div>

            {/* Direct Send Buttons for Parent Phones */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {selectedStudent.parentPhones && selectedStudent.parentPhones.length > 0 ? (
                selectedStudent.parentPhones.map((phone, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendWhatsApp(phone, reportData.whatsappText)}
                    className="px-4 py-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال للرقم: {phone}</span>
                  </button>
                ))
              ) : (
                <button
                  onClick={() => handleSendWhatsApp(selectedStudent.phone, reportData.whatsappText)}
                  className="px-4 py-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال لرقم الطالب</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
