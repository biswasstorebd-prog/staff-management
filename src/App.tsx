/**
 * Staff Movement & Attendance Management System
 * স্টাফ মুভমেন্ট ও হাজিরা ব্যবস্থাপনা সিস্টেম
 *
 * Integrated Enterprise Architecture:
 * 1. Main Shell & Navigation (Sidebar + Topbar with live Bengali clock & SecuGen indicator)
 * 2. Multi-Role Authentication & Perspectives:
 *    - Administrator
 *    - Manager
 *    - Teller
 *    - DSR
 *    - Other Staff
 * 3. Modules:
 *    - Dashboard (Central Real-time overview)
 *    - Staff Management (All 5 roles)
 *    - Biometric Enrollment (SecuGen WebAPI integration)
 *    - Universal Attendance Register
 *    - Staff Movement / Gate Pass (Field movement & tracking)
 *    - DSR Money Movement (Core: Given & Taken stored as separate records)
 *    - Manager Desk (Approval & monitoring)
 *    - Teller Desk (Cash counter balancing)
 *    - Reports & Export (CSV, print)
 *    - System Audit & Backup
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HeaderBar, SYSTEM_USERS } from './components/HeaderBar';
import { Sidebar, MainNavSection } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { StaffDirectoryView } from './components/views/StaffDirectoryView';
import { BiometricView } from './components/views/BiometricView';
import { UniversalAttendanceView } from './components/views/UniversalAttendanceView';
import { MovementView } from './components/views/MovementView';
import { DSRModuleView } from './components/views/DSRModuleView';
import { ManagerDeskView } from './components/views/ManagerDeskView';
import { TellerDeskView } from './components/views/TellerDeskView';
import { ReportsView } from './components/views/ReportsView';
import { AuditBackupView } from './components/views/AuditBackupView';

// Core DSR Modals
import { NewDailyEntryModal } from './components/NewDailyEntryModal';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { StaffManagerModal } from './components/StaffManagerModal';
import { VoucherPrintModal } from './components/VoucherPrintModal';

import { storage } from './services/storage';
import {
  DSRStaff,
  AttendanceRecord,
  FinancialTransaction,
  DailyDSRSummaryItem,
  SystemUser,
} from './types';
import { CheckCircle2, ShieldCheck, Menu, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<SystemUser>(SYSTEM_USERS[0]); // Defaults to Administrator
  const [activeSection, setActiveSection] = useState<MainNavSection>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-03');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Application Data States
  const [staffList, setStaffList] = useState<DSRStaff[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailyDSRSummaryItem[]>([]);

  // Modals
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [newEntryDsrId, setNewEntryDsrId] = useState<string | undefined>(undefined);
  const [isQuickTxnOpen, setIsQuickTxnOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<FinancialTransaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reload data from storage
  const loadData = useCallback(() => {
    const staff = storage.getStaff();
    const att = storage.getAttendanceRecords();
    const txns = storage.getTransactions();
    const summaries = storage.getDailySummaries(selectedDate);

    setStaffList(staff);
    setAttendanceRecords(att);
    setTransactions(txns);
    setDailySummaries(summaries);
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenNewEntry = (dsrId?: string) => {
    setNewEntryDsrId(dsrId);
    setIsNewEntryOpen(true);
  };

  const handleEntrySuccess = () => {
    loadData();
    showToast('ডিএসআর দৈনিক ভিজিট ও ক্যাশ মুভমেন্ট সংরক্ষিত হয়েছে। পৃথক ভাউচার তৈরি সম্পন্ন!');
  };

  const handleQuickTxnSuccess = () => {
    loadData();
    showToast('আর্থিক লেনদেন সফলভাবে অডিট লেজারে যুক্ত হয়েছে।');
  };

  const handleResetData = () => {
    if (window.confirm('বেঞ্চমার্ক ডাটাতে রিসেট করবেন (রহিম ০৩-০৯-২০২৬ সক্রিয় থাকবে)?')) {
      storage.resetAllData();
      loadData();
      showToast('ডাটাবেস ডিফল্ট বেঞ্চমার্কে রিসেট করা হয়েছে।');
    }
  };

  const pendingApprovalsCount = storage.getMovementRecords(selectedDate).filter(
    m => m.approvalStatus === 'Pending'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* Top Header Bar */}
      <HeaderBar
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        onOpenNewVisit={() => handleOpenNewEntry()}
        onResetData={handleResetData}
      />

      {/* Main Layout: Sidebar + Content Area */}
      <div className="flex-1 flex w-full relative">
        {/* Mobile Sidebar Toggle Button */}
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-3 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer border border-indigo-400"
          >
            {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar for Desktop */}
        <div className="hidden md:block">
          <Sidebar
            currentSection={activeSection}
            onSelectSection={setActiveSection}
            userRole={currentUser.role}
            pendingApprovalsCount={pendingApprovalsCount}
          />
        </div>

        {/* Sidebar Mobile Drawer */}
        {isMobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex">
            <div className="w-64 bg-slate-900 h-full shadow-2xl animate-in slide-in-from-left duration-200">
              <Sidebar
                currentSection={activeSection}
                onSelectSection={sec => {
                  setActiveSection(sec);
                  setIsMobileSidebarOpen(false);
                }}
                userRole={currentUser.role}
                pendingApprovalsCount={pendingApprovalsCount}
              />
            </div>
            <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
          </div>
        )}

        {/* Dynamic Center Main Content Area */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto overflow-x-hidden">
          {activeSection === 'dashboard' && (
            <DashboardView
              currentDate={selectedDate}
              currentUser={currentUser}
              onNavigate={setActiveSection}
              onOpenNewVisit={() => handleOpenNewEntry()}
              onOpenNewMovement={() => setActiveSection('movement')}
            />
          )}

          {activeSection === 'staff' && <StaffDirectoryView />}

          {activeSection === 'biometric' && <BiometricView />}

          {activeSection === 'attendance' && (
            <UniversalAttendanceView currentDate={selectedDate} />
          )}

          {activeSection === 'movement' && (
            <MovementView currentDate={selectedDate} currentUser={currentUser} />
          )}

          {activeSection === 'dsr' && (
            <DSRModuleView
              dailySummaries={dailySummaries}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onOpenNewEntry={handleOpenNewEntry}
              onViewVoucher={setSelectedVoucher}
              allTransactions={transactions}
              staffList={staffList}
              attendanceRecords={attendanceRecords}
              onOpenQuickTxn={() => setIsQuickTxnOpen(true)}
              onOpenStaffModal={() => setIsStaffModalOpen(true)}
              onRefresh={loadData}
            />
          )}

          {activeSection === 'manager' && (
            <ManagerDeskView currentDate={selectedDate} currentUser={currentUser} />
          )}

          {activeSection === 'teller' && (
            <TellerDeskView
              currentDate={selectedDate}
              currentUser={currentUser}
              onOpenNewVisit={() => handleOpenNewEntry()}
            />
          )}

          {activeSection === 'reports' && <ReportsView currentDate={selectedDate} />}

          {activeSection === 'audit' && (
            <AuditBackupView onResetData={handleResetData} />
          )}
        </main>
      </div>

      {/* Global Enterprise Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3.5 px-6 text-center text-xs text-slate-400 print:hidden z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>স্টাফ মুভমেন্ট ও সার্বজনীন হাজিরা ব্যবস্থাপনা সিস্টেম</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
              কর্পোরেট সংস্করণ ১.০
            </span>
          </div>
          <div className="text-slate-400 text-[11px]">
            নীতিমালা: ডিএসআর অফিসে জমা ও নেওয়া টাকা পৃথক ট্রানজেকশন রেকর্ডে সংরক্ষিত।
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isNewEntryOpen && (
        <NewDailyEntryModal
          isOpen={isNewEntryOpen}
          onClose={() => setIsNewEntryOpen(false)}
          onSuccess={handleEntrySuccess}
          staffList={staffList}
          selectedDate={selectedDate}
          initialDsrId={newEntryDsrId}
        />
      )}

      {isQuickTxnOpen && (
        <QuickTransactionModal
          isOpen={isQuickTxnOpen}
          onClose={() => setIsQuickTxnOpen(false)}
          onSuccess={handleQuickTxnSuccess}
          staffList={staffList}
          selectedDate={selectedDate}
        />
      )}

      {isStaffModalOpen && (
        <StaffManagerModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          staffList={staffList}
          onRefresh={loadData}
        />
      )}

      {selectedVoucher && (
        <VoucherPrintModal
          transaction={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
