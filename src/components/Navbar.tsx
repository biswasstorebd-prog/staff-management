import React from 'react';
import {
  FileSpreadsheet,
  History,
  UserCheck,
  Users,
  PlusCircle,
  RotateCcw,
  Building,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

export type ActiveTab = 'summary' | 'audit' | 'attendance';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewEntry: () => void;
  onOpenStaffModal: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewEntry,
  onOpenStaffModal,
  onResetData,
}) => {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight flex items-center gap-2 text-white">
                DSR DAILY MONEY MOVEMENT
                <span className="hidden md:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Audit Verified
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Attendance & Separate Financial Records (Given / Taken)
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setActiveTab('summary')}
              id="nav-tab-summary"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Daily Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              id="nav-tab-audit"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Money Audit Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              id="nav-tab-attendance"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Attendance Register</span>
              <span className="sm:hidden">Attendance</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStaffModal}
              id="open-staff-modal-btn"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Manage DSR Staff & Routes"
            >
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline">DSR Staff</span>
            </button>

            <button
              onClick={onResetData}
              id="reset-demo-data-btn"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="Reset Sample Data (e.g. Rahim 03-09-2026)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenNewEntry}
              id="navbar-new-entry-btn"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Record Visit</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
