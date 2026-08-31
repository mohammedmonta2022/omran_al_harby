import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  Calendar,
  Save,
  CheckCheck,
  UserCheck,
  AlertCircle,
  Search,
  History,
  FileText
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../../types';

interface AttendanceTabProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onSaveAttendance: (records: AttendanceRecord[]) => Promise<void>;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  students,
  attendanceRecords,
  onSaveAttendance
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Current working attendance state for selectedDate (studentId -> { status, note })
  const [statusMap, setStatusMap] = useState<Record<string, { status: AttendanceStatus; note: string }>>(() => {
    const map: Record<string, { status: AttendanceStatus; note: string }> = {};
    const dateRecords = attendanceRecords.filter(r => r.date === selectedDate);
    students.forEach(s => {
      const existing = dateRecords.find(r => r.studentId === s.id);
      map[s.id] = {
        status: existing?.status || 'حاضر',
        note: existing?.note || ''
      };
    });
    return map;
  });

  // Re-sync when selectedDate changes
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSaveMessage('');
    const dateRecords = attendanceRecords.filter(r => r.date === newDate);
    const newMap: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach(s => {
      const existing = dateRecords.find(r => r.studentId === s.id);
      newMap[s.id] = {
        status: existing?.status || 'حاضر',
        note: existing?.note || ''
      };
    });
    setStatusMap(newMap);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatusMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setStatusMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  const handleMarkAllPresent = () => {
    setStatusMap(prev => {
      const updated = { ...prev };
      students.forEach(s => {
        updated[s.id] = {
          status: 'حاضر',
          note: prev[s.id]?.note || ''
        };
      });
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const recordsToSave: AttendanceRecord[] = students.map(s => {
        const entry = statusMap[s.id] || { status: 'حاضر', note: '' };
        return {
          id: `${selectedDate}_${s.id}`,
          date: selectedDate,
          studentId: s.id,
          status: entry.status,
          note: entry.note,
          savedAt: new Date().toISOString()
        };
      });

      await onSaveAttendance(recordsToSave);
      setSaveMessage('تم حفظ سجل الحضور والغياب بنجاح!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e: any) {
      setSaveMessage('حدث خطأ أثناء الحفظ.');
    } finally {
      setIsSaving(false);
    }
  };

  // Stats for the chosen date
  const statusValues = Object.values(statusMap) as Array<{ status: AttendanceStatus; note: string }>;
  const counts = {
    present: statusValues.filter(v => v.status === 'حاضر').length,
    absent: statusValues.filter(v => v.status === 'غائب').length,
    late: statusValues.filter(v => v.status === 'متأخر').length,
    excused: statusValues.filter(v => v.status === 'معتذر').length
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Date Selector */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#fbbf24]" />
            <span>تسجيل الحضور والغياب اليومي</span>
          </h2>
          <p className="text-xs text-[#86efac]/90 mt-1">
            حدد حضور الطلاب وغيابهم والأعذار لإرسال التقارير اليومية لأولياء الأمور
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-[#022c22] border border-[#065f46] px-3.5 py-2 rounded-2xl">
            <Calendar className="w-4 h-4 text-[#fbbf24]" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-[#f0f9f6] outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#022c22] hover:bg-[#022c22]/80 border border-[#065f46] text-[#fbbf24] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4" />
            <span>سجل الأيام السابقة</span>
          </button>
        </div>
      </div>

      {/* Stats Ribbon & Quick Action */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#064e3b]/70 border border-[#065f46] rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-[#86efac] font-bold">حاضر</span>
            <div className="text-2xl font-bold text-[#fbbf24] font-heading">{counts.present}</div>
          </div>
          <CheckCircle className="w-6 h-6 text-[#fbbf24]" />
        </div>

        <div className="bg-[#064e3b]/70 border border-[#065f46] rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-red-300 font-bold">غائب</span>
            <div className="text-2xl font-bold text-red-300 font-heading">{counts.absent}</div>
          </div>
          <XCircle className="w-6 h-6 text-red-400" />
        </div>

        <div className="bg-[#064e3b]/70 border border-[#065f46] rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-amber-300 font-bold">متأخر</span>
            <div className="text-2xl font-bold text-amber-300 font-heading">{counts.late}</div>
          </div>
          <Clock className="w-6 h-6 text-amber-400" />
        </div>

        <div className="bg-[#064e3b]/70 border border-[#065f46] rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-emerald-300 font-bold">معتذر</span>
            <div className="text-2xl font-bold text-emerald-300 font-heading">{counts.excused}</div>
          </div>
          <HelpCircle className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] overflow-hidden shadow-xl backdrop-blur-md">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#065f46] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث في أسماء الطلاب..."
              className="w-full bg-[#022c22] border border-[#065f46] rounded-2xl py-2 px-3.5 pr-9 text-xs text-[#f0f9f6] placeholder-[#86efac]/40 outline-none"
              dir="rtl"
            />
            <Search className="w-3.5 h-3.5 text-[#86efac]/60 absolute right-3 top-3" />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2 rounded-2xl bg-[#022c22] hover:bg-[#022c22]/80 border border-[#065f46] text-[#86efac] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-[#fbbf24]" />
              <span>تحديد الجميع حاضر</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-[#064e3b] text-xs font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ كشف الحضور'}</span>
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="p-3 bg-[#fbbf24]/20 border-b border-[#fbbf24]/40 text-[#fbbf24] text-xs font-bold text-center">
            {saveMessage}
          </div>
        )}

        {/* Student Rows */}
        <div className="divide-y divide-[#065f46]/60">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-[#86efac]/60 text-xs">
              لا يوجد طلاب مسجلون لعرض الحضور.
            </div>
          ) : (
            filteredStudents.map((student, idx) => {
              const currentStatus = statusMap[student.id]?.status || 'حاضر';
              const currentNote = statusMap[student.id]?.note || '';

              return (
                <div
                  key={student.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#022c22]/40 transition-colors"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-8 h-8 rounded-xl bg-[#022c22] border border-[#065f46] text-[#fbbf24] text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{student.name}</h4>
                      <p className="text-[11px] text-[#86efac]/80">
                        {student.currentSurahName} (آية {student.currentAyah}) • ولي الأمر:{' '}
                        {student.parentName}
                      </p>
                    </div>
                  </div>

                  {/* 4 Status Buttons */}
                  <div className="flex items-center gap-1.5 bg-[#022c22] p-1.5 rounded-2xl border border-[#065f46] shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'حاضر')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        currentStatus === 'حاضر'
                          ? 'bg-[#fbbf24] text-[#064e3b] font-black shadow-md'
                          : 'text-[#86efac]/80 hover:text-white'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>حاضر</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'غائب')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        currentStatus === 'غائب'
                          ? 'bg-red-600 text-white font-black shadow-md'
                          : 'text-[#86efac]/80 hover:text-white'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>غائب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'متأخر')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        currentStatus === 'متأخر'
                          ? 'bg-amber-600 text-white font-black shadow-md'
                          : 'text-[#86efac]/80 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>متأخر</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'معتذر')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        currentStatus === 'معتذر'
                          ? 'bg-emerald-600 text-white font-black shadow-md'
                          : 'text-[#86efac]/80 hover:text-white'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>معتذر</span>
                    </button>
                  </div>

                  {/* Note / Excuse field */}
                  <div className="flex-1 min-w-[180px]">
                    <input
                      type="text"
                      value={currentNote}
                      onChange={e => handleNoteChange(student.id, e.target.value)}
                      placeholder={
                        currentStatus === 'معتذر'
                          ? 'اكتب سبب العذر أو الملاحظة...'
                          : currentStatus === 'غائب'
                          ? 'سبب الغياب إن وجد...'
                          : 'ملاحظة حضور (اختياري)...'
                      }
                      className="w-full bg-[#022c22] border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-1.5 px-3 text-xs text-[#f0f9f6] placeholder-[#86efac]/40 outline-none"
                      dir="rtl"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Full History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#064e3b] border border-[#fbbf24]/40 rounded-2xl sm:rounded-[32px] shadow-2xl shadow-emerald-950/80 max-h-[90vh] flex flex-col my-auto overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#065f46] shrink-0 bg-[#064e3b]">
              <h3 className="text-sm sm:text-base font-bold text-[#fbbf24] flex items-center gap-2 font-heading">
                <History className="w-5 h-5 text-[#fbbf24] shrink-0" />
                <span>سجل الحضور والغياب التراكمي لجميع الطلاب</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-3">
              {students.map(student => {
                const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
                const total = studentRecords.length;
                const presents = studentRecords.filter(r => r.status === 'حاضر').length;
                const absents = studentRecords.filter(r => r.status === 'غائب').length;
                const excuseds = studentRecords.filter(r => r.status === 'معتذر').length;
                const lates = studentRecords.filter(r => r.status === 'متأخر').length;
                const rate = total > 0 ? Math.round(((presents + lates) / total) * 100) : 100;

                return (
                  <div
                    key={student.id}
                    className="p-3.5 sm:p-4 bg-[#022c22]/80 border border-[#065f46] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{student.name}</h4>
                      <p className="text-[#86efac] mt-0.5">
                        إجمالي الأيام المسجلة: {total} يوم
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-[#fbbf24]/20 text-[#fbbf24] font-bold text-[11px]">
                        حاضر: {presents}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-300 text-[11px]">
                        غائب: {absents}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-[#86efac] text-[11px]">
                        معتذر: {excuseds}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#fbbf24] text-[#064e3b] font-black text-xs shadow-sm">
                        نسبة الالتزام: {rate}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
