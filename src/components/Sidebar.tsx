import React from 'react';
import { StaffRole } from '../types';
import {
  LayoutDashboard,
  Users,
  Fingerprint,
  CalendarCheck,
  Navigation,
  Banknote,
  UserCheck2,
  Receipt,
  FileBarChart2,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

export type MainNavSection =
  | 'dashboard'
  | 'staff'
  | 'biometric'
  | 'attendance'
  | 'movement'
  | 'dsr'
  | 'manager'
  | 'teller'
  | 'reports'
  | 'audit';

interface NavItem {
  id: MainNavSection;
  labelBn: string;
  labelEn: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: StaffRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    labelBn: 'মূল ড্যাশবোর্ড',
    labelEn: 'Dashboard Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'staff',
    labelBn: 'কর্মী ব্যবস্থাপনা',
    labelEn: 'Staff Management (5 Roles)',
    icon: Users,
    badge: '৫ ক্যাটাগরি',
  },
  {
    id: 'biometric',
    labelBn: 'বায়োমেট্রিক এনরোলমেন্ট',
    labelEn: 'SecuGen Fingerprint',
    icon: Fingerprint,
    badge: 'WebAPI',
  },
  {
    id: 'attendance',
    labelBn: 'সার্বজনীন হাজিরা খাতা',
    labelEn: 'Universal Attendance',
    icon: CalendarCheck,
  },
  {
    id: 'movement',
    labelBn: 'স্টাফ মুভমেন্ট / গেটপাস',
    labelEn: 'Field & Gate Pass',
    icon: Navigation,
    badge: 'অনুমোদন',
  },
  {
    id: 'dsr',
    labelBn: 'ডিএসআর ক্যাশ মুভমেন্ট',
    labelEn: 'DSR Money Movement (Core)',
    icon: Banknote,
    badge: 'আলাদা লেজার',
  },
  {
    id: 'manager',
    labelBn: 'ম্যানেজার ডেস্ক',
    labelEn: 'Approvals & Monitoring',
    icon: UserCheck2,
  },
  {
    id: 'teller',
    labelBn: 'টেলার ক্যাশ কাউন্টার',
    labelEn: 'Teller Cash Balancing',
    icon: Receipt,
  },
  {
    id: 'reports',
    labelBn: 'রিপোর্ট ও এক্সপোর্ট',
    labelEn: 'Reports, CSV & Print',
    icon: FileBarChart2,
  },
  {
    id: 'audit',
    labelBn: 'সিস্টেম অডিট ও ব্যাকআপ',
    labelEn: 'Audit Trail & Backup',
    icon: ShieldAlert,
  },
];

interface SidebarProps {
  currentSection: MainNavSection;
  onSelectSection: (section: MainNavSection) => void;
  userRole: StaffRole;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  userRole,
  pendingApprovalsCount = 0,
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-60px)] shadow-lg print:hidden">
      {/* Role Notice */}
      <div className="px-4 py-3 bg-slate-850 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            সক্রিয় এক্সেস মোড
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {userRole}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
          মেনু থেকে আপনার দায়িত্ব সংশ্লিষ্ট মডিউল বেছে নিন
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = currentSection === item.id;
          const Icon = item.icon;
          const showPendingBadge = item.id === 'manager' && pendingApprovalsCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              id={`nav-item-${item.id}`}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer group ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-300'
                  }`}
                />
                <div className="truncate">
                  <div className="text-xs leading-tight font-semibold">{item.labelBn}</div>
                  <div
                    className={`text-[10px] leading-tight truncate ${
                      isActive ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {item.labelEn}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {showPendingBadge ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                    {pendingApprovalsCount}
                  </span>
                ) : item.badge ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      isActive
                        ? 'bg-indigo-500 text-indigo-50'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-white translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">ডাটাবেস স্থিতি:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            অফলাইন নিরাপদ / সিঙ্কড
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">ডিএসআর আর্থিক নিয়ম:</span>
          <span className="text-indigo-300 font-semibold">আলাদা ট্রানজেকশন</span>
        </div>
      </div>
    </aside>
  );
};
