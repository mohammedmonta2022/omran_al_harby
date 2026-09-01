import React from 'react';
import {
  BookOpen,
  LogOut,
  UserCheck,
  Calendar,
  Sparkles,
  ShieldAlert,
  Moon,
  Clock,
  Users
} from 'lucide-react';
import { UserRole, AppSettings } from '../types';

interface NavbarProps {
  currentUser: { username: string; role: UserRole; studentId?: string } | null;
  onLogout: () => void;
  settings: AppSettings;
  studentsCount: number;
  teachersCount?: number;
  onOpenTeacherManagement?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  settings,
  studentsCount,
  teachersCount = 1,
  onOpenTeacherManagement
}) => {
  const todayArabic = new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 bg-[#064e3b]/95 backdrop-blur-xl border-b border-[#065f46] px-4 lg:px-8 py-3.5 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#fbbf24] text-[#064e3b] shadow-[0_0_20px_rgba(251,191,36,0.35)] border border-[#fbbf24]">
            <span className="font-heading font-black text-2xl">ع</span>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border-2 border-[#064e3b]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold font-heading tracking-tight text-[#fbbf24] flex items-center gap-1.5">
                مَنَصَّةُ عُمْرَان
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#022c22] text-[#86efac] border border-[#065f46] font-sans font-medium">
                  الذكية
                </span>
              </h1>
            </div>
            <p className="text-xs text-[#86efac]/90 font-medium line-clamp-1">
              {settings.halaqahName}
            </p>
          </div>
        </div>

        {/* Center Info Bar (Desktop) */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 px-4 py-1.5 rounded-2xl bg-[#022c22]/70 border border-[#065f46] text-xs text-[#f0f9f6]">
          <div className="flex items-center gap-2 text-[#86efac]">
            <Calendar className="w-4 h-4 text-[#fbbf24]" />
            <span>{todayArabic}</span>
          </div>
          {currentUser?.role === 'admin' && (
            <>
              <span className="w-1 h-1 rounded-full bg-[#065f46]" />
              <div className="flex items-center gap-1.5 text-[#fbbf24] font-bold">
                <UserCheck className="w-4 h-4" />
                <span>{studentsCount} طالباً مسجلاً</span>
              </div>
            </>
          )}
        </div>

        {/* Right User & Actions */}
        <div className="flex items-center gap-2.5">
          {currentUser?.role === 'admin' && onOpenTeacherManagement && (
            <button
              onClick={onOpenTeacherManagement}
              title="إدارة حسابات المعلمين وإضافة معلم ثانٍ"
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-2xl bg-[#022c22] hover:bg-[#065f46] border border-[#fbbf24]/30 hover:border-[#fbbf24] text-xs font-bold text-[#fbbf24] shadow-sm transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span className="hidden sm:inline">إدارة المعلمين</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#064e3b] text-[#86efac] font-mono font-bold">
                {teachersCount}
              </span>
            </button>
          )}

          {currentUser && (
            <div className="flex items-center gap-2.5 bg-[#022c22]/80 border border-[#065f46] rounded-2xl px-3.5 py-1.5 shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#fbbf24] flex items-center justify-center text-sm font-bold border border-emerald-500/30">
                {currentUser.username.charAt(0)}
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  {currentUser.username}
                </div>
                <div className="text-[10px] text-[#86efac]">
                  {currentUser.role === 'admin' ? 'معلم / مشرف الحلقة' : 'حساب طالب'}
                </div>
              </div>

              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="mr-2 p-1.5 text-slate-300 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
