import React, { useState } from 'react';
import {
  Star,
  BookOpen,
  Sparkles,
  Award,
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
  AlertCircle,
  Clock,
  Volume2,
  Sliders,
  ChevronRight,
  TrendingUp,
  X,
  History,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Student,
  AttendanceRecord,
  StudentEvaluation,
  EvaluationCriteria,
  CriteriaType
} from '../../types';

interface EvaluationTabProps {
  students: Student[];
  attendance: AttendanceRecord[];
  evaluations: StudentEvaluation[];
  criteria: EvaluationCriteria[];
  selectedStudentId?: string;
  onSaveEvaluation: (evaluation: StudentEvaluation) => Promise<void>;
  onSaveCriteria: (criteriaList: EvaluationCriteria[]) => Promise<void>;
  onDeleteCriteria: (id: string) => Promise<void>;
  onUpdateStudentAIPlan: (studentId: string, newAssignment: any) => Promise<void>;
  onNavigateToWhatsApp?: (studentId: string) => void;
}

export const EvaluationTab: React.FC<EvaluationTabProps> = ({
  students,
  attendance,
  evaluations,
  criteria,
  selectedStudentId,
  onSaveEvaluation,
  onSaveCriteria,
  onDeleteCriteria,
  onUpdateStudentAIPlan,
  onNavigateToWhatsApp
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Active student selection
  const [activeStudentId, setActiveStudentId] = useState<string>(
    selectedStudentId || (students.length > 0 ? students[0].id : '')
  );

  // Criteria values state: criteriaId -> value
  const [criteriaValues, setCriteriaValues] = useState<Record<string, any>>({});
  const [newAchieved, setNewAchieved] = useState<string>('أتم حفظ الورد المقرر كاملاً بإتقان');
  const [reviewAchieved, setReviewAchieved] = useState<string>('أتم المراجعة والتثبيت بنجاح');
  const [teacherNotes, setTeacherNotes] = useState<string>('');
  
  // Criteria management modal (Add & Edit)
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [editingCriteriaId, setEditingCriteriaId] = useState<string | null>(null);
  const [critToDelete, setCritToDelete] = useState<EvaluationCriteria | null>(null);
  const [newCritName, setNewCritName] = useState('');
  const [newCritType, setNewCritType] = useState<CriteriaType>('score');
  const [newCritMaxScore, setNewCritMaxScore] = useState<number>(10);
  const [newCritOptions, setNewCritOptions] = useState<string>('ممتاز, جيد جدا, جيد, ضعيف');

  // AI Evaluation Processing & Result Modal
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [aiFeedbackResult, setAiFeedbackResult] = useState<any>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const activeStudent = students.find(s => s.id === activeStudentId);
  const todayAtt = attendance.find(
    a => a.date === todayStr && a.studentId === activeStudentId
  );
  const isAbsent = todayAtt?.status === 'غائب';
  const isExcused = todayAtt?.status === 'معتذر';

  // Load existing evaluation for today if any
  React.useEffect(() => {
    if (activeStudentId) {
      const existing = evaluations.find(
        e => e.date === todayStr && e.studentId === activeStudentId
      );
      if (existing) {
        setCriteriaValues(existing.criteriaValues || {});
        setNewAchieved(existing.recitationDetails?.newMemorizationAchieved || '');
        setReviewAchieved(existing.recitationDetails?.reviewAchieved || '');
        setTeacherNotes(existing.recitationDetails?.teacherNotes || '');
      } else {
        // Initialize defaults
        const defaults: Record<string, any> = {};
        criteria.forEach(c => {
          if (c.type === 'stars') defaults[c.id] = 5;
          if (c.type === 'score') defaults[c.id] = c.maxScore || 10;
          if (c.type === 'options' && c.options && c.options.length > 0)
            defaults[c.id] = c.options[0];
          if (c.type === 'text') defaults[c.id] = '';
        });
        setCriteriaValues(defaults);
        setNewAchieved('أتم حفظ الورد المقرر كاملاً بإتقان');
        setReviewAchieved('أتم المراجعة والتثبيت بنجاح');
        setTeacherNotes('');
      }
    }
  }, [activeStudentId, evaluations, criteria]);

  // Open modal to add new criterion
  const handleOpenAddCriteria = () => {
    setEditingCriteriaId(null);
    setNewCritName('');
    setNewCritType('score');
    setNewCritMaxScore(10);
    setNewCritOptions('ممتاز, جيد جدا, جيد, ضعيف');
    setIsCriteriaModalOpen(true);
  };

  // Open modal to edit existing criterion
  const handleOpenEditCriteria = (crit: EvaluationCriteria) => {
    setEditingCriteriaId(crit.id);
    setNewCritName(crit.name);
    setNewCritType(crit.type);
    setNewCritMaxScore(crit.maxScore || 10);
    setNewCritOptions(crit.options ? crit.options.join(', ') : 'ممتاز, جيد جدا, جيد, ضعيف');
    setIsCriteriaModalOpen(true);
  };

  // Handle Criteria Add or Edit Submission
  const handleSaveCriteriaForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritName.trim()) return;

    if (editingCriteriaId) {
      // Edit mode
      const updated = criteria.map(c => {
        if (c.id === editingCriteriaId) {
          return {
            ...c,
            name: newCritName.trim(),
            type: newCritType,
            maxScore: newCritType === 'score' ? Number(newCritMaxScore) : undefined,
            options:
              newCritType === 'options'
                ? newCritOptions.split(',').map(o => o.trim()).filter(o => o.length > 0)
                : undefined
          };
        }
        return c;
      });
      await onSaveCriteria(updated);
    } else {
      // Add mode
      const newCrit: EvaluationCriteria = {
        id: `crit_${Date.now()}`,
        name: newCritName.trim(),
        type: newCritType,
        maxScore: newCritType === 'score' ? Number(newCritMaxScore) : undefined,
        options:
          newCritType === 'options'
            ? newCritOptions.split(',').map(o => o.trim()).filter(o => o.length > 0)
            : undefined,
        isDefault: false
      };
      const updated = [...criteria, newCrit];
      await onSaveCriteria(updated);
    }

    setNewCritName('');
    setEditingCriteriaId(null);
    setIsCriteriaModalOpen(false);
  };

  // Submit Evaluation with Gemini AI Processing
  const handleSaveEvaluation = async () => {
    if (!activeStudent) return;
    setIsEvaluatingAI(true);
    setSaveSuccessMsg('');

    try {
      const evaluationPayload: Partial<StudentEvaluation> = {
        id: `eval_${todayStr}_${activeStudent.id}`,
        date: todayStr,
        studentId: activeStudent.id,
        criteriaValues,
        recitationDetails: {
          newMemorizationAchieved: newAchieved,
          reviewAchieved: reviewAchieved,
          teacherNotes: teacherNotes
        },
        evaluatedAt: new Date().toISOString()
      };

      // Call Backend to evaluate with AI
      const res = await fetch('/api/gemini/evaluate-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: activeStudent,
          evaluation: evaluationPayload,
          currentPlan: activeStudent.aiPlan
        })
      });

      const data = await res.json();
      const feedback = data.feedback;

      const finalEvaluation: StudentEvaluation = {
        ...(evaluationPayload as StudentEvaluation),
        aiFeedback: feedback
      };

      await onSaveEvaluation(finalEvaluation);

      // If AI produced a nextDayPlan, update the student's daily assignment
      if (feedback?.nextDayPlan) {
        await onUpdateStudentAIPlan(activeStudent.id, feedback.nextDayPlan);
      }

      setAiFeedbackResult(feedback);
      setSaveSuccessMsg('تم حفظ التقييم وتحديث خطة الغد بالذكاء الاصطناعي بنجاح!');

      // Confetti celebration
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e: any) {
      console.error('Save evaluation error:', e);
      setSaveSuccessMsg('حدث خطأ أثناء تقييم الذكاء الاصطناعي.');
    } finally {
      setIsEvaluatingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Criteria Ribbon & Management Bar */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#fbbf24]" />
              <span>معايير التقييم الحالية للحلقة</span>
            </h3>
            <p className="text-xs text-[#86efac]/90 mt-1">
              يمكنك تخصيص وتعديل المعايير (درجات، نجوم، خيارات، نصوص) في أي وقت
            </p>
          </div>

          <button
            onClick={handleOpenAddCriteria}
            className="px-4 py-2.5 rounded-2xl bg-[#022c22] hover:bg-[#022c22]/80 border border-[#065f46] text-[#fbbf24] text-xs font-black flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة معيار تقييم جديد</span>
          </button>
        </div>

        {/* Criteria Pills List */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-[#065f46]">
          {criteria.map(crit => (
            <div
              key={crit.id}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#022c22] border border-[#065f46] text-xs text-[#f0f9f6] hover:border-[#fbbf24]/40 transition-all"
            >
              <span className="font-bold">{crit.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-xl bg-[#064e3b] text-[#fbbf24] font-mono">
                {crit.type === 'stars'
                  ? '⭐⭐⭐⭐⭐ (5 نجوم)'
                  : crit.type === 'score'
                  ? `درجة من / ${crit.maxScore || 10}`
                  : crit.type === 'options'
                  ? `خيارات (${crit.options?.length || 0})`
                  : 'ملاحظة نصية'}
              </span>
              <div className="flex items-center gap-1 border-r border-[#065f46] pr-1.5 mr-1">
                <button
                  onClick={() => handleOpenEditCriteria(crit)}
                  title="تعديل هذا المعيار"
                  className="p-1 rounded-lg text-[#86efac]/80 hover:text-[#fbbf24] hover:bg-[#064e3b] transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCritToDelete(crit)}
                  title="حذف هذا المعيار"
                  className="p-1 rounded-lg text-[#86efac]/80 hover:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Roster (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-[#fbbf24] font-heading">
              اختر الطالب للتسميع ({students.length})
            </h3>
            <span className="text-[10px] text-[#86efac]/80">حالة اليوم: {todayStr}</span>
          </div>

          <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-3 space-y-2 max-h-[600px] overflow-y-auto backdrop-blur-md">
            {students.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#86efac]/60">
                لا يوجد طلاب مسجلون حالياً.
              </div>
            ) : (
              students.map(student => {
                const att = attendance.find(
                  a => a.date === todayStr && a.studentId === student.id
                );
                const isStudentAbsent = att?.status === 'غائب';
                const isStudentExcused = att?.status === 'معتذر';
                const isSelected = student.id === activeStudentId;
                const hasEvaluatedToday = evaluations.some(
                  e => e.date === todayStr && e.studentId === student.id
                );

                return (
                  <button
                    key={student.id}
                    onClick={() => setActiveStudentId(student.id)}
                    className={`w-full p-3.5 rounded-2xl text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-[0_0_15px_rgba(251,191,36,0.3)] border border-[#fbbf24]'
                        : isStudentAbsent
                        ? 'bg-[#022c22]/40 text-[#86efac]/40 border border-[#065f46]/40 opacity-60'
                        : isStudentExcused
                        ? 'bg-[#022c22]/60 text-emerald-300 border border-[#065f46] opacity-80'
                        : 'bg-[#022c22] hover:bg-[#022c22]/80 text-[#f0f9f6] border border-[#065f46]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-[#064e3b] text-[#fbbf24]'
                            : 'bg-[#064e3b] text-[#fbbf24] border border-[#065f46]'
                        }`}
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs line-clamp-1">{student.name}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            isSelected ? 'text-[#064e3b]/80' : 'text-[#86efac]/80'
                          }`}
                        >
                          سورة {student.currentSurahName} (آية {student.currentAyah})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasEvaluatedToday && (
                        <span
                          className={`p-1 rounded-lg ${
                            isSelected ? 'bg-[#064e3b]/20 text-[#064e3b]' : 'text-[#fbbf24]'
                          }`}
                          title="تم التسميع اليوم"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                      {isStudentAbsent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-red-500/20 text-red-300 font-bold">
                          غائب
                        </span>
                      )}
                      {isStudentExcused && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/20 text-[#86efac] font-bold">
                          معتذر
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Evaluation & Smart Recitation Workspace (8 Cols) */}
        <div className="lg:col-span-8">
          {!activeStudent ? (
            <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-12 text-center text-[#86efac]/60 backdrop-blur-md">
              اختر طالباً من القائمة للبدء في تقييم التسميع
            </div>
          ) : (
            <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-8 space-y-5 shadow-xl backdrop-blur-md">
              {/* Active Student Title & Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#065f46]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#064e3b] flex items-center justify-center font-bold text-lg shadow-lg">
                    {activeStudent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-heading">
                        {activeStudent.name}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] font-bold border border-[#fbbf24]/40">
                        مستوى: {activeStudent.level}
                      </span>
                    </div>
                    <p className="text-xs text-[#86efac]/90 mt-0.5">
                      موضع الحفظ الحالي: سورة {activeStudent.currentSurahName} (الآية {activeStudent.currentAyah})
                    </p>
                  </div>
                </div>

                {isAbsent ? (
                  <div className="px-3.5 py-2 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>الطالب مسجل غائب اليوم</span>
                  </div>
                ) : isExcused ? (
                  <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-[#86efac] text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>الطالب معتذر اليوم ({todayAtt?.note || 'عذر مقبول'})</span>
                  </div>
                ) : null}
              </div>

              {/* AI Assigned Daily Plan Box */}
              <div className="bg-[#022c22] border border-[#065f46] rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#fbbf24] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                    <span>الورد المقرر من الذكاء الاصطناعي لهذا اليوم:</span>
                  </span>
                  <span className="text-[11px] text-[#86efac]/80 font-normal">
                    طاقة الطالب: {activeStudent.dailyNewTarget}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#064e3b]/50 p-3.5 rounded-2xl border border-[#065f46]">
                    <span className="text-[#86efac] font-bold block mb-1">الحفظ الجديد المقرر:</span>
                    <span className="text-white font-bold text-sm">
                      {activeStudent.aiPlan?.currentDailyAssignment?.newMemorization ||
                        `سورة ${activeStudent.currentSurahName} من آية ${activeStudent.currentAyah}`}
                    </span>
                  </div>

                  <div className="bg-[#064e3b]/50 p-3.5 rounded-2xl border border-[#065f46]">
                    <span className="text-[#86efac] font-bold block mb-1">المراجعة المقررة:</span>
                    <span className="text-[#fbbf24] font-bold text-sm">
                      {activeStudent.aiPlan?.currentDailyAssignment?.review ||
                        `مراجعة السور السابقة`}
                    </span>
                  </div>
                </div>

                {activeStudent.aiPlan?.currentDailyAssignment?.suggestedSheikh && (
                  <div className="flex items-center gap-2 text-xs text-[#86efac] bg-[#064e3b]/30 px-3.5 py-2 rounded-2xl border border-[#065f46]">
                    <Volume2 className="w-4 h-4 text-[#fbbf24] shrink-0" />
                    <span>
                      الشيخ المقترح للاستماع: <strong className="text-white">{activeStudent.aiPlan.currentDailyAssignment.suggestedSheikh}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Recitation Progress Input Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#fbbf24] font-heading flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#fbbf24]" />
                  <span>تسجيل ما سمّعه الطالب فعلياً اليوم:</span>
                </h4>

                {/* New Memorization Achieved */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#86efac] text-right">
                      ما أتمه في الحفظ الجديد:
                    </label>
                    <div className="flex gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setNewAchieved('أتم كامل الورد الجديد المقرر بإتقان')}
                        className="px-2.5 py-1 rounded-xl bg-[#022c22] border border-[#065f46] text-[#86efac] hover:text-white cursor-pointer"
                      >
                        كامل الورد
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAchieved('حفظ نصف الورد فقط ويحتاج إكمال')}
                        className="px-2.5 py-1 rounded-xl bg-[#022c22] border border-[#065f46] text-[#fbbf24] hover:text-white cursor-pointer"
                      >
                        نصف الورد
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newAchieved}
                    onChange={e => setNewAchieved(e.target.value)}
                    placeholder="اكتب الآيات المحددة التي سمّعها الطالب..."
                    className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none"
                    dir="rtl"
                  />
                </div>

                {/* Review Achieved */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#86efac] text-right">
                      ما أتمه في المراجعة والتثبيت:
                    </label>
                    <div className="flex gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setReviewAchieved('أتم كامل ورد المراجعة بإتقان')}
                        className="px-2.5 py-1 rounded-xl bg-[#022c22] border border-[#065f46] text-[#86efac] hover:text-white cursor-pointer"
                      >
                        كامل المراجعة
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAchieved('راجع جزءاً بسيطاً ويحتاج تثبيت')}
                        className="px-2.5 py-1 rounded-xl bg-[#022c22] border border-[#065f46] text-[#fbbf24] hover:text-white cursor-pointer"
                      >
                        مراجعة جزئية
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={reviewAchieved}
                    onChange={e => setReviewAchieved(e.target.value)}
                    placeholder="اكتب السور أو الصفحات التي تمت مراجعتها..."
                    className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none"
                    dir="rtl"
                  />
                </div>

                {/* Dynamic Criteria Input Grid */}
                <div className="bg-[#022c22] border border-[#065f46] rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="text-xs font-bold text-[#fbbf24]">
                    تقييم المعايير المعتمدة:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {criteria.map(crit => {
                      const val = criteriaValues[crit.id];

                      return (
                        <div key={crit.id} className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#86efac] block text-right">
                            {crit.name}:
                          </label>

                          {/* 1. Stars */}
                          {crit.type === 'stars' && (
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map(starNum => (
                                <button
                                  key={starNum}
                                  type="button"
                                  onClick={() =>
                                    setCriteriaValues(prev => ({
                                      ...prev,
                                      [crit.id]: starNum
                                    }))
                                  }
                                  className="p-1 rounded-lg transition-transform hover:scale-110 cursor-pointer"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      starNum <= (Number(val) || 5)
                                        ? 'fill-[#fbbf24] text-[#fbbf24]'
                                        : 'text-[#064e3b]'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* 2. Score */}
                          {crit.type === 'score' && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={crit.maxScore || 10}
                                value={val !== undefined ? val : crit.maxScore || 10}
                                onChange={e =>
                                  setCriteriaValues(prev => ({
                                    ...prev,
                                    [crit.id]: Number(e.target.value)
                                  }))
                                }
                                className="w-20 bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-sm text-center text-[#fbbf24] font-black outline-none"
                              />
                              <span className="text-xs text-[#86efac]">
                                / {crit.maxScore || 10} درجات
                              </span>
                            </div>
                          )}

                          {/* 3. Options */}
                          {crit.type === 'options' && crit.options && (
                            <div className="flex flex-wrap gap-1.5">
                              {crit.options.map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setCriteriaValues(prev => ({
                                      ...prev,
                                      [crit.id]: opt
                                    }))
                                  }
                                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                    val === opt
                                      ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-md'
                                      : 'bg-[#064e3b] text-[#86efac] hover:text-white border border-[#065f46]'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* 4. Text */}
                          {crit.type === 'text' && (
                            <input
                              type="text"
                              value={val || ''}
                              onChange={e =>
                                setCriteriaValues(prev => ({
                                  ...prev,
                                  [crit.id]: e.target.value
                                }))
                              }
                              placeholder="ملاحظة حول هذا المعيار..."
                              className="w-full bg-[#064e3b] border border-[#065f46] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none"
                              dir="rtl"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Teacher remarks */}
                <div>
                  <label className="text-xs font-semibold text-[#86efac] block mb-1 text-right">
                    ملاحظات وتوجيهات المعلم للطالب:
                  </label>
                  <textarea
                    rows={2}
                    value={teacherNotes}
                    onChange={e => setTeacherNotes(e.target.value)}
                    placeholder="مثال: أحسنت في الغنة ولكن انتبه لمد الياء في كلمة..."
                    className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none resize-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] text-xs font-bold text-center">
                  {saveSuccessMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#065f46]">
                {onNavigateToWhatsApp && (
                  <button
                    type="button"
                    onClick={() => onNavigateToWhatsApp(activeStudent.id)}
                    className="px-4 py-2.5 rounded-2xl bg-[#022c22] hover:bg-[#022c22]/80 border border-[#065f46] text-[#fbbf24] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-[#fbbf24]" />
                    <span>تجهيز رسالة الواتساب لولي الأمر</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isEvaluatingAI}
                  onClick={handleSaveEvaluation}
                  className="px-6 py-3 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-[#064e3b] text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isEvaluatingAI ? (
                    <span>جاري التحليل والضبط بالذكاء الاصطناعي...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#064e3b]" />
                      <span>حفظ التقييم وضبط خطة الغد بالذكاء الاصطناعي</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Criteria Modal */}
      {isCriteriaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#064e3b] border border-[#fbbf24]/40 rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
              <h3 className="text-base font-bold text-[#fbbf24] font-heading">
                {editingCriteriaId ? 'تعديل معيار التقييم' : 'إضافة معيار تقييم جديد'}
              </h3>
              <button
                onClick={() => setIsCriteriaModalOpen(false)}
                className="p-1.5 text-[#86efac] hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCriteriaForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#86efac] mb-1.5 text-right">
                  اسم المعيار <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCritName}
                  onChange={e => setNewCritName(e.target.value)}
                  placeholder="مثال: أحكام التجويد، الصوت والترتيل، الآداب"
                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#86efac] mb-1.5 text-right">
                  نوع التقييم
                </label>
                <select
                  value={newCritType}
                  onChange={e => setNewCritType(e.target.value as CriteriaType)}
                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none"
                >
                  <option value="score">تقييم بالدرجات (مثلاً من 10 أو 7 أو 100)</option>
                  <option value="stars">تقييم بالنجوم (1 إلى 5 نجوم)</option>
                  <option value="options">خيارات مخصصة (ممتاز، جيد، إلخ)</option>
                  <option value="text">ملاحظات نصية حرة</option>
                </select>
              </div>

              {newCritType === 'score' && (
                <div>
                  <label className="block text-xs font-semibold text-[#86efac] mb-1.5 text-right">
                    الدرجة العظمى (الحد الأقصى)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newCritMaxScore}
                    onChange={e => setNewCritMaxScore(Number(e.target.value))}
                    className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none"
                  />
                </div>
              )}

              {newCritType === 'options' && (
                <div>
                  <label className="block text-xs font-semibold text-[#86efac] mb-1.5 text-right">
                    الخيارات المتاحة (افصل بينها بفاصلة ,)
                  </label>
                  <input
                    type="text"
                    value={newCritOptions}
                    onChange={e => setNewCritOptions(e.target.value)}
                    placeholder="مثال: ممتاز, جيد جدا, جيد, ضعيف"
                    className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none"
                    dir="rtl"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#065f46]">
                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#86efac] hover:bg-[#022c22] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] text-xs font-black shadow-md cursor-pointer"
                >
                  {editingCriteriaId ? 'حفظ التعديلات' : 'إضافة المعيار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Criteria Confirmation Modal */}
      {critToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#064e3b] border border-red-500/50 rounded-[32px] p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">تأكيد حذف معيار التقييم</h3>
              <p className="text-xs text-[#86efac]/90 mt-1">
                هل أنت متأكد من رغبتك في حذف معيار <span className="text-[#fbbf24] font-bold">"{critToDelete.name}"</span>؟
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCritToDelete(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (critToDelete) {
                    const id = critToDelete.id;
                    setCritToDelete(null);
                    await onDeleteCriteria(id);
                  }
                }}
                className="flex-1 py-2.5 rounded-2xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-lg cursor-pointer transition-all"
              >
                نعم، احذف المعيار
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Feedback & Next Day Assignment Result Modal */}
      {aiFeedbackResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#064e3b] border border-[#fbbf24]/40 rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
              <div className="flex items-center gap-2 text-[#fbbf24] font-bold font-heading">
                <Sparkles className="w-5 h-5 text-[#fbbf24]" />
                <span>تحليل الذكاء الاصطناعي وخطة الغد للطالب</span>
              </div>
              <button
                onClick={() => setAiFeedbackResult(null)}
                className="p-1.5 text-[#86efac] hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#022c22] border border-[#065f46]">
                <span className="text-[#86efac] font-semibold">حالة تقدم الطالب:</span>
                <span className="px-3 py-1 rounded-xl bg-[#fbbf24]/20 text-[#fbbf24] font-black">
                  {aiFeedbackResult.studentProgressStatus || 'منتظم'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#022c22] border border-[#065f46]">
                <span className="text-[#fbbf24] font-bold block mb-1">التحليل التربوي:</span>
                <p className="text-[#f0f9f6] leading-relaxed">{aiFeedbackResult.analysis}</p>
              </div>

              {aiFeedbackResult.reasoning && (
                <div className="p-3.5 rounded-2xl bg-[#022c22]/80 border border-[#065f46] text-[#86efac]">
                  <span className="text-[#fbbf24] font-bold">سبب ضبط الخطة: </span>
                  {aiFeedbackResult.reasoning}
                </div>
              )}

              {aiFeedbackResult.nextDayPlan && (
                <div className="p-4 rounded-2xl bg-[#022c22] border border-[#fbbf24]/40 space-y-2.5">
                  <div className="text-[#fbbf24] font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>الورد المقترح والمحدث لغد:</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="text-[#86efac]">الحفظ الجديد:</span>
                    <span className="font-bold text-[#fbbf24]">
                      {aiFeedbackResult.nextDayPlan.newMemorization}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="text-[#86efac]">المراجعة:</span>
                    <span className="font-bold text-white">
                      {aiFeedbackResult.nextDayPlan.review}
                    </span>
                  </div>
                  {aiFeedbackResult.nextDayPlan.dailyNote && (
                    <div className="pt-2 border-t border-[#065f46] text-[#86efac]">
                      <span className="text-[#fbbf24] font-semibold">توجيه منزلي: </span>
                      {aiFeedbackResult.nextDayPlan.dailyNote}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#065f46] flex items-center justify-between">
              {onNavigateToWhatsApp && activeStudent && (
                <button
                  onClick={() => {
                    setAiFeedbackResult(null);
                    onNavigateToWhatsApp(activeStudent.id);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال تقرير الواتساب لولي الأمر</span>
                </button>
              )}
              <button
                onClick={() => setAiFeedbackResult(null)}
                className="px-5 py-2.5 rounded-2xl bg-[#022c22] hover:bg-[#022c22]/80 border border-[#065f46] text-[#f0f9f6] font-bold text-xs cursor-pointer"
              >
                إتمام
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
