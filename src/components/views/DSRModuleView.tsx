import React, { useState } from 'react';
import {
  DailyDSRSummaryItem,
  FinancialTransaction,
  DSRStaff,
  AttendanceRecord,
} from '../../types';
import { DailySummaryView } from '../DailySummaryView';
import { AuditLedgerView } from '../AuditLedgerView';
import { AttendanceView } from '../AttendanceView';
import {
  FileSpreadsheet,
  History,
  UserCheck,
  PlusCircle,
  Users,
  Banknote,
  ShieldCheck,
} from 'lucide-react';

interface DSRModuleViewProps {
  dailySummaries: DailyDSRSummaryItem[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenNewEntry: (dsrId?: string) => void;
  onViewVoucher: (txn: FinancialTransaction) => void;
  allTransactions: FinancialTransaction[];
  staffList: DSRStaff[];
  attendanceRecords: AttendanceRecord[];
  onOpenQuickTxn: () => void;
  onOpenStaffModal: () => void;
  onRefresh: () => void;
}

export const DSRModuleView: React.FC<DSRModuleViewProps> = ({
  dailySummaries,
  selectedDate,
  onDateChange,
  onOpenNewEntry,
  onViewVoucher,
  allTransactions,
  staffList,
  attendanceRecords,
  onOpenQuickTxn,
  onOpenStaffModal,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'audit' | 'attendance'>('summary');

  return (
    <div className="space-y-5 pb-12">
      {/* Module Title Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                মূল ব্যাংক ডিএসআর ক্যাশ ও ব্যালেন্স মডিউল (Principal Bank DSR Logistics)
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  স্বতন্ত্র ফিন্যান্সিয়াল লেজার
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                মূল ব্যাংক থেকে ক্যাশ/ব্যালেন্স সরবরাহ (Given) এবং আউটলেটের ক্যাশ মূল ব্যাংকে প্রেরণ (Taken) সম্পূর্ণ পৃথক অডিট ভাউচারে সংরক্ষিত
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenStaffModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>মূল ব্যাংক ডিএসআর তালিকা</span>
          </button>

          <button
            onClick={() => onOpenNewEntry()}
            id="dsr-module-record-visit-btn"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ ক্যাশ/ব্যালেন্স ডেলিভারি এন্ট্রি</span>
          </button>
        </div>
      </div>

      {/* Agent Banking Context Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-950 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
            <span>এজেন্ট ব্যাংকিং পার্টনারশিপ নোট (Agent Banking Cash & Balance Workflow)</span>
          </div>
          <p className="text-blue-900 leading-relaxed text-xs">
            ডিএসআর (DSR) আমাদের নিজস্ব আউটলেটের নিয়োগপ্রাপ্ত কর্মী নন—তিনি <strong>মূল ব্যাংক কর্তৃক নিয়োগপ্রাপ্ত প্রতিনিধি</strong>।
            আউটলেটের চাহিদা মতো তিনি ব্যাংক থেকে নগদ ক্যাশ ও ইলেকট্রনিক ব্যালেন্স সরবরাহ করেন এবং আউটলেটের বাড়তি নগদ টাকা মূল ব্যাংকে ফেরত নিয়ে যান।
            প্রতিটি আগমন, প্রস্থান, সরবরাহকৃত অর্থ (Given) এবং ব্যাংকে প্রেরিত অর্থ (Taken) সম্পূর্ণ স্বতন্ত্র আর্থিক ভাউচারে নথিভুক্ত থাকে।
          </p>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-xl text-xs font-bold w-fit">
        <button
          onClick={() => setActiveSubTab('summary')}
          id="dsr-subtab-summary"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition cursor-pointer ${
            activeSubTab === 'summary'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>১. দৈনিক ডিএসআর সামারি শিট (Summary Sheet)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          id="dsr-subtab-audit"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>২. অর্থ ও ব্যালেন্স নিরীক্ষা খতিয়ান (Audit Ledger)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          id="dsr-subtab-attendance"
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>৩. ব্যাংক ডিএসআর ডেলিভারি খাতা (Delivery Log)</span>
        </button>
      </div>

      {/* Sub Views */}
      {activeSubTab === 'summary' && (
        <DailySummaryView
          summaries={dailySummaries}
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          onOpenNewEntry={onOpenNewEntry}
          onViewVoucher={onViewVoucher}
          allTransactions={allTransactions}
        />
      )}

      {activeSubTab === 'audit' && (
        <AuditLedgerView
          transactions={allTransactions}
          staffList={staffList}
          onViewVoucher={onViewVoucher}
          onOpenQuickTxn={onOpenQuickTxn}
        />
      )}

      {activeSubTab === 'attendance' && (
        <AttendanceView
          attendanceRecords={attendanceRecords}
          staffList={staffList}
          onRefresh={onRefresh}
          selectedDate={selectedDate}
          onDateChange={onDateChange}
        />
      )}
    </div>
  );
};
