import React, { useState, useEffect } from 'react';
import { StaffRole, SystemUser } from '../types';
import { formatBengaliLiveDate } from '../utils/formatters';
import {
  Building2,
  Clock,
  Fingerprint,
  RotateCcw,
  PlusCircle,
  CheckCircle2,
  ChevronDown,
  UserCheck,
  Shield,
} from 'lucide-react';

export const SYSTEM_USERS: SystemUser[] = [
  {
    id: 'emp_admin_1',
    username: 'admin',
    displayName: 'আনিসুর রহমান',
    role: 'Administrator',
    designation: 'সিস্টেম অ্যাডমিনিস্ট্রেটর ও শাখা প্রধান',
    avatarText: 'আ',
  },
  {
    id: 'emp_mgr_1',
    username: 'manager',
    displayName: 'ফারুক আহমেদ',
    role: 'Manager',
    designation: 'অপারেশনস ও ব্রাঞ্চ ম্যানেজার',
    avatarText: 'ফা',
  },
  {
    id: 'emp_tlr_1',
    username: 'teller',
    displayName: 'হাসান মাহমুদ',
    role: 'Teller',
    designation: 'চিফ ক্যাশিয়ার ও ট্রেজারি অফিসার',
    avatarText: 'হা',
  },
  {
    id: 'dsr_1',
    username: 'dsr_rahim',
    displayName: 'রহিম উদ্দিন',
    role: 'DSR',
    designation: 'সিনিয়র ডিএসআর (ধানমন্ডি রুট)',
    avatarText: 'র',
  },
  {
    id: 'emp_stf_1',
    username: 'nusrat',
    displayName: 'নুসরাত জাহান',
    role: 'Other Staff',
    designation: 'সিনিয়র অ্যাকাউন্টস অফিসার',
    avatarText: 'নু',
  },
];

interface HeaderBarProps {
  currentUser: SystemUser;
  onSelectUser: (user: SystemUser) => void;
  onOpenNewVisit: () => void;
  onResetData: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentUser,
  onSelectUser,
  onOpenNewVisit,
  onResetData,
}) => {
  const [timeState, setTimeState] = useState(formatBengaliLiveDate(new Date()));
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState(formatBengaliLiveDate(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadgeStyle = (role: StaffRole) => {
    switch (role) {
      case 'Administrator':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Manager':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Teller':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'DSR':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const getRoleBengaliName = (role: StaffRole) => {
    switch (role) {
      case 'Administrator':
        return 'অ্যাডমিনিস্ট্রেটর';
      case 'Manager':
        return 'ম্যানেজার';
      case 'Teller':
        return 'টেলার / ক্যাশিয়ার';
      case 'DSR':
        return 'ডিএসআর';
      default:
        return 'সাধারণ কর্মী';
    }
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md print:hidden">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-15 gap-2 sm:gap-4">
          {/* System Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-xs border border-indigo-400/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                  স্টাফ মুভমেন্ট ও হাজিরা সিস্টেম
                </h1>
                <span className="hidden xl:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                  ঢাকা কর্পোরেট হেড অফিস
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 hidden sm:block leading-none mt-0.5">
                Staff Movement, Attendance & DSR Cash Management System
              </p>
            </div>
          </div>

          {/* Center: Live Bengali Clock & Biometric Status (Compact) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Clock */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/90 rounded-md border border-slate-700 text-xs text-slate-200">
              <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="font-mono font-bold text-indigo-200">{timeState.timeStr}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">{timeState.dateStr}</span>
            </div>

            {/* biometricapp.exe Local API :5050 Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 rounded-md border border-emerald-800/50 text-[11px] text-emerald-300"
              title="Local biometricapp.exe HTTP API (:5050) Ready for Fingerprint Capture & Verification"
            >
              <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono font-medium hidden lg:inline">biometricapp.exe :5050 প্রস্তুত</span>
              <span className="font-medium lg:hidden">:5050 সক্রিয়</span>
            </div>
          </div>

          {/* Right: Role Switcher & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Reset Benchmark Button */}
            <button
              onClick={onResetData}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="ডিফল্ট বেঞ্চমার্ক ডাটা রিসেট করুন (Rahim 03-09-2026)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Quick Visit / Transaction Button */}
            <button
              onClick={onOpenNewVisit}
              id="header-quick-visit-btn"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ ভিজিট / ক্যাশ এন্ট্রি</span>
            </button>

            {/* User & Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 border border-slate-700 transition cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 flex items-center justify-center font-bold text-xs">
                  {currentUser.avatarText}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {currentUser.displayName}
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                        currentUser.role
                      )}`}
                    >
                      {getRoleBengaliName(currentUser.role)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    {currentUser.designation}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-850 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 animate-in fade-in duration-150">
                  <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-700">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                      সিস্টেম রোল ও ইউজার পরিবর্তন করুন
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      ভূমিকা পরিবর্তন করে সংশ্লিষ্ট মডিউলের অনুমতি পরীক্ষা করুন
                    </p>
                  </div>
                  <div className="py-1 divide-y divide-slate-800/80">
                    {SYSTEM_USERS.map(user => {
                      const isSelected = user.id === currentUser.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            onSelectUser(user);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 flex items-center justify-between text-left transition cursor-pointer hover:bg-slate-800 ${
                            isSelected ? 'bg-indigo-950/60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs">
                              {user.avatarText}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                {user.displayName}
                                <span
                                  className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                                    user.role
                                  )}`}
                                >
                                  {getRoleBengaliName(user.role)}
                                </span>
                              </div>
                              <div className="text-[10.5px] text-slate-400">{user.designation}</div>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
