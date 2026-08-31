import React, { useState } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileJson,
  ShieldCheck,
  Server
} from 'lucide-react';
import { OmranDataService } from '../../lib/firebase';
import { FullBackupData } from '../../types';

interface DataBackupTabProps {
  onRefreshAllData: () => Promise<void>;
}

export const DataBackupTab: React.FC<DataBackupTabProps> = ({
  onRefreshAllData
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<FullBackupData | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle Full Export
  const handleExport = async () => {
    setIsExporting(true);
    setStatusMsg(null);
    try {
      const backupData = await OmranDataService.exportFullBackup();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `omran_quran_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({
        type: 'success',
        text: 'تم تصدير النسخة الاحتياطية الكاملة لبيانات المنصة بنجاح!'
      });
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: 'فشل تصدير النسخة الاحتياطية: ' + (e.message || 'خطأ غير معروف')
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Upload Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        setStatusMsg(null);
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as FullBackupData;

        if (!parsed.students || !Array.isArray(parsed.students)) {
          throw new Error('الملف المرفوع لا يحتوي على بيانات طلاب صالحة.');
        }

        setPendingRestore(parsed);
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: 'فشل استيراد الملف: ' + (err.message || 'الملف غير صالح')
        });
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    try {
      setIsImporting(true);
      await OmranDataService.importFullBackup(pendingRestore);
      await onRefreshAllData();
      setStatusMsg({
        type: 'success',
        text: `تمت استعادة النسخة الاحتياطية بنجاح (${pendingRestore.students.length} طالب)!`
      });
      setPendingRestore(null);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'فشل استعادة البيانات: ' + (err.message || 'خطأ غير معروف')
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-[#fbbf24]" />
            <span>إدارة النسخ الاحتياطي واستيراد وتصدير البيانات</span>
          </h2>
          <p className="text-xs text-[#86efac]/90 mt-1">
            حفظ واسترجاع كامل بيانات المنصة (الطلاب، الحضور، التقييمات، الخطط الذكية، الإعدادات)
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-5 rounded-[24px] text-xs sm:text-sm font-bold flex items-center gap-3 backdrop-blur-md ${
            statusMsg.type === 'success'
              ? 'bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24]'
              : 'bg-red-500/20 border border-red-500/40 text-red-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0 text-[#fbbf24]" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-300" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-[#fbbf24]/40 text-[#fbbf24] flex items-center justify-center shadow-md">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-heading text-white">
              تصدير نسخة احتياطية كاملة (JSON)
            </h3>
            <p className="text-xs text-[#86efac]/80 leading-relaxed">
              تحميل ملف بصيغة JSON يحتوي على جميع بيانات الطلاب، وسجلات الحضور اليومية، ودرجات التقييمات، والخطط المولدة، والمحادثات مع الذكاء الاصطناعي لحفظها على جهازك بأمان.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-[#064e3b] font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#064e3b]" />
            <span>{isExporting ? 'جاري تجهيز النسخة...' : 'تحميل النسخة الاحتياطية الآن'}</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#022c22] border border-[#065f46] text-[#86efac] flex items-center justify-center shadow-md">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-heading text-white">
              استعادة / استيراد بيانات سابقة
            </h3>
            <p className="text-xs text-[#86efac]/80 leading-relaxed">
              اختر ملف نسخة احتياطية بصيغة JSON تم تصديره مسبقاً لاستعادة جميع الطلاب وسجلاتهم في قاعدة بيانات المنصة ومزامنتها فوراً.
            </p>
          </div>

          <label className="w-full py-3.5 px-5 rounded-2xl bg-[#022c22] hover:bg-[#065f46] border border-[#065f46] text-[#86efac] hover:text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-[#fbbf24]" />
            <span>{isImporting ? 'جاري الاستيراد...' : 'اختر ملف النسخة الاحتياطية (.json)'}</span>
            <input
              type="file"
              accept=".json"
              disabled={isImporting}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Cloud Sync Status info */}
      <div className="bg-[#064e3b]/40 border border-[#065f46] rounded-[32px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#86efac]/80 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-[#022c22] text-[#fbbf24] flex items-center justify-center border border-[#065f46]">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">مشروع فايربيس السحابي المتصل:</span>
            <span className="font-mono text-[#fbbf24]">omran-ffbad (Firestore Realtime)</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[#fbbf24] font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>المزامنة السحابية النشطة مفعلة</span>
        </div>
      </div>

      {/* Restore Backup Confirmation Modal */}
      {pendingRestore && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#064e3b] border border-[#fbbf24]/50 rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center mx-auto border border-[#fbbf24]/30">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">تأكيد استعادة النسخة الاحتياطية</h3>
              <p className="text-xs text-[#86efac]/90 mt-2 leading-relaxed">
                هل أنت متأكد من استعادة هذه النسخة؟
                <br />
                تحتوي على <span className="text-[#fbbf24] font-bold">({pendingRestore.students?.length || 0})</span> طالباً و <span className="text-[#fbbf24] font-bold">({pendingRestore.attendance?.length || 0})</span> سجل حضور.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingRestore(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-[#022c22] text-[#86efac] hover:text-white border border-[#065f46] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isImporting}
                className="flex-1 py-2.5 rounded-2xl text-xs font-black bg-[#fbbf24] hover:bg-[#f59e0b] text-[#064e3b] shadow-lg cursor-pointer transition-all"
              >
                {isImporting ? 'جاري الاستعادة...' : 'نعم، استعادة البيانات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
