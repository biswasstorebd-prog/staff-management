import React, { useState } from 'react';
import { FinancialTransaction, DSRStaff, MovementType } from '../types';
import { formatBDT, formatDateDDMMYYYY } from '../utils/formatters';
import {
  FileText,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  Calendar,
  Eye,
  CheckCircle2,
  Code2,
  X,
  Plus,
} from 'lucide-react';

interface AuditLedgerViewProps {
  transactions: FinancialTransaction[];
  staffList: DSRStaff[];
  onViewVoucher: (txn: FinancialTransaction) => void;
  onOpenQuickTxn: () => void;
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({
  transactions,
  staffList,
  onViewVoucher,
  onOpenQuickTxn,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'GIVEN' | 'TAKEN'>('ALL');
  const [selectedDsr, setSelectedDsr] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [inspectedTxn, setInspectedTxn] = useState<FinancialTransaction | null>(null);

  // Apply filters
  const filteredTxns = transactions.filter(t => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (selectedDsr !== 'ALL' && t.dsrId !== selectedDsr) return false;
    if (dateFilter && t.date !== dateFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchVoucher = t.voucherNo.toLowerCase().includes(q);
      const matchDsr = t.dsrName.toLowerCase().includes(q);
      const matchReason = t.reason.toLowerCase().includes(q);
      const matchReq = t.requisitionNo ? t.requisitionNo.toLowerCase().includes(q) : false;
      const matchBank = t.parentBank ? t.parentBank.toLowerCase().includes(q) : false;
      if (!matchVoucher && !matchDsr && !matchReason && !matchReq && !matchBank) return false;
    }
    return true;
  });

  // Calculate totals
  const totalGivenAmount = filteredTxns
    .filter(t => t.type === 'GIVEN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTakenAmount = filteredTxns
    .filter(t => t.type === 'TAKEN')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6" id="audit-ledger-container">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                DSR Money Movement Audit History & Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Complete historical audit trail — all &quot;Given&quot; and &quot;Taken&quot; transactions are isolated
                and immutable.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQuickTxn}
            id="quick-voucher-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Post Financial Voucher
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Movement Type Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              id="filter-all-btn"
              className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('GIVEN')}
              id="filter-given-btn"
              className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                filterType === 'GIVEN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Given To Office
            </button>
            <button
              onClick={() => setFilterType('TAKEN')}
              id="filter-taken-btn"
              className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                filterType === 'TAKEN'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Taken From Office
            </button>
          </div>

          {/* DSR Filter & Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* DSR Select */}
            <select
              value={selectedDsr}
              onChange={e => setSelectedDsr(e.target.value)}
              id="filter-dsr-select"
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="ALL">All DSR Staff</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.staffCode})
                </option>
              ))}
            </select>

            {/* Date filter */}
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                id="filter-date-input"
                className="bg-transparent text-xs font-medium focus:outline-hidden"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-slate-400 hover:text-slate-600 font-bold ml-1 cursor-pointer"
                  title="Clear date"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search row */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Voucher #, DSR Name, or Purpose..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              id="audit-search-input"
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-emerald-700">
              Total Given: <span className="font-mono">{formatBDT(totalGivenAmount)}</span>
            </span>
            <span className="text-amber-700">
              Total Taken: <span className="font-mono">{formatBDT(totalTakenAmount)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Audit History Table */}
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
        id="audit-history-table-card"
      >
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Financial Transaction Records ({filteredTxns.length} Vouchers)
          </span>
          <span className="text-[11px] text-slate-500">
            Indexed for historical audit & reconciliation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="audit-transactions-table">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">DSR Staff</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Reason / Particulars</th>
                <th className="py-3 px-4">Officer / Sign</th>
                <th className="py-3 px-4 text-center">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTxns.map(t => {
                  const isGiven = t.type === 'GIVEN';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      {/* Voucher No */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 block w-fit">
                          {t.voucherNo}
                        </span>
                        {t.requisitionNo && (
                          <span className="text-[10px] text-indigo-700 font-mono font-medium block mt-0.5">
                            Req: {t.requisitionNo}
                          </span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {formatDateDDMMYYYY(t.date)}
                        </div>
                        <div className="text-[11px] text-slate-500">{t.time}</div>
                      </td>

                      {/* DSR Staff */}
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div>{t.dsrName}</div>
                        {t.parentBank && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            {t.parentBank}
                          </div>
                        )}
                      </td>

                      {/* Movement Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isGiven
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {isGiven ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          {isGiven ? 'Money Given (রিফিল)' : 'Money Taken (ব্যাংকে ফেরত)'}
                        </span>
                        {t.medium && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            মাধ্যম: {t.medium}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3 px-4 text-right font-mono font-extrabold text-sm whitespace-nowrap ${
                          isGiven ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isGiven ? '+' : '-'}
                        {formatBDT(t.amount)}
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 max-w-xs text-slate-700">
                        <p className="line-clamp-2" title={t.reason}>
                          {t.reason}
                        </p>
                        {t.remarks && (
                          <p className="text-[11px] text-slate-400 italic truncate mt-0.5">
                            Note: {t.remarks}
                          </p>
                        )}
                      </td>

                      {/* Officer & Signature */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 text-[11px]">
                          {t.verifiedBy}
                        </div>
                        {t.signature ? (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Signed
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Office sealed</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewVoucher(t)}
                            id={`view-voucher-btn-${t.id}`}
                            className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold cursor-pointer transition flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            Print Slip
                          </button>
                          <button
                            onClick={() => setInspectedTxn(t)}
                            title="Inspect Raw Audit Record"
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Audit Record Inspection Modal */}
      {inspectedTxn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          id="raw-audit-modal"
        >
          <div className="bg-slate-900 text-slate-100 rounded-xl max-w-xl w-full p-6 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Audit Record JSON: {inspectedTxn.voucherNo}
                </h3>
              </div>
              <button
                onClick={() => setInspectedTxn(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="text-xs font-mono bg-slate-950 p-4 rounded-lg overflow-x-auto text-emerald-400 max-h-80 border border-slate-800">
              {JSON.stringify(inspectedTxn, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setInspectedTxn(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
