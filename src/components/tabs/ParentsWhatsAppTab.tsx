import React, { useState, useEffect } from 'react';
import {
  Send,
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  Phone,
  User,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  Edit,
  ExternalLink,
  RefreshCw,
  Search
} from 'lucide-react';
import { Student, AttendanceRecord, StudentEvaluation, AppSettings } from '../../types';

interface ParentsWhatsAppTabProps {
  students: Student[];
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  settings: AppSettings;
  preselectedStudentId?: string;
}

export const ParentsWhatsAppTab: React.FC<ParentsWhatsAppTabProps> = ({
  students,
  attendance,
  evaluations,
  settings,
  preselectedStudentId
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generated messages map: studentId -> message string
  const [messagesMap, setMessagesMap] = useState<Record<string, string>>({});
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Helper to generate instant, complete and rich message
  const buildFullMessage = (student: Student, status: string, evalData?: StudentEvaluation): string => {
    const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/?portal=${student.id}` : '';
    
    // Today recited details
    const todayNewRecited = evalData?.recitationDetails?.newMemorizationAchieved || 
      (student.aiPlan?.currentDailyAssignment?.newMemorization ? `أتم تسميع ${student.aiPlan.currentDailyAssignment.newMemorization} بإتقان` : `سورة ${student.currentSurahName} (الآية ${student.currentAyah})`);
    
    const todayReviewRecited = evalData?.recitationDetails?.reviewAchieved || 
      (student.aiPlan?.currentDailyAssignment?.review ? `أتم مراجعة ${student.aiPlan.currentDailyAssignment.review}` : `مراجعة السور المقررة وتثبيتها`);
    
    const teacherNotes = evalData?.recitationDetails?.teacherNotes || (status === 'حاضر' ? 'أداء طيب ومبارك، نسأل الله له الثبات والرفعة' : 'نرجو المتابعة والتواصل مع المعلم');

    // Tomorrow targets
    const tomorrowNew = student.aiPlan?.currentDailyAssignment?.newMemorization || `سورة ${student.currentSurahName} (مواصلة الورد المقرر)`;
    const tomorrowReview = student.aiPlan?.currentDailyAssignment?.review || `مراجعة المحفوظ السابق والتثبيت`;
    const sheikh = student.aiPlan?.currentDailyAssignment?.suggestedSheikh || 'الشيخ المنشاوي (المصحف المعلم)';
    const homeNote = student.aiPlan?.currentDailyAssignment?.dailyNote || 'الاستماع للقارئ وتكرار الورد 3 مرات مع التثبيت قبل النوم.';

    let msg = `السلام عليكم ورحمة الله وبركاته 🌿\n`;
    msg += `المكرم ولي أمر الطالب العزيز / *${student.name}* حفظه الله\n`;
    msg += `نحيطكم علماً بتقرير متابعة الطالب في *${settings.halaqahName || 'حلقة القرآن الكريم'}* ليوم ${new Date().toLocaleDateString('ar-SA')}:\n\n`;
    
    msg += `📌 *حالة الحضور اليوم:* ${status}\n\n`;

    msg += `📖 *ما تم تسميعه وإنجازه اليوم بالتفصيل:*\n`;
    msg += `🔹 *الحفظ الجديد اليوم:* ${todayNewRecited}\n`;
    msg += `🔹 *المراجعة والتثبيت اليوم:* ${todayReviewRecited}\n`;
    if (evalData?.aiFeedback?.studentProgressStatus) {
      msg += `⭐ *حالة التقدم:* ${evalData.aiFeedback.studentProgressStatus}\n`;
    }
    msg += `💡 *ملاحظات وتوجيه المعلم:* ${teacherNotes}\n\n`;

    msg += `🎯 *المقرر المطلوب تسميعه وحفظه لغدٍ بإذن الله تعالى:*\n`;
    msg += `✨ *ورد الحفظ الجديد لغد:* ${tomorrowNew}\n`;
    msg += `🔄 *ورد المراجعة والتثبيت لغد:* ${tomorrowReview}\n`;
    msg += `🎧 *القارئ المقترح للاستماع له بالمنزل:* ${sheikh}\n`;
    msg += `📝 *توجيه المتابعة المنزلية:* ${homeNote}\n\n`;

    msg += `🔗 *لمتابعة ملف الطالب وخطة حفظه اليومية مباشرة عبر البوابة الحية، اضغط على الرابط:* \n`;
    msg += `${portalUrl}\n\n`;
    msg += `جزاكم الله خيراً وبارك في أبنائنا الكرام 🤲\n`;
    msg += `معلم الحلقة: *${settings.teacherName || 'الشيخ محمد منتصر'}*`;

    return msg;
  };

  // Generate single message
  const generateMessageForStudent = async (student: Student) => {
    const todayAtt = attendance.find(
      a => a.date === todayStr && a.studentId === student.id
    );
    const status = todayAtt?.status || 'حاضر';
    const evalData = evaluations.find(
      e => e.date === todayStr && e.studentId === student.id
    );
    const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/?portal=${student.id}` : '';

    // First, set instant rich fallback
    const instantMsg = buildFullMessage(student, status, evalData);
    setMessagesMap(prev => ({
      ...prev,
      [student.id]: instantMsg
    }));

    try {
      const res = await fetch('/api/gemini/generate-whatsapp-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          attendanceStatus: status,
          evaluation: evalData,
          halaqahName: settings.halaqahName,
          teacherName: settings.teacherName,
          clientPortalUrl: portalUrl
        })
      });
      const data = await res.json();
      if (data.message) {
        setMessagesMap(prev => ({
          ...prev,
          [student.id]: data.message
        }));
      }
    } catch (e) {
      console.warn('Using local formatted WhatsApp message:', e);
    }
  };

  // Generate for all students
  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    for (const s of students) {
      await generateMessageForStudent(s);
    }
    setIsGeneratingAll(false);
  };

  // Initialize messages on load
  useEffect(() => {
    if (students.length > 0) {
      // Auto-generate for preselected or first few
      students.forEach(s => {
        if (!messagesMap[s.id]) {
          generateMessageForStudent(s);
        }
      });
    }
  }, [students, attendance, evaluations]);

  const handleCopy = (studentId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(studentId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendWhatsApp = (phone: string, text: string) => {
    // Format phone: remove non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleOpenEdit = (studentId: string) => {
    setEditingStudentId(studentId);
    setEditingText(messagesMap[studentId] || '');
  };

  const handleSaveEdit = () => {
    if (editingStudentId) {
      setMessagesMap(prev => ({
        ...prev,
        [editingStudentId]: editingText
      }));
      setEditingStudentId(null);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#fbbf24]" />
            <span>رسائل الواتساب اليومية لأولياء الأمور</span>
          </h2>
          <p className="text-xs text-[#86efac]/90 mt-1">
            صياغة رسائل راقية بالذكاء الاصطناعي مع تقارير الحضور والتسميع وروابط البوابة الحية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateAll}
            disabled={isGeneratingAll}
            className="px-5 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-[#064e3b] text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#064e3b]" />
            <span>{isGeneratingAll ? 'جاري توليد جميع الرسائل...' : 'تحديث وتوليد الكل بالذكاء الاصطناعي'}</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="بحث باسم الطالب أو ولي الأمر..."
          className="w-full bg-[#064e3b]/60 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-3 px-4 pr-11 text-xs sm:text-sm text-[#f0f9f6] placeholder-[#86efac]/40 outline-none backdrop-blur-md"
          dir="rtl"
        />
        <Search className="w-4 h-4 text-[#86efac]/60 absolute right-4 top-3.5" />
      </div>

      {/* Student Cards List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-12 text-center text-[#86efac]/60 text-xs backdrop-blur-md">
            لا يوجد طلاب مطابقون.
          </div>
        ) : (
          filteredStudents.map(student => {
            const todayAtt = attendance.find(
              a => a.date === todayStr && a.studentId === student.id
            );
            const status = todayAtt?.status || 'لم يسجل';
            const evalData = evaluations.find(
              e => e.date === todayStr && e.studentId === student.id
            );
            const msg = messagesMap[student.id] || 'جاري تجهيز الرسالة الذكية...';
            const isCopied = copiedId === student.id;

            return (
              <div
                key={student.id}
                className="bg-[#064e3b]/60 border border-[#065f46] hover:border-[#fbbf24]/50 rounded-[32px] p-6 transition-all shadow-xl backdrop-blur-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Info: Student & Parent Profile */}
                  <div className="lg:w-1/3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#064e3b] flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{student.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#86efac]/80">
                          <span>ولي الأمر: {student.parentName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#022c22] border border-[#065f46] rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[#86efac]">حضور اليوم:</span>
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded-xl ${
                            status === 'حاضر'
                              ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                              : status === 'غائب'
                              ? 'bg-red-500/20 text-red-300'
                              : status === 'معتذر'
                              ? 'bg-emerald-500/20 text-[#86efac]'
                              : 'bg-[#064e3b] text-[#86efac]/60'
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[#86efac]">تسميع اليوم:</span>
                        <span className="font-bold text-[#fbbf24]">
                          {evalData ? 'تم التقييم بنجاح' : 'لم يقيّم بعد'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[#86efac]">مقرر الغد:</span>
                        <span className="text-white font-bold truncate max-w-[150px]">
                          {student.aiPlan?.currentDailyAssignment?.newMemorization || 'غير محدد'}
                        </span>
                      </div>
                    </div>

                    {/* Parent Phone Numbers List with Direct Send */}
                    <div>
                      <div className="text-[11px] font-bold text-[#86efac] mb-1.5">
                        أرقام هواتف أولياء الأمور للإرسال:
                      </div>
                      <div className="space-y-2">
                        {student.parentPhones && student.parentPhones.length > 0 ? (
                          student.parentPhones.map((phone, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#022c22] border border-[#065f46] text-xs"
                            >
                              <div className="flex items-center gap-1.5 text-slate-300" dir="ltr">
                                <Phone className="w-3.5 h-3.5 text-[#fbbf24]" />
                                <span>{phone}</span>
                              </div>
                              <button
                                onClick={() => handleSendWhatsApp(phone, msg)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                              >
                                <Send className="w-3 h-3" />
                                <span>إرسال واتساب</span>
                              </button>
                            </div>
                          ))
                        ) : (
                          <div
                            className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#022c22] border border-[#065f46] text-xs"
                          >
                            <span className="text-[#86efac]" dir="ltr">{student.phone}</span>
                            <button
                              onClick={() => handleSendWhatsApp(student.phone, msg)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Send className="w-3 h-3" />
                              <span>إرسال</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Box: Formatted Message Box */}
                  <div className="lg:w-2/3 flex flex-col justify-between bg-[#022c22] border border-[#065f46] rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#065f46] pb-2">
                      <span className="text-xs font-bold text-[#fbbf24] flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>نص الرسالة المصاغة بالذكاء الاصطناعي</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateMessageForStudent(student)}
                          title="إعادة الصياغة بالذكاء الاصطناعي"
                          className="p-1.5 rounded-xl text-[#86efac] hover:text-[#fbbf24] hover:bg-[#064e3b] cursor-pointer transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student.id)}
                          title="تعديل نص الرسالة يدوياً"
                          className="p-1.5 rounded-xl text-[#86efac] hover:text-[#fbbf24] hover:bg-[#064e3b] cursor-pointer transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(student.id, msg)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            isCopied
                              ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                              : 'bg-[#064e3b] text-[#86efac] hover:text-white border border-[#065f46]'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#fbbf24]" />
                              <span>تم النسخ!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Message Preview */}
                    <div className="bg-[#064e3b]/40 rounded-2xl p-4 text-xs text-[#f0f9f6] whitespace-pre-line leading-relaxed font-sans border border-[#065f46] max-h-56 overflow-y-auto">
                      {msg}
                    </div>

                    <div className="text-[11px] text-[#86efac]/70 flex items-center justify-between pt-1">
                      <span>الرابط المرفق: بوابة المتابعة الحية للطالب</span>
                      <a
                        href={`/?portal=${student.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#fbbf24] hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>معاينة صفحة الطالب</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Edit Message Modal */}
      {editingStudentId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#064e3b] border border-[#fbbf24]/40 rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#fbbf24] font-heading">
              تعديل نص رسالة الواتساب
            </h3>
            <textarea
              rows={8}
              value={editingText}
              onChange={e => setEditingText(e.target.value)}
              className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl p-3.5 text-xs text-[#f0f9f6] outline-none resize-none"
              dir="rtl"
            />
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setEditingStudentId(null)}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#86efac] hover:bg-[#022c22] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] text-xs font-black shadow-md cursor-pointer"
              >
                حفظ النص المعدل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
