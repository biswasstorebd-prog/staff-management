import React from 'react';
import { FinancialTransaction } from '../types';
import { formatBDT, numberToWordsBDT, formatDateDDMMYYYY } from '../utils/formatters';
import { Printer, X, CheckCircle2, Building2, Calendar, User, Clock, FileText } from 'lucide-react';

interface VoucherPrintModalProps {
  transaction: FinancialTransaction | null;
  onClose: () => void;
}

export const VoucherPrintModal: React.FC<VoucherPrintModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const isGiven = transaction.type === 'GIVEN';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white"
      id="voucher-modal-overlay"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden print:shadow-none print:border-none print:w-full"
        id="voucher-modal-card"
      >
        {/* Modal Top Bar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">
              Financial Voucher Preview & Audit Record
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="print-voucher-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Slip / Challan
            </button>
            <button
              onClick={onClose}
              id="close-voucher-modal-btn"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Voucher Body */}
        <div className="p-8 text-slate-800 print:p-6" id="printable-voucher-content">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6 text-center relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="w-6 h-6 text-slate-900" />
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                AGENT BANKING CASH & BALANCE SETTLEMENT SLIP
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              এজেন্ট ব্যাংকিং আউটলেট — মূল ব্যাংক ডিএসআর ক্যাশ ও ব্যালেন্স হস্তান্তর চালান
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-200 pt-3">
              <div>
                <span className="text-slate-500 font-medium">VOUCHER NO: </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {transaction.voucherNo}
                </span>
              </div>
              {transaction.requisitionNo && (
                <div>
                  <span className="text-slate-500 font-medium">REQ SLIP: </span>
                  <span className="font-mono font-bold text-indigo-700">
                    {transaction.requisitionNo}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-500 font-medium">DATE: </span>
                <span className="font-bold text-slate-900">
                  {formatDateDDMMYYYY(transaction.date)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">TIME: </span>
                <span className="font-bold text-slate-900">{transaction.time}</span>
              </div>
            </div>
          </div>

          {/* Movement Type Tag */}
          <div className="mb-6 flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500 block mb-1">
                Transaction Classification (লেনদেনের ধরণ)
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    isGiven
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isGiven
                    ? 'মূল ব্যাংক থেকে ক্যাশ/ব্যালেন্স রিফিল (CREDIT)'
                    : 'আউটলেট থেকে মূল ব্যাংকে ক্যাশ প্রেরণ (DEBIT)'}
                </span>
                <span className="text-xs text-slate-600 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                  মাধ্যম: {transaction.medium || transaction.paymentMode || 'Cash'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500 block mb-1">
                Total Transaction Value
              </span>
              <span
                className={`text-2xl font-extrabold font-mono ${
                  isGiven ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {formatBDT(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Particulars Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50">
                  <td className="py-2.5 px-4 font-semibold text-slate-600 w-1/3">
                    মূল ব্যাংক ডিএসআর (প্রতিনিধি)
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 text-sm">
                    {transaction.dsrName}
                  </td>
                </tr>
                {transaction.parentBank && (
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-600">
                      নিয়োগকারী মূল ব্যাংক (Principal Bank)
                    </td>
                    <td className="py-2.5 px-4 font-bold text-indigo-800">
                      {transaction.parentBank}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">
                    Purpose / Reason (কারণ ও বিবরণ)
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    {transaction.reason || 'Agent Banking Daily Cash Requisition / Deposit'}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2.5 px-4 font-semibold text-slate-600">
                    Amount In Words (BDT)
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 italic">
                    {numberToWordsBDT(transaction.amount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">
                    আউটলেট কর্মকর্তা যাচাইকরণ
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-700">
                    {transaction.verifiedBy || 'Outlet Cashier / Manager'}
                  </td>
                </tr>
                {transaction.remarks && (
                  <tr className="bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-600">Remarks / Memo</td>
                    <td className="py-2.5 px-4 text-slate-700">{transaction.remarks}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Audit Rule Reminder */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-800 mb-8 leading-relaxed">
            <span className="font-bold">এজেন্ট ব্যাংকিং অডিট নির্দেশনা:</span> ডিএসআর মূল ব্যাংকের প্রতিনিধি হিসেবে আউটলেটের চাহিদা মোতাবেক ক্যাশ ও ব্যালেন্স ডেলিভারি করেন। এই লেনদেনটি সম্পূর্ণ স্বতন্ত্র অপরিবর্তনযোগ্য আর্থিক ভাউচার হিসেবে সংরক্ষিত।
          </div>

          {/* Signature Boxes */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-center">
            <div>
              <div className="h-16 flex items-center justify-center mb-1">
                {transaction.signature ? (
                  <img
                    src={transaction.signature}
                    alt="DSR Signature"
                    className="max-h-14 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs italic text-slate-400 font-serif">
                    (ডিএসআরের স্বাক্ষর সংরক্ষিত)
                  </span>
                )}
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="text-xs font-bold text-slate-800">
                  {transaction.dsrName}
                </p>
                <p className="text-[10px] text-slate-500 uppercase">
                  মূল ব্যাংক ডিএসআর / ডেলিভারি প্রতিনিধি
                </p>
              </div>
            </div>

            <div>
              <div className="h-16 flex items-center justify-center mb-1">
                <span className="text-xs font-semibold text-emerald-700 font-mono tracking-wider">
                  RECEIVED & VERIFIED IN OUTLET
                </span>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="text-xs font-bold text-slate-800">
                  {transaction.verifiedBy || 'আউটলেট ক্যাশিয়ার / ব্যবস্থাপক'}
                </p>
                <p className="text-[10px] text-slate-500 uppercase">
                  আউটলেট অনুমোদিত স্বাক্ষর
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info (hidden in print) */}
        <div className="bg-slate-50 px-8 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center print:hidden">
          <span>Record ID: {transaction.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
