import React, { useState, useEffect } from 'react';
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
  Send,
  X,
  Layers,
  RotateCcw,
  Check,
  Compass,
  FileText,
  ArrowLeftRight,
  CheckCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Student,
  AttendanceRecord,
  StudentEvaluation,
  EvaluationCriteria,
  CriteriaType,
  QuranRecitationItem
} from '../../types';
import {
  QURAN_SURAHS,
  FAMOUS_RECITERS,
  REVIEW_TYPES,
  getSurahInfo,
  formatQuranPortion
} from '../../data/quranData';

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

  const activeStudent = students.find(s => s.id === activeStudentId);

  // ----------------------------------------------------
  // 1. TODAY'S RECITATION STATE (ما سمعه الطالب اليوم)
  // Supports multi-surah ranges (from Surah A ayah X to Surah B ayah Y)
  // ----------------------------------------------------
  // Today's New Memorization
  const [todayNewSurah, setTodayNewSurah] = useState<number>(78);
  const [todayNewFromAyah, setTodayNewFromAyah] = useState<number>(1);
  const [todayNewToSurah, setTodayNewToSurah] = useState<number>(78);
  const [todayNewToAyah, setTodayNewToAyah] = useState<number>(10);

  // Today's Review Items (Teacher can add multiple review portions / multi-surah tests)
  const [todayReviews, setTodayReviews] = useState<QuranRecitationItem[]>([
    {
      id: 'rev_1',
      type: REVIEW_TYPES[0],
      surahNumber: 78,
      surahName: 'النبأ',
      fromAyah: 1,
      toSurahNumber: 78,
      toSurahName: 'النبأ',
      toAyah: 40,
      isFullSurah: true
    }
  ]);

  // ----------------------------------------------------
  // 2. TOMORROW'S REQUIRED ASSIGNMENT (مقرر الغد يحدده المعلم)
  // Supports multi-surah ranges
  // ----------------------------------------------------
  const [tomNewSurah, setTomNewSurah] = useState<number>(78);
  const [tomNewFromAyah, setTomNewFromAyah] = useState<number>(11);
  const [tomNewToSurah, setTomNewToSurah] = useState<number>(78);
  const [tomNewToAyah, setTomNewToAyah] = useState<number>(20);

  const [tomReviewType, setTomReviewType] = useState<string>(REVIEW_TYPES[0]);
  const [tomReviewSurah, setTomReviewSurah] = useState<number>(79);
  const [tomReviewFromAyah, setTomReviewFromAyah] = useState<number>(1);
  const [tomReviewToSurah, setTomReviewToSurah] = useState<number>(79);
  const [tomReviewToAyah, setTomReviewToAyah] = useState<number>(46);

  const [selectedSheikh, setSelectedSheikh] = useState<string>(FAMOUS_RECITERS[0].name);
  const [dailyHomeNote, setDailyHomeNote] = useState<string>(
    'الاستماع للقارئ المتقن 3 مرات، وتكرار الآيات غيباً 5 مرات قبل النوم والتسميع على ولي الأمر.'
  );

  // Criteria values & Teacher notes
  const [criteriaValues, setCriteriaValues] = useState<Record<string, any>>({});
  const [teacherNotes, setTeacherNotes] = useState<string>('أداء طيب ومتقن ما شاء الله، نسأل الله له التوفيق والرفعة.');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Criteria Management Modal state
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [editingCriteriaId, setEditingCriteriaId] = useState<string | null>(null);
  const [critToDelete, setCritToDelete] = useState<EvaluationCriteria | null>(null);
  const [newCritName, setNewCritName] = useState('');
  const [newCritType, setNewCritType] = useState<CriteriaType>('score');
  const [newCritMaxScore, setNewCritMaxScore] = useState<number>(10);
  const [newCritOptions, setNewCritOptions] = useState<string>('ممتاز, جيد جدا, جيد, ضعيف');

  // Today attendance status of active student
  const todayAtt = attendance.find(
    a => a.date === todayStr && a.studentId === activeStudentId
  );
  const isAbsent = todayAtt?.status === 'غائب';
  const isExcused = todayAtt?.status === 'معتذر';

  // Metadata Helpers
  const startTodaySurahInfo = getSurahInfo(todayNewSurah);
  const endTodaySurahInfo = getSurahInfo(todayNewToSurah);

  const startTomNewSurahInfo = getSurahInfo(tomNewSurah);
  const endTomNewSurahInfo = getSurahInfo(tomNewToSurah);

  const startTomRevSurahInfo = getSurahInfo(tomReviewSurah);
  const endTomRevSurahInfo = getSurahInfo(tomReviewToSurah);

  // Initialize or load student evaluation when active student changes
  useEffect(() => {
    if (!activeStudent) return;

    // Check if an evaluation already exists for today
    const existing = evaluations.find(
      e => e.date === todayStr && e.studentId === activeStudent.id
    );

    if (existing) {
      setCriteriaValues(existing.criteriaValues || {});
      setTeacherNotes(existing.recitationDetails?.teacherNotes || '');

      // Load today's new item if stored
      if (existing.recitationDetails?.todayNewItem) {
        const item = existing.recitationDetails.todayNewItem;
        const sNum = item.surahNumber || 78;
        const toSNum = item.toSurahNumber || sNum;
        setTodayNewSurah(sNum);
        setTodayNewFromAyah(item.fromAyah || 1);
        setTodayNewToSurah(toSNum);
        setTodayNewToAyah(item.toAyah || 10);
      }

      // Load today's review items
      if (existing.recitationDetails?.todayReviewItems && existing.recitationDetails.todayReviewItems.length > 0) {
        setTodayReviews(existing.recitationDetails.todayReviewItems);
      }

      // Load tomorrow's assignment
      if (existing.recitationDetails?.tomorrowNewItem) {
        const tNew = existing.recitationDetails.tomorrowNewItem;
        const sNum = tNew.surahNumber || 78;
        const toSNum = tNew.toSurahNumber || sNum;
        setTomNewSurah(sNum);
        setTomNewFromAyah(tNew.fromAyah || 1);
        setTomNewToSurah(toSNum);
        setTomNewToAyah(tNew.toAyah || 10);
      }
      if (existing.recitationDetails?.tomorrowReviewItem) {
        const tRev = existing.recitationDetails.tomorrowReviewItem;
        const sNum = tRev.surahNumber || 78;
        const toSNum = tRev.toSurahNumber || sNum;
        setTomReviewType(tRev.type || REVIEW_TYPES[0]);
        setTomReviewSurah(sNum);
        setTomReviewFromAyah(tRev.fromAyah || 1);
        setTomReviewToSurah(toSNum);
        setTomReviewToAyah(tRev.toAyah || 10);
      }
      if (existing.recitationDetails?.tomorrowSuggestedSheikh) {
        setSelectedSheikh(existing.recitationDetails.tomorrowSuggestedSheikh);
      }
      if (existing.recitationDetails?.tomorrowDailyNote) {
        setDailyHomeNote(existing.recitationDetails.tomorrowDailyNote);
      }
    } else {
      // Default initialization based on student current position
      const studentSurah = activeStudent.currentSurah || 78;
      const studentAyah = activeStudent.currentAyah || 1;
      const surahInfo = getSurahInfo(studentSurah);
      const totalAyahs = surahInfo.numberOfAyahs;

      const step = activeStudent.level === 'ضعيف' ? 4 : activeStudent.level === 'قوي' ? 12 : 7;
      const endAyah = Math.min(studentAyah + step - 1, totalAyahs);

      setTodayNewSurah(studentSurah);
      setTodayNewFromAyah(studentAyah);
      setTodayNewToSurah(studentSurah);
      setTodayNewToAyah(endAyah);

      // Default review
      const revSurah = studentSurah < 114 ? studentSurah + 1 : 113;
      const revInfo = getSurahInfo(revSurah);
      setTodayReviews([
        {
          id: `rev_${Date.now()}`,
          type: REVIEW_TYPES[0],
          surahNumber: revSurah,
          surahName: revInfo.name,
          fromAyah: 1,
          toSurahNumber: revSurah,
          toSurahName: revInfo.name,
          toAyah: revInfo.numberOfAyahs,
          isFullSurah: true
        }
      ]);

      // Calculate default tomorrow assignment
      if (endAyah < totalAyahs) {
        setTomNewSurah(studentSurah);
        setTomNewFromAyah(endAyah + 1);
        setTomNewToSurah(studentSurah);
        setTomNewToAyah(Math.min(endAyah + step, totalAyahs));
      } else {
        // Next surah in order
        const nextSurahNum = Math.max(1, studentSurah - 1);
        const nextSurahInfo = getSurahInfo(nextSurahNum);
        setTomNewSurah(nextSurahNum);
        setTomNewFromAyah(1);
        setTomNewToSurah(nextSurahNum);
        setTomNewToAyah(Math.min(step, nextSurahInfo.numberOfAyahs));
      }

      setTomReviewType(REVIEW_TYPES[0]);
      setTomReviewSurah(studentSurah);
      setTomReviewFromAyah(1);
      setTomReviewToSurah(studentSurah);
      setTomReviewToAyah(endAyah);

      // Initialize criteria defaults
      const defaults: Record<string, any> = {};
      criteria.forEach(c => {
        if (c.type === 'stars') defaults[c.id] = 5;
        if (c.type === 'score') defaults[c.id] = c.maxScore || 10;
        if (c.type === 'options' && c.options && c.options.length > 0) defaults[c.id] = c.options[0];
        if (c.type === 'text') defaults[c.id] = '';
      });
      setCriteriaValues(defaults);
      setTeacherNotes('أداء طيب ومتقن ما شاء الله، نسأل الله له التوفيق والرفعة.');
    }
  }, [activeStudentId, evaluations, criteria]);

  // Handlers for Today's New
  const handleTodayStartSurahChange = (surahNum: number) => {
    setTodayNewSurah(surahNum);
    const info = getSurahInfo(surahNum);
    setTodayNewFromAyah(1);
    // If toSurah was previous fromSurah or same, update toSurah as well
    if (todayNewToSurah === todayNewSurah) {
      setTodayNewToSurah(surahNum);
      setTodayNewToAyah(Math.min(10, info.numberOfAyahs));
    }
  };

  const handleTodayEndSurahChange = (surahNum: number) => {
    setTodayNewToSurah(surahNum);
    const info = getSurahInfo(surahNum);
    setTodayNewToAyah(Math.min(10, info.numberOfAyahs));
  };

  // Handlers for Tomorrow's New
  const handleTomNewStartSurahChange = (surahNum: number) => {
    setTomNewSurah(surahNum);
    const info = getSurahInfo(surahNum);
    setTomNewFromAyah(1);
    if (tomNewToSurah === tomNewSurah) {
      setTomNewToSurah(surahNum);
      setTomNewToAyah(Math.min(10, info.numberOfAyahs));
    }
  };

  const handleTomNewEndSurahChange = (surahNum: number) => {
    setTomNewToSurah(surahNum);
    const info = getSurahInfo(surahNum);
    setTomNewToAyah(Math.min(10, info.numberOfAyahs));
  };

  // Handlers for Tomorrow's Review
  const handleTomRevStartSurahChange = (surahNum: number) => {
    setTomReviewSurah(surahNum);
    const info = getSurahInfo(surahNum);
    setTomReviewFromAyah(1);
    if (tomReviewToSurah === tomReviewSurah) {
      setTomReviewToSurah(surahNum);
      setTomReviewToAyah(info.numberOfAyahs);
    }
  };

  const handleTomRevEndSurahChange = (surahNum: number) => {
    setTomReviewToSurah(surahNum);
    const info = getSurahInfo(surahNum);
    setTomReviewToAyah(info.numberOfAyahs);
  };

  // Add Review Item
  const handleAddReviewItem = () => {
    const defaultSurahNum = 114;
    const info = getSurahInfo(defaultSurahNum);
    const newItem: QuranRecitationItem = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: REVIEW_TYPES[2] || 'مراجعة تراكمية',
      surahNumber: defaultSurahNum,
      surahName: info.name,
      fromAyah: 1,
      toSurahNumber: defaultSurahNum,
      toSurahName: info.name,
      toAyah: info.numberOfAyahs,
      isFullSurah: true
    };
    setTodayReviews(prev => [...prev, newItem]);
  };

  // Update Review Item
  const handleUpdateReviewItem = (id: string, updates: Partial<QuranRecitationItem>) => {
    setTodayReviews(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if (updates.surahNumber !== undefined) {
            const sInfo = getSurahInfo(updates.surahNumber);
            updated.surahName = sInfo.name;
            updated.fromAyah = 1;
            if (updated.toSurahNumber === undefined || updated.toSurahNumber === item.surahNumber) {
              updated.toSurahNumber = updates.surahNumber;
              updated.toSurahName = sInfo.name;
              updated.toAyah = sInfo.numberOfAyahs;
            }
          }
          if (updates.toSurahNumber !== undefined) {
            const toSInfo = getSurahInfo(updates.toSurahNumber);
            updated.toSurahName = toSInfo.name;
            updated.toAyah = toSInfo.numberOfAyahs;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Remove Review Item
  const handleRemoveReviewItem = (id: string) => {
    setTodayReviews(prev => prev.filter(item => item.id !== id));
  };

  // Quick Auto-Calculate Tomorrow Assignment from Today's finished point
  const handleAutoCalcTomorrow = () => {
    const curEndSurahInfo = getSurahInfo(todayNewToSurah);
    const totalAyahs = curEndSurahInfo.numberOfAyahs;
    const step = activeStudent?.level === 'ضعيف' ? 4 : activeStudent?.level === 'قوي' ? 12 : 7;

    if (todayNewToAyah < totalAyahs) {
      setTomNewSurah(todayNewToSurah);
      setTomNewFromAyah(todayNewToAyah + 1);
      setTomNewToSurah(todayNewToSurah);
      setTomNewToAyah(Math.min(todayNewToAyah + step, totalAyahs));
    } else {
      // Finished surah, move to next surah in sequence
      const nextSurahNum = Math.max(1, todayNewToSurah - 1);
      const nextInfo = getSurahInfo(nextSurahNum);
      setTomNewSurah(nextSurahNum);
      setTomNewFromAyah(1);
      setTomNewToSurah(nextSurahNum);
      setTomNewToAyah(Math.min(step, nextInfo.numberOfAyahs));
    }

    // Set tomorrow review to cover today's recitation range
    setTomReviewType(REVIEW_TYPES[0]);
    setTomReviewSurah(todayNewSurah);
    setTomReviewFromAyah(todayNewFromAyah);
    setTomReviewToSurah(todayNewToSurah);
    setTomReviewToAyah(todayNewToAyah);
  };

  // Save complete evaluation and update tomorrow assignment
  const handleSaveEvaluationRecord = async () => {
    if (!activeStudent) return;
    setIsSaving(true);
    setSaveSuccessMsg('');

    try {
      const todayStartSurahInfo = getSurahInfo(todayNewSurah);
      const todayEndSurahInfo = getSurahInfo(todayNewToSurah);

      const todayNewFormatted = formatQuranPortion(
        todayStartSurahInfo.name,
        todayNewFromAyah,
        todayNewToAyah,
        todayStartSurahInfo.numberOfAyahs,
        'حفظ جديد',
        todayEndSurahInfo.name,
        todayEndSurahInfo.numberOfAyahs
      );

      const reviewStrings = todayReviews.map(r => {
        const sInfo = getSurahInfo(r.surahNumber);
        const toInfo = r.toSurahNumber ? getSurahInfo(r.toSurahNumber) : sInfo;
        return formatQuranPortion(
          sInfo.name,
          r.fromAyah,
          r.toAyah,
          sInfo.numberOfAyahs,
          r.type,
          toInfo.name,
          toInfo.numberOfAyahs
        );
      });
      const reviewAchievedSummary = reviewStrings.length > 0 ? reviewStrings.join(' • ') : 'أتم المراجعة والتثبيت المقرر';

      const tomStartSurahInfo = getSurahInfo(tomNewSurah);
      const tomEndSurahInfo = getSurahInfo(tomNewToSurah);

      const tomNewFormatted = formatQuranPortion(
        tomStartSurahInfo.name,
        tomNewFromAyah,
        tomNewToAyah,
        tomStartSurahInfo.numberOfAyahs,
        'حفظ جديد',
        tomEndSurahInfo.name,
        tomEndSurahInfo.numberOfAyahs
      );

      const tomRevStartInfo = getSurahInfo(tomReviewSurah);
      const tomRevEndInfo = getSurahInfo(tomReviewToSurah);

      const tomRevFormatted = formatQuranPortion(
        tomRevStartInfo.name,
        tomReviewFromAyah,
        tomReviewToAyah,
        tomRevStartInfo.numberOfAyahs,
        tomReviewType,
        tomRevEndInfo.name,
        tomRevEndInfo.numberOfAyahs
      );

      const todayNewItem: QuranRecitationItem = {
        id: `new_${Date.now()}`,
        type: 'حفظ جديد',
        surahNumber: todayNewSurah,
        surahName: todayStartSurahInfo.name,
        fromAyah: todayNewFromAyah,
        toSurahNumber: todayNewToSurah,
        toSurahName: todayEndSurahInfo.name,
        toAyah: todayNewToAyah,
        isFullSurah: todayNewSurah === todayNewToSurah && todayNewFromAyah === 1 && todayNewToAyah >= todayStartSurahInfo.numberOfAyahs
      };

      const tomorrowNewItem: QuranRecitationItem = {
        id: `tom_new_${Date.now()}`,
        type: 'حفظ جديد',
        surahNumber: tomNewSurah,
        surahName: tomStartSurahInfo.name,
        fromAyah: tomNewFromAyah,
        toSurahNumber: tomNewToSurah,
        toSurahName: tomEndSurahInfo.name,
        toAyah: tomNewToAyah,
        isFullSurah: tomNewSurah === tomNewToSurah && tomNewFromAyah === 1 && tomNewToAyah >= tomStartSurahInfo.numberOfAyahs
      };

      const tomorrowReviewItem: QuranRecitationItem = {
        id: `tom_rev_${Date.now()}`,
        type: tomReviewType,
        surahNumber: tomReviewSurah,
        surahName: tomRevStartInfo.name,
        fromAyah: tomReviewFromAyah,
        toSurahNumber: tomReviewToSurah,
        toSurahName: tomRevEndInfo.name,
        toAyah: tomReviewToAyah,
        isFullSurah: tomReviewSurah === tomReviewToSurah && tomReviewFromAyah === 1 && tomReviewToAyah >= tomRevStartInfo.numberOfAyahs
      };

      const fullEvaluation: StudentEvaluation = {
        id: `eval_${todayStr}_${activeStudent.id}`,
        date: todayStr,
        studentId: activeStudent.id,
        criteriaValues,
        recitationDetails: {
          newMemorizationAchieved: todayNewFormatted,
          reviewAchieved: reviewAchievedSummary,
          teacherNotes,
          todayNewItem,
          todayReviewItems: todayReviews,
          tomorrowNewItem,
          tomorrowReviewItem,
          tomorrowSuggestedSheikh: selectedSheikh,
          tomorrowDailyNote: dailyHomeNote
        },
        evaluatedAt: new Date().toISOString()
      };

      // 1. Save evaluation
      await onSaveEvaluation(fullEvaluation);

      // 2. Update student assignment & current position
      const newDailyAssignment = {
        newMemorization: tomNewFormatted,
        review: tomRevFormatted,
        suggestedSheikh: selectedSheikh,
        dailyNote: dailyHomeNote,
        newItem: tomorrowNewItem,
        reviewItem: tomorrowReviewItem
      };

      await onUpdateStudentAIPlan(activeStudent.id, newDailyAssignment);

      setSaveSuccessMsg('تم حفظ التسميع والتقييم وتثبيت مقرر الغد بنجاح!');

      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.7 }
      });
    } catch (e: any) {
      console.error('Save evaluation error:', e);
      setSaveSuccessMsg('حدث خطأ أثناء حفظ التقييم.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  // Criteria Management Handlers
  const handleOpenAddCriteria = () => {
    setEditingCriteriaId(null);
    setNewCritName('');
    setNewCritType('score');
    setNewCritMaxScore(10);
    setNewCritOptions('ممتاز, جيد جدا, جيد, ضعيف');
    setIsCriteriaModalOpen(true);
  };

  const handleOpenEditCriteria = (crit: EvaluationCriteria) => {
    setEditingCriteriaId(crit.id);
    setNewCritName(crit.name);
    setNewCritType(crit.type);
    setNewCritMaxScore(crit.maxScore || 10);
    setNewCritOptions(crit.options ? crit.options.join(', ') : '');
    setIsCriteriaModalOpen(true);
  };

  const handleSaveCriteriaForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritName.trim()) return;

    const optionsArray =
      newCritType === 'options'
        ? newCritOptions
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : undefined;

    let updatedList: EvaluationCriteria[];

    if (editingCriteriaId) {
      updatedList = criteria.map(c =>
        c.id === editingCriteriaId
          ? {
              ...c,
              name: newCritName.trim(),
              type: newCritType,
              maxScore: newCritType === 'score' ? newCritMaxScore : undefined,
              options: optionsArray
            }
          : c
      );
    } else {
      const newCrit: EvaluationCriteria = {
        id: `crit_${Date.now()}`,
        name: newCritName.trim(),
        type: newCritType,
        maxScore: newCritType === 'score' ? newCritMaxScore : undefined,
        options: optionsArray,
        isDefault: false
      };
      updatedList = [...criteria, newCrit];
    }

    await onSaveCriteria(updatedList);
    setIsCriteriaModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Criteria Management Trigger */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#fbbf24]" />
            <span>تسجيل التسميع وتقييم الطلاب وتحديد مقرر الغد</span>
          </h2>
          <p className="text-xs text-[#86efac]/90 mt-1">
            تسجيل دقيق للتسميع الفعلي (عبر سورة واحدة أو عدة سور) وتحديد دقيق لورد الحفظ والمراجعة لغد
          </p>
        </div>

        <button
          onClick={handleOpenAddCriteria}
          className="px-4 py-2.5 rounded-2xl bg-[#022c22] hover:bg-[#022c22]/80 border border-[#065f46] text-[#fbbf24] text-xs font-bold flex items-center gap-2 self-start md:self-auto cursor-pointer transition-all shadow-md"
        >
          <Sliders className="w-4 h-4 text-[#fbbf24]" />
          <span>تخصيص معايير التقييم والدرجات</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Students List */}
        <div className="lg:col-span-4 bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-5 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
            <h3 className="text-sm font-bold text-white font-heading">
              قائمة طلاب الحلقة ({students.length})
            </h3>
            <span className="text-[11px] text-[#86efac] font-bold">
              تاريخ: {todayStr}
            </span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {students.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#86efac]/70">
                لا يوجد طلاب مسجلين في الحلقة حالياً.
              </div>
            ) : (
              students.map(student => {
                const isSelected = student.id === activeStudentId;
                const studentAtt = attendance.find(
                  a => a.date === todayStr && a.studentId === student.id
                );
                const isStudentAbsent = studentAtt?.status === 'غائب';
                const isStudentExcused = studentAtt?.status === 'معتذر';
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
                          title="تم تسجيل التسميع اليوم"
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

        {/* Right Column: Teacher Recitation & Assignment Workspace */}
        <div className="lg:col-span-8">
          {!activeStudent ? (
            <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-12 text-center text-[#86efac]/60 backdrop-blur-md">
              اختر طالباً من القائمة للبدء في تسجيل التسميع ومقرر الغد
            </div>
          ) : (
            <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
              {/* Header: Student Info */}
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
                    <span>الطالب معتذر ({todayAtt?.note || 'عذر مقبول'})</span>
                  </div>
                ) : null}
              </div>

              {/* ============================================================ */}
              {/* SECTION 1: TODAY'S RECITATION (ما تم تسميعه اليوم بالتفصيل) */}
              {/* ============================================================ */}
              <div className="bg-[#022c22] border border-[#065f46] rounded-3xl p-5 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#065f46]">
                  <h4 className="text-sm font-bold text-[#fbbf24] font-heading flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#fbbf24]" />
                    <span>1. ما سمّعه الطالب اليوم في الحلقة (التسميع الفعلي):</span>
                  </h4>
                  <span className="text-[11px] text-[#86efac] font-bold">
                    اليوم: {todayStr}
                  </span>
                </div>

                {/* 1.1 New Memorization Today (Flexible Multi-Surah Range) */}
                <div className="space-y-3 bg-[#064e3b]/40 p-4 rounded-2xl border border-[#065f46]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                      <span>الحفظ الجديد لليوم (بداية ونهاية التسميع):</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTodayNewToSurah(todayNewSurah);
                          setTodayNewFromAyah(1);
                          setTodayNewToAyah(startTodaySurahInfo.numberOfAyahs);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-[#022c22] hover:bg-[#064e3b] text-[#fbbf24] border border-[#065f46] text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        كامل سورة {startTodaySurahInfo.name} ({startTodaySurahInfo.numberOfAyahs} آية)
                      </button>
                      {todayNewSurah !== todayNewToSurah && (
                        <button
                          type="button"
                          onClick={() => {
                            setTodayNewToSurah(todayNewSurah);
                            setTodayNewToAyah(startTodaySurahInfo.numberOfAyahs);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#022c22] text-[#86efac] border border-[#065f46] text-[11px] font-bold cursor-pointer"
                        >
                          نفس السورة
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Multi-Surah Range Selector Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#022c22]/70 p-3.5 rounded-2xl border border-[#065f46]">
                    {/* START POINT */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#fbbf24] flex items-center gap-1">
                        <span>نقطة البداية (من):</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">من سورة:</label>
                          <select
                            value={todayNewSurah}
                            onChange={e => handleTodayStartSurahChange(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {QURAN_SURAHS.map(s => (
                              <option key={s.number} value={s.number}>
                                {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">من الآية:</label>
                          <select
                            value={todayNewFromAyah}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setTodayNewFromAyah(val);
                              if (todayNewSurah === todayNewToSurah && todayNewToAyah < val) {
                                setTodayNewToAyah(val);
                              }
                            }}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {Array.from({ length: startTodaySurahInfo.numberOfAyahs }, (_, i) => i + 1).map(ayahNum => (
                              <option key={ayahNum} value={ayahNum}>
                                آية {ayahNum}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* END POINT */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#86efac] flex items-center gap-1">
                        <span>نقطة النهاية (إلى):</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">إلى سورة:</label>
                          <select
                            value={todayNewToSurah}
                            onChange={e => handleTodayEndSurahChange(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {QURAN_SURAHS.map(s => (
                              <option key={s.number} value={s.number}>
                                {s.number}. سورة {s.name} ({s.numberOfAyahs} آية)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">
                            إلى الآية (حتى {endTodaySurahInfo.numberOfAyahs}):
                          </label>
                          <select
                            value={todayNewToAyah}
                            onChange={e => setTodayNewToAyah(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {Array.from({ length: endTodaySurahInfo.numberOfAyahs }, (_, i) => i + 1)
                              .filter(ayahNum => todayNewSurah !== todayNewToSurah || ayahNum >= todayNewFromAyah)
                              .map(ayahNum => (
                                <option key={ayahNum} value={ayahNum}>
                                  آية {ayahNum}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live preview banner */}
                  <div className="p-3 rounded-2xl bg-[#022c22] border border-[#065f46] text-xs text-[#fbbf24] flex items-center justify-between">
                    <span className="text-[#86efac] font-bold">صيغة التسميع المعتمدة:</span>
                    <span className="font-bold text-sm">
                      {formatQuranPortion(
                        startTodaySurahInfo.name,
                        todayNewFromAyah,
                        todayNewToAyah,
                        startTodaySurahInfo.numberOfAyahs,
                        'حفظ جديد',
                        endTodaySurahInfo.name,
                        endTodaySurahInfo.numberOfAyahs
                      )}
                    </span>
                  </div>
                </div>

                {/* 1.2 Today's Reviews (Multiple Portions & Multi-Surah Spans) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#86efac]" />
                      <span>المراجعة والتثبيت والاختبارات اليوم ({todayReviews.length}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddReviewItem}
                      className="px-3 py-1.5 rounded-xl bg-[#064e3b] hover:bg-[#064e3b]/80 border border-[#065f46] text-[#86efac] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة مراجعة أو اختبار آخر</span>
                    </button>
                  </div>

                  {todayReviews.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#064e3b]/20 border border-dashed border-[#065f46] text-center text-xs text-[#86efac]/70">
                      لا توجد مراجعات مسجلة لليوم. اضغط على "إضافة مراجعة" لإضافة موضع مراجعة أو اختبار.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayReviews.map((rev, index) => {
                        const revStartSurahInfo = getSurahInfo(rev.surahNumber);
                        const revEndSurahInfo = rev.toSurahNumber ? getSurahInfo(rev.toSurahNumber) : revStartSurahInfo;

                        return (
                          <div
                            key={rev.id}
                            className="bg-[#064e3b]/30 p-4 rounded-2xl border border-[#065f46] space-y-3 relative"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#86efac]">
                                بند مراجعة #{index + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateReviewItem(rev.id, {
                                      toSurahNumber: rev.surahNumber,
                                      toSurahName: revStartSurahInfo.name,
                                      fromAyah: 1,
                                      toAyah: revStartSurahInfo.numberOfAyahs,
                                      isFullSurah: true
                                    })
                                  }
                                  className="px-2 py-0.5 rounded-lg bg-[#022c22] text-[#fbbf24] text-[10px] font-bold border border-[#065f46] cursor-pointer"
                                >
                                  كامل السورة ({revStartSurahInfo.numberOfAyahs})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReviewItem(rev.id)}
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                                  title="حذف هذا البند"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                              {/* Review Type */}
                              <div className="sm:col-span-1">
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  نوع المراجعة / التسميع:
                                </label>
                                <select
                                  value={rev.type}
                                  onChange={e => handleUpdateReviewItem(rev.id, { type: e.target.value })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {REVIEW_TYPES.map(t => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Start Surah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  من سورة:
                                </label>
                                <select
                                  value={rev.surahNumber}
                                  onChange={e => handleUpdateReviewItem(rev.id, { surahNumber: Number(e.target.value) })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {QURAN_SURAHS.map(s => (
                                    <option key={s.number} value={s.number}>
                                      {s.number}. {s.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* From Ayah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  من الآية:
                                </label>
                                <select
                                  value={rev.fromAyah}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    handleUpdateReviewItem(rev.id, {
                                      fromAyah: val,
                                      toAyah: (rev.toSurahNumber || rev.surahNumber) === rev.surahNumber && rev.toAyah < val ? val : rev.toAyah
                                    });
                                  }}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {Array.from({ length: revStartSurahInfo.numberOfAyahs }, (_, i) => i + 1).map(ayahNum => (
                                    <option key={ayahNum} value={ayahNum}>
                                      آية {ayahNum}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* End Surah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  إلى سورة:
                                </label>
                                <select
                                  value={rev.toSurahNumber || rev.surahNumber}
                                  onChange={e => handleUpdateReviewItem(rev.id, { toSurahNumber: Number(e.target.value) })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {QURAN_SURAHS.map(s => (
                                    <option key={s.number} value={s.number}>
                                      {s.number}. {s.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* To Ayah */}
                              <div>
                                <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                                  إلى الآية:
                                </label>
                                <select
                                  value={rev.toAyah}
                                  onChange={e => handleUpdateReviewItem(rev.id, { toAyah: Number(e.target.value) })}
                                  className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                                >
                                  {Array.from({ length: revEndSurahInfo.numberOfAyahs }, (_, i) => i + 1)
                                    .filter(ayahNum => (rev.toSurahNumber || rev.surahNumber) !== rev.surahNumber || ayahNum >= rev.fromAyah)
                                    .map(ayahNum => (
                                      <option key={ayahNum} value={ayahNum}>
                                        آية {ayahNum}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            <div className="text-[11px] text-[#fbbf24] bg-[#022c22] p-2.5 rounded-xl border border-[#065f46] font-bold">
                              {formatQuranPortion(
                                revStartSurahInfo.name,
                                rev.fromAyah,
                                rev.toAyah,
                                revStartSurahInfo.numberOfAyahs,
                                rev.type,
                                revEndSurahInfo.name,
                                revEndSurahInfo.numberOfAyahs
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================ */}
              {/* SECTION 2: TOMORROW'S ASSIGNMENT (مقرر الغد يحدده المعلم)    */}
              {/* ============================================================ */}
              <div className="bg-[#022c22] border border-[#fbbf24]/30 rounded-3xl p-5 space-y-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#065f46]">
                  <h4 className="text-sm font-bold text-[#fbbf24] font-heading flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#fbbf24]" />
                    <span>2. المقرر المطلوب تسميعه غداً (يحدده المعلم للطالب):</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAutoCalcTomorrow}
                    className="px-3 py-1.5 rounded-xl bg-[#064e3b] hover:bg-[#064e3b]/80 border border-[#fbbf24]/40 text-[#fbbf24] text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>حساب المقرر التالي تلقائياً بعد تسميع اليوم</span>
                  </button>
                </div>

                {/* 2.1 Tomorrow's New Memorization (Multi-Surah Range) */}
                <div className="space-y-3 bg-[#064e3b]/40 p-4 rounded-2xl border border-[#065f46]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                      <span>ورد الحفظ الجديد المطلوب لغد (بداية ونهاية المقرر):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTomNewToSurah(tomNewSurah);
                        setTomNewFromAyah(1);
                        setTomNewToAyah(startTomNewSurahInfo.numberOfAyahs);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#022c22] text-[#fbbf24] border border-[#065f46] text-[11px] font-bold cursor-pointer"
                    >
                      كامل سورة {startTomNewSurahInfo.name} ({startTomNewSurahInfo.numberOfAyahs})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#022c22]/70 p-3.5 rounded-2xl border border-[#065f46]">
                    {/* START POINT */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#fbbf24]">نقطة البداية (من):</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">من سورة:</label>
                          <select
                            value={tomNewSurah}
                            onChange={e => handleTomNewStartSurahChange(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {QURAN_SURAHS.map(s => (
                              <option key={s.number} value={s.number}>
                                {s.number}. {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">من الآية:</label>
                          <select
                            value={tomNewFromAyah}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setTomNewFromAyah(val);
                              if (tomNewSurah === tomNewToSurah && tomNewToAyah < val) {
                                setTomNewToAyah(val);
                              }
                            }}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {Array.from({ length: startTomNewSurahInfo.numberOfAyahs }, (_, i) => i + 1).map(ayahNum => (
                              <option key={ayahNum} value={ayahNum}>
                                آية {ayahNum}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* END POINT */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#86efac]">نقطة النهاية (إلى):</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">إلى سورة:</label>
                          <select
                            value={tomNewToSurah}
                            onChange={e => handleTomNewEndSurahChange(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {QURAN_SURAHS.map(s => (
                              <option key={s.number} value={s.number}>
                                {s.number}. {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#86efac] block mb-1">
                            إلى الآية (حتى {endTomNewSurahInfo.numberOfAyahs}):
                          </label>
                          <select
                            value={tomNewToAyah}
                            onChange={e => setTomNewToAyah(Number(e.target.value))}
                            className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2.5 text-xs text-white outline-none"
                          >
                            {Array.from({ length: endTomNewSurahInfo.numberOfAyahs }, (_, i) => i + 1)
                              .filter(ayahNum => tomNewSurah !== tomNewToSurah || ayahNum >= tomNewFromAyah)
                              .map(ayahNum => (
                                <option key={ayahNum} value={ayahNum}>
                                  آية {ayahNum}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#022c22] border border-[#065f46] text-xs text-[#fbbf24] flex items-center justify-between">
                    <span className="text-[#86efac] font-bold">المقرر الجديد لغد:</span>
                    <span className="font-bold text-sm">
                      {formatQuranPortion(
                        startTomNewSurahInfo.name,
                        tomNewFromAyah,
                        tomNewToAyah,
                        startTomNewSurahInfo.numberOfAyahs,
                        'حفظ جديد',
                        endTomNewSurahInfo.name,
                        endTomNewSurahInfo.numberOfAyahs
                      )}
                    </span>
                  </div>
                </div>

                {/* 2.2 Tomorrow's Review (Multi-Surah Range) */}
                <div className="space-y-3 bg-[#064e3b]/40 p-4 rounded-2xl border border-[#065f46]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#86efac]" />
                      <span>ورد المراجعة والتثبيت المطلوب لغد:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTomReviewToSurah(tomReviewSurah);
                        setTomReviewFromAyah(1);
                        setTomReviewToAyah(startTomRevSurahInfo.numberOfAyahs);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#022c22] text-[#fbbf24] border border-[#065f46] text-[11px] font-bold cursor-pointer"
                    >
                      كامل سورة {startTomRevSurahInfo.name} ({startTomRevSurahInfo.numberOfAyahs})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    {/* Type */}
                    <div>
                      <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                        نوع المراجعة:
                      </label>
                      <select
                        value={tomReviewType}
                        onChange={e => setTomReviewType(e.target.value)}
                        className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                      >
                        {REVIEW_TYPES.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* From Surah */}
                    <div>
                      <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                        من سورة:
                      </label>
                      <select
                        value={tomReviewSurah}
                        onChange={e => handleTomRevStartSurahChange(Number(e.target.value))}
                        className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                      >
                        {QURAN_SURAHS.map(s => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* From Ayah */}
                    <div>
                      <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                        من الآية:
                      </label>
                      <select
                        value={tomReviewFromAyah}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setTomReviewFromAyah(val);
                          if (tomReviewSurah === tomReviewToSurah && tomReviewToAyah < val) {
                            setTomReviewToAyah(val);
                          }
                        }}
                        className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                      >
                        {Array.from({ length: startTomRevSurahInfo.numberOfAyahs }, (_, i) => i + 1).map(ayahNum => (
                          <option key={ayahNum} value={ayahNum}>
                            آية {ayahNum}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* To Surah */}
                    <div>
                      <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                        إلى سورة:
                      </label>
                      <select
                        value={tomReviewToSurah}
                        onChange={e => handleTomRevEndSurahChange(Number(e.target.value))}
                        className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                      >
                        {QURAN_SURAHS.map(s => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* To Ayah */}
                    <div>
                      <label className="text-[10px] font-semibold text-[#86efac] block mb-1">
                        إلى الآية:
                      </label>
                      <select
                        value={tomReviewToAyah}
                        onChange={e => setTomReviewToAyah(Number(e.target.value))}
                        className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-xl py-1.5 px-2 text-xs text-white outline-none"
                      >
                        {Array.from({ length: endTomRevSurahInfo.numberOfAyahs }, (_, i) => i + 1)
                          .filter(ayahNum => tomReviewSurah !== tomReviewToSurah || ayahNum >= tomReviewFromAyah)
                          .map(ayahNum => (
                            <option key={ayahNum} value={ayahNum}>
                              آية {ayahNum}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#022c22] border border-[#065f46] text-xs text-[#86efac] flex items-center justify-between">
                    <span className="font-bold">المراجعة المقررة لغد:</span>
                    <span className="font-bold text-white text-sm">
                      {formatQuranPortion(
                        startTomRevSurahInfo.name,
                        tomReviewFromAyah,
                        tomReviewToAyah,
                        startTomRevSurahInfo.numberOfAyahs,
                        tomReviewType,
                        endTomRevSurahInfo.name,
                        endTomRevSurahInfo.numberOfAyahs
                      )}
                    </span>
                  </div>
                </div>

                {/* 2.3 Reciter & Daily Home Directive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#86efac] block mb-1 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#fbbf24]" />
                      <span>القارئ المقترح للاستماع له بالمنزل:</span>
                    </label>
                    <select
                      value={selectedSheikh}
                      onChange={e => setSelectedSheikh(e.target.value)}
                      className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-xs text-white outline-none"
                    >
                      {FAMOUS_RECITERS.map(r => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#86efac] block mb-1 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#fbbf24]" />
                      <span>توجيه المتابعة المنزلية لولي الأمر:</span>
                    </label>
                    <input
                      type="text"
                      value={dailyHomeNote}
                      onChange={e => setDailyHomeNote(e.target.value)}
                      placeholder="اكتب التوجيه المنزلي..."
                      className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3 text-xs text-white outline-none"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* SECTION 3: EVALUATION CRITERIA & TEACHER NOTES               */}
              {/* ============================================================ */}
              <div className="bg-[#022c22] border border-[#065f46] rounded-3xl p-5 space-y-4">
                <div className="text-xs font-bold text-[#fbbf24] flex items-center gap-2 pb-2 border-b border-[#065f46]">
                  <Award className="w-4 h-4 text-[#fbbf24]" />
                  <span>3. تقييم المعايير وملاحظات المعلم اليوم:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {criteria.map(crit => {
                    const val = criteriaValues[crit.id];

                    return (
                      <div key={crit.id} className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#86efac] block text-right">
                          {crit.name}:
                        </label>

                        {/* Stars */}
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

                        {/* Score */}
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

                        {/* Options */}
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

                        {/* Text */}
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

                {/* Teacher remarks */}
                <div className="pt-2">
                  <label className="text-xs font-semibold text-[#86efac] block mb-1 text-right">
                    ملاحظات وتوجيهات الشيخ/المعلم الخاصة بالطالب اليوم:
                  </label>
                  <textarea
                    rows={2}
                    value={teacherNotes}
                    onChange={e => setTeacherNotes(e.target.value)}
                    placeholder="مثال: أحسنت في إتقان الوقف والابتداء، راعِ تفخيم حروف الاستعلاء في سورة النبأ..."
                    className="w-full bg-[#064e3b] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2 px-3.5 text-xs text-[#f0f9f6] outline-none resize-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-4 rounded-2xl bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] text-xs sm:text-sm font-bold text-center animate-fadeIn flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-[#fbbf24]" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#065f46]">
                {onNavigateToWhatsApp && (
                  <button
                    type="button"
                    onClick={() => onNavigateToWhatsApp(activeStudent.id)}
                    className="px-5 py-3 rounded-2xl bg-[#022c22] hover:bg-[#022c22]/80 border border-[#065f46] text-[#fbbf24] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-[#fbbf24]" />
                    <span>تجهيز وإرسال رسالة الواتساب لولي الأمر</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveEvaluationRecord}
                  className="px-8 py-3.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-[#064e3b] text-sm font-black shadow-[0_0_25px_rgba(251,191,36,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isSaving ? (
                    <span>جاري حفظ السجل...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#064e3b]" />
                      <span>حفظ التسميع والتقييم وتثبيت مقرر الغد</span>
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#064e3b] border border-[#fbbf24]/40 rounded-2xl sm:rounded-[32px] shadow-2xl flex flex-col max-h-[92vh] my-auto overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#065f46] shrink-0 bg-[#064e3b]">
              <h3 className="text-sm sm:text-base font-bold text-[#fbbf24] font-heading">
                {editingCriteriaId ? 'تعديل معيار التقييم' : 'إضافة معيار تقييم جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCriteriaModalOpen(false)}
                className="p-1.5 text-[#86efac] hover:text-white rounded-lg cursor-pointer hover:bg-[#022c22]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCriteriaForm} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
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
                    className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-xs text-[#f0f9f6] outline-none"
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
                    className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-xs text-[#f0f9f6] outline-none"
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
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-xs text-[#f0f9f6] outline-none"
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
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-2.5 px-3.5 text-xs text-[#f0f9f6] outline-none"
                      dir="rtl"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 p-4 sm:p-5 border-t border-[#065f46] shrink-0 bg-[#022c22]/95">
                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#86efac] hover:bg-[#064e3b] cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm bg-[#064e3b] border border-red-500/50 rounded-2xl sm:rounded-[32px] p-5 sm:p-6 shadow-2xl space-y-4 text-center my-auto animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">تأكيد حذف معيار التقييم</h3>
              <p className="text-xs text-[#86efac]/90 mt-1">
                هل أنت متأكد من رغبتك في حذف معيار <span className="text-[#fbbf24] font-bold">"{critToDelete.name}"</span>؟
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => setCritToDelete(null)}
                className="w-full sm:flex-1 py-2.5 rounded-2xl text-xs font-bold bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
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
                className="w-full sm:flex-1 py-2.5 rounded-2xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-lg cursor-pointer transition-all"
              >
                نعم، احذف المعيار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
