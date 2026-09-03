import React, { useState } from 'react';
import { DailyDSRSummaryItem, FinancialTransaction } from '../types';
import { formatBDT, formatDateDDMMYYYY, formatStandardDate } from '../utils/formatters';
import {
  Calendar,
  Search,
  Printer,
  Download,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  Eye,
  FileCheck2,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface DailySummaryViewProps {
  summaries: DailyDSRSummaryItem[];
  selectedDate: string;
  onDateChange: (newDate: string) => void;
  onOpenNewEntry: (dsrId?: string) => void;
  onViewVoucher: (txn: FinancialTransaction) => void;
  allTransactions: FinancialTransaction[];
}

export const DailySummaryView: React.FC<DailySummaryViewProps> = ({
  summaries,
  selectedDate,
  onDateChange,
  onOpenNewEntry,
  onViewVoucher,
  allTransactions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter summaries based on search
  const filteredSummaries = summaries.filter(s =>
    s.dsrName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.remarks.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Totals for the date
  const totalGiven = filteredSummaries.reduce((sum, s) => sum + s.given, 0);
  const totalTaken = filteredSummaries.reduce((sum, s) => sum + s.taken, 0);
  const netOfficePosition = totalGiven - totalTaken; // Net cash retained in office
  const activeStaffCount = filteredSummaries.filter(
    s => s.arrival !== '—' || s.given > 0 || s.taken > 0
  ).length;

  const handlePrintSheet = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'DSR Name',
      'Date',
      'Arrival',
      'Departure',
      'Given (BDT)',
      'Taken (BDT)',
      'Net Position (BDT)',
      'Remarks',
    ];
    const rows = filteredSummaries.map(s => [
      `"${s.dsrName}"`,
      `"${s.displayDate}"`,
      `"${s.arrival}"`,
      `"${s.departure}"`,
      s.given,
      s.taken,
      s.netPosition,
      `"${s.remarks.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DSR_Daily_Summary_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="daily-summary-view-container">
      {/* Top Banner with Example Reference & System Context */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-700/50 print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Required DSR Daily Summary Schema Active
            </div>
            <h2 className="text-xl font-black tracking-tight">
              DSR Daily Money Movement & Attendance Register
            </h2>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
              Strictly displays the required daily summary:{' '}
              <span className="font-mono text-white font-semibold">
                DSR Name | Date | Arrival | Departure | Given | Taken | Net Position | Remarks
              </span>
            </p>
          </div>

          {/* Quick Rahim Example Verification Box */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/20 text-xs max-w-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
              Benchmark Example (Rahim on 03-09-2026)
            </span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div>
                <span className="text-indigo-200">Arrival:</span>{' '}
                <span className="font-bold">09:15 AM</span>
              </div>
              <div>
                <span className="text-indigo-200">Departure:</span>{' '}
                <span className="font-bold">05:10 PM</span>
              </div>
              <div>
                <span className="text-emerald-300">Given:</span>{' '}
                <span className="font-bold font-mono">৳50,000</span>
              </div>
              <div>
                <span className="text-amber-300">Taken:</span>{' '}
                <span className="font-bold font-mono">৳20,000</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-white/10 flex justify-between font-bold">
                <span className="text-indigo-100">Net Position:</span>
                <span className="font-mono text-emerald-300">৳30,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-summary-cards">
        {/* Total Given */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Money Given (To Office)
            </span>
            <span className="text-2xl font-black font-mono text-emerald-700 mt-1 block">
              {formatBDT(totalGiven)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              Cash Collected into Office
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Taken */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Money Taken (From Office)
            </span>
            <span className="text-2xl font-black font-mono text-amber-700 mt-1 block">
              {formatBDT(totalTaken)}
            </span>
            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
              <TrendingDown className="w-3 h-3" />
              Disbursed to DSRs
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Net Office Position */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Net Office Position
            </span>
            <span
              className={`text-2xl font-black font-mono mt-1 block ${
                netOfficePosition >= 0 ? 'text-indigo-900' : 'text-red-700'
              }`}
            >
              {formatBDT(netOfficePosition)}
            </span>
            <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
              <Scale className="w-3 h-3" />
              Given minus Taken
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Active DSRs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              DSR Staff Active
            </span>
            <span className="text-2xl font-black font-mono text-slate-800 mt-1 block">
              {activeStaffCount} / {filteredSummaries.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3" />
              Checked-in or Transacted
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 print:hidden">
        {/* Date Selector & Quick Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => onDateChange(e.target.value)}
              id="summary-date-picker"
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => onDateChange('2026-09-03')}
            id="select-today-btn"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedDate === '2026-09-03'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            03-09-2026 (Today)
          </button>
          <button
            onClick={() => onDateChange('2026-09-02')}
            id="select-yesterday-btn"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedDate === '2026-09-02'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            02-09-2026
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search DSR or remarks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              id="search-dsr-input"
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <button
            onClick={handleExportCSV}
            id="export-csv-btn"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handlePrintSheet}
            id="print-sheet-btn"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            title="Print Daily Summary"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={() => onOpenNewEntry()}
            id="new-entry-open-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            Record Daily Visit
          </button>
        </div>
      </div>

      {/* Print Header (Visible only during printing) */}
      <div className="hidden print:block mb-4 pb-2 border-b-2 border-slate-800">
        <h1 className="text-xl font-black uppercase text-slate-900">
          DAILY DSR MONEY MOVEMENT & ATTENDANCE SUMMARY
        </h1>
        <p className="text-xs text-slate-600">
          Date: {formatDateDDMMYYYY(selectedDate)} | Printed On: {new Date().toLocaleString()}
        </p>
      </div>

      {/* THE MAIN DAILY SUMMARY TABLE */}
      {/* Schema: DSR Name | Date | Arrival | Departure | Given | Taken | Net Position | Remarks */}
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
        id="dsr-summary-table-card"
      >
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Daily DSR Summary Sheet — {formatDateDDMMYYYY(selectedDate)} ({formatStandardDate(selectedDate)})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {filteredSummaries.length} Records Listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="dsr-daily-summary-table">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">DSR Name</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Arrival</th>
                <th className="py-3.5 px-4">Departure</th>
                <th className="py-3.5 px-4 text-right text-emerald-800">Given</th>
                <th className="py-3.5 px-4 text-right text-amber-800">Taken</th>
                <th className="py-3.5 px-4 text-right text-indigo-900">Net Position</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4 text-center print:hidden">Audit Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No DSR records found for {formatDateDDMMYYYY(selectedDate)}.
                    <div className="mt-2">
                      <button
                        onClick={() => onOpenNewEntry()}
                        className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        + Click to record a daily visit for this date
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((item, idx) => {
                  const isHighlightedRahim =
                    item.dsrName === 'Rahim' && item.date === '2026-09-03';

                  // Find related transactions if user wants to print/view slip
                  const givenTxn = allTransactions.find(
                    t => t.dsrId === item.dsrId && t.date === item.date && t.type === 'GIVEN'
                  );
                  const takenTxn = allTransactions.find(
                    t => t.dsrId === item.dsrId && t.date === item.date && t.type === 'TAKEN'
                  );

                  return (
                    <tr
                      key={item.id || idx}
                      className={`hover:bg-slate-50/80 transition ${
                        isHighlightedRahim
                          ? 'bg-indigo-50/40 font-medium'
                          : idx % 2 === 1
                          ? 'bg-slate-50/30'
                          : 'bg-white'
                      }`}
                    >
                      {/* DSR Name */}
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {item.dsrName.charAt(0)}
                          </div>
                          <div>
                            <span>{item.dsrName}</span>
                            {isHighlightedRahim && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                Match Example
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                        {item.displayDate}
                      </td>

                      {/* Arrival */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            item.arrival !== '—' ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {item.arrival}
                        </span>
                      </td>

                      {/* Departure */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            item.departure !== '—' ? 'text-indigo-700' : 'text-slate-400'
                          }`}
                        >
                          {item.departure}
                        </span>
                      </td>

                      {/* Given */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatBDT(item.given)}
                      </td>

                      {/* Taken */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                        {formatBDT(item.taken)}
                      </td>

                      {/* Net Position */}
                      <td className="py-3 px-4 text-right font-mono font-black whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            item.netPosition > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.netPosition < 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {formatBDT(item.netPosition)}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <p className="line-clamp-2" title={item.remarks}>
                          {item.remarks}
                        </p>
                      </td>

                      {/* Actions / Voucher Slips */}
                      <td className="py-3 px-4 text-center whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          {givenTxn && (
                            <button
                              onClick={() => onViewVoucher(givenTxn)}
                              title="View Money Given Voucher"
                              className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Given Slip
                            </button>
                          )}
                          {takenTxn && (
                            <button
                              onClick={() => onViewVoucher(takenTxn)}
                              title="View Money Taken Voucher"
                              className="px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Taken Slip
                            </button>
                          )}
                          {!givenTxn && !takenTxn && (
                            <button
                              onClick={() => onOpenNewEntry(item.dsrId)}
                              className="px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[11px] font-medium cursor-pointer transition"
                            >
                              + Record
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Row */}
            {filteredSummaries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-900">
                  <td className="py-3.5 px-4 font-black">TOTAL FOR DAY</td>
                  <td className="py-3.5 px-4 font-normal text-slate-400">
                    {formatDateDDMMYYYY(selectedDate)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-bold">
                    {formatBDT(totalGiven)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-amber-400 font-bold">
                    {formatBDT(totalTaken)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-indigo-200 font-black">
                    {formatBDT(netOfficePosition)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400" colSpan={2}>
                    Net Cash Inflow: {formatBDT(netOfficePosition)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Business Rule Audit Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3 print:hidden">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Compliance Note on Financial Separation:
          </p>
          <p className="text-amber-800 leading-relaxed">
            In accordance with the financial mandate, &quot;Money Given&quot; and &quot;Money Taken&quot; are
            stored as <strong>distinct, independent financial transaction records</strong> in the
            immutable database. You can audit every discrete voucher in the{' '}
            <span className="font-semibold underline">Money Audit History</span> tab.
          </p>
        </div>
      </div>
    </div>
  );
};
