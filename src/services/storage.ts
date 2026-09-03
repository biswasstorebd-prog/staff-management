import {
  DSRStaff,
  StaffMember,
  StaffRole,
  FinancialTransaction,
  AttendanceRecord,
  StaffMovementRecord,
  SystemAuditEntry,
  DailyDSRVisitForm,
  DailyDSRSummaryItem,
  MovementType,
  BranchOutlet,
  StaffMonthlyReport,
} from '../types';
import { formatDateDDMMYYYY } from '../utils/formatters';
import {
  calculateLateMinutes,
  calculateEarlyMinutes,
  calculateOvertimeMinutes,
  calculateDurationMinutes,
} from '../utils/timeCalculators';

const STORAGE_KEYS = {
  STAFF_MEMBERS: 'staff_master_members_v1',
  STAFF: 'dsr_staff_list_v1', // backward compatibility
  ATTENDANCE: 'dsr_attendance_records_v1',
  MOVEMENTS: 'staff_movement_records_v1',
  TRANSACTIONS: 'dsr_financial_transactions_v1',
  AUDIT_LOGS: 'system_audit_logs_v1',
  ACTIVE_USER: 'system_active_user_role_v1',
  META_SETTINGS: 'dsr_settings_v1',
  OUTLETS: 'agent_outlets_list_v1',
  SELECTED_OUTLET: 'selected_outlet_id_v1',
  OFFLINE_QUEUE: 'offline_sync_queue_v1',
};

export const DEFAULT_BRANCH_OUTLETS: BranchOutlet[] = [
  {
    id: 'outlet_1',
    code: 'OUT-01',
    name: 'ঢাকা প্রধান আউটলেট (Dhaka Sadar Head Outlet)',
    nameBn: 'ঢাকা প্রধান এজেন্ট আউটলেট',
    location: 'মতিঝিল বা/এ, ঢাকা',
    isDefault: true,
  },
  {
    id: 'outlet_2',
    code: 'OUT-02',
    name: 'মিরপুর শাখা আউটলেট (Mirpur Branch Outlet)',
    nameBn: 'মিরপুর শাখা এজেন্ট আউটলেট',
    location: 'মিরপুর-১০ গোলচত্বর, ঢাকা',
  },
  {
    id: 'outlet_3',
    code: 'OUT-03',
    name: 'উত্তরা এজেন্ট ব্যাংকিং পয়েন্ট (Uttara Point)',
    nameBn: 'উত্তরা এজেন্ট ব্যাংকিং পয়েন্ট',
    location: 'সেক্টর-৭, রবীন্দ্র সরণি, উত্তরা',
  },
  {
    id: 'outlet_4',
    code: 'OUT-04',
    name: 'চট্টগ্রাম বাণিজ্যিক হাব (Agrabad Hub)',
    nameBn: 'চট্টগ্রাম বাণিজ্যিক হাব আউটলেট',
    location: 'আগ্রাবাদ বা/এ, চট্টগ্রাম',
  },
];

// Enterprise Staff Master across all 5 roles
export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'emp_admin_1',
    staffCode: 'ADM-001',
    name: 'Anisur Rahman',
    nameBn: 'আনিসুর রহমান',
    role: 'Administrator',
    designation: 'এজেন্ট আউটলেট স্বত্বাধিকারী ও শাখা প্রধান',
    department: 'এজেন্ট আউটলেট প্রশাসন',
    branchId: 'outlet_1',
    branchName: 'ঢাকা প্রধান আউটলেট',
    shiftStartTime: '09:00 AM',
    shiftEndTime: '05:00 PM',
    employmentType: 'INTERNAL_OUTLET',
    phone: '+880 1711-001122',
    email: 'admin.outlet@agentbank.com',
    baseOpeningBalance: 0,
    status: 'active',
    fingerprintEnrolled: true,
    fingerprintEnrolledAt: '2026-01-10T10:00:00Z',
    joinedDate: '2023-01-01',
  },
  {
    id: 'emp_mgr_1',
    staffCode: 'MGR-001',
    name: 'Faruk Ahmed',
    nameBn: 'ফারুক আহমেদ',
    role: 'Manager',
    designation: 'আউটলেট ও অপারেশনস ম্যানেজার',
    department: 'এজেন্ট আউটলেট ব্যবস্থাপনা',
    branchId: 'outlet_1',
    branchName: 'ঢাকা প্রধান আউটলেট',
    shiftStartTime: '09:00 AM',
    shiftEndTime: '05:00 PM',
    employmentType: 'INTERNAL_OUTLET',
    phone: '+880 1712-998877',
    email: 'faruk.mgr@agentbank.com',
    baseOpeningBalance: 0,
    status: 'active',
    fingerprintEnrolled: true,
    fingerprintEnrolledAt: '2026-01-12T11:00:00Z',
    joinedDate: '2023-03-15',
  },
  {
    id: 'emp_tlr_1',
    staffCode: 'TLR-001',
    name: 'Hasan Mahmud',
    nameBn: 'হাসান মাহমুদ',
    role: 'Teller',
    designation: 'প্রধান ক্যাশিয়ার ও টেলার অফিসার',
    department: 'ক্যাশ কাউন্টার ও ট্রেজারি',
    branchId: 'outlet_1',
    branchName: 'ঢাকা প্রধান আউটলেট',
    shiftStartTime: '09:00 AM',
    shiftEndTime: '05:00 PM',
    employmentType: 'INTERNAL_OUTLET',
    phone: '+880 1813-445566',
    email: 'hasan.teller@agentbank.com',
    baseOpeningBalance: 200000,
    status: 'active',
    fingerprintEnrolled: true,
    fingerprintEnrolledAt: '2026-01-15T09:30:00Z',
    joinedDate: '2023-06-01',
  },
  {
    id: 'dsr_1',
    staffCode: 'DSR-101',
    name: 'Rahim',
    nameBn: 'রহিম উদ্দিন',
    role: 'DSR',
    designation: 'মূল ব্যাংক প্রতিনিধি / DSR (ক্যাশ ও ব্যালেন্স ডেলিভারি)',
    department: 'মূল ব্যাংক অপারেশনস ও লজিস্টিকস',
    branchId: 'outlet_1',
    branchName: 'ঢাকা প্রধান আউটলেট',
    shiftStartTime: '09:00 AM',
    shiftEndTime: '05:00 PM',
    parentBank: 'মূল ব্যাংক (প্রধান শাখা)',
    employmentType: 'PARENT_BANK_DSR',
    phone: '+880 1712-345678',
    email: 'rahim.dsr@principalbank.com',
    route: 'ধানমন্ডি ও সংলগ্ন এজেন্ট আউটলেট রুট',
    baseOpeningBalance: 5000,
    status: 'active',
    fingerprintEnrolled: true,
    fingerprintEnrolledAt: '2026-02-01T09:15:00Z',
    joinedDate: '2024-01-15',
  },
  {
    id: 'dsr_2',
    staffCode: 'DSR-102',
    name: 'Karim',
    nameBn: 'করিম মিয়া',
    role: 'DSR',
    designation: 'মূল ব্যাংক প্রতিনিধি / DSR (ব্যালেন্স সরবরাহ)',
    department: 'মূল ব্যাংক অপারেশনস ও লজিস্টিকস',
    parentBank: 'মূল ব্যাংক (মিরপুর শাখা)',
    employmentType: 'PARENT_BANK_DSR',
    phone: '+880 1819-876543',
    route: 'মিরপুর ও গাবতলী জোন',
    baseOpeningBalance: 4000,
    status: 'active',
    fingerprintEnrolled: true,
    fingerprintEnrolledAt: '2026-02-03T10:00:00Z',
    joinedDate: '2024-02-01',
  },
  {
    id: 'dsr_3',
    staffCode: 'DSR-103',
    name: 'Tanvir',
    nameBn: 'তানভীর হাসান',
    role: 'DSR',
    designation: 'মূল ব্যাংক প্রতিনিধি / DSR (ক্যাশ সরবরাহ)',
    department: 'মূল ব্যাংক অপারেশনস ও লজিস্টিকস',
    parentBank: 'মূল ব্যাংক (গুলশান শাখা)',
    employmentType: 'PARENT_BANK_DSR',
    phone: '+880 1911-223344',
    route: 'মহাখালী ও গুলশান জোন',
    baseOpeningBalance: 3500,
    status: 'active',
    fingerprintEnrolled: true,
    fingerprintEnrolledAt: '2026-02-10T09:40:00Z',
    joinedDate: '2024-04-10',
  },
  {
    id: 'dsr_4',
    staffCode: 'DSR-104',
    name: 'Salam',
    nameBn: 'সালাম চৌধুরী',
    role: 'DSR',
    designation: 'মূল ব্যাংক সিনিয়র DSR',
    department: 'মূল ব্যাংক অপারেশনস ও লজিস্টিকস',
    parentBank: 'মূল ব্যাংক (সদরঘাট শাখা)',
    employmentType: 'PARENT_BANK_DSR',
    phone: '+880 1610-998877',
    route: 'পুরান ঢাকা বাণিজ্যিক আউটলেট জোন',
    baseOpeningBalance: 6000,
    status: 'active',
    fingerprintEnrolled: true,
    fingerprintEnrolledAt: '2026-02-12T10:15:00Z',
    joinedDate: '2024-05-01',
  },
  {
    id: 'dsr_5',
    staffCode: 'DSR-105',
    name: 'Mamun',
    nameBn: 'মামুন খান',
    role: 'DSR',
    designation: 'মূল ব্যাংক DSR (রিফিল অফিসার)',
    department: 'মূল ব্যাংক অপারেশনস ও লজিস্টিকস',
    parentBank: 'মূল ব্যাংক (উত্তরা শাখা)',
    employmentType: 'PARENT_BANK_DSR',
    phone: '+880 1515-667788',
    route: 'উত্তরা ও টঙ্গী জোন',
    baseOpeningBalance: 5000,
    status: 'active',
    fingerprintEnrolled: false,
    joinedDate: '2024-06-15',
  },
  {
    id: 'emp_stf_1',
    staffCode: 'STF-201',
    name: 'Nusrat Jahan',
    nameBn: 'নুসরাত জাহান',
    role: 'Other Staff',
    designation: 'সিনিয়র অ্যাকাউন্টস ও কাস্টমার সার্ভিস অফিসার',
    department: 'এজেন্ট আউটলেট সার্ভিস',
    employmentType: 'INTERNAL_OUTLET',
    phone: '+880 1722-113355',
    email: 'nusrat.outlet@agentbank.com',
    baseOpeningBalance: 0,
    status: 'active',
    fingerprintEnrolled: true,
    fingerprintEnrolledAt: '2026-01-20T10:00:00Z',
    joinedDate: '2024-03-01',
  },
  {
    id: 'emp_stf_2',
    staffCode: 'STF-202',
    name: 'Kabir Hossain',
    nameBn: 'কবির হোসেন',
    role: 'Other Staff',
    designation: 'অফিস সহকারী ও ডকুমেন্ট সাপোর্ট',
    department: 'এজেন্ট আউটলেট অপারেশনস',
    employmentType: 'INTERNAL_OUTLET',
    phone: '+880 1833-224466',
    baseOpeningBalance: 0,
    status: 'active',
    fingerprintEnrolled: true,
    fingerprintEnrolledAt: '2026-01-22T09:00:00Z',
    joinedDate: '2024-07-01',
  },
];

// Default seed DSR Staff (backward-compatible view)
const DEFAULT_STAFF: DSRStaff[] = DEFAULT_STAFF_MEMBERS.filter(s => s.role === 'DSR').map(s => ({
  id: s.id,
  name: s.name,
  staffCode: s.staffCode,
  phone: s.phone,
  route: s.route || 'General Area',
  baseOpeningBalance: s.baseOpeningBalance,
  status: s.status,
}));

// Default Universal Staff Movements / Gate Pass
export const DEFAULT_MOVEMENTS: StaffMovementRecord[] = [
  {
    id: 'mov_20260903_001',
    tokenNo: 'MOV-20260903-001',
    staffId: 'emp_stf_1',
    staffName: 'Nusrat Jahan',
    staffRole: 'Other Staff',
    date: '2026-09-03',
    outTime: '10:30 AM',
    expectedReturnTime: '12:30 PM',
    actualReturnTime: '12:15 PM',
    purposeType: 'Bank work',
    destination: 'Dutch-Bangla Bank (Dhanmondi Branch)',
    remarks: 'Tax challan & daily collection cash deposit.',
    approvalStatus: 'Approved',
    approvedBy: 'Faruk Ahmed (Manager)',
    isCompleted: true,
    createdAt: '2026-09-03T10:30:00.000Z',
  },
  {
    id: 'mov_20260903_002',
    tokenNo: 'MOV-20260903-002',
    staffId: 'dsr_1',
    staffName: 'Rahim',
    staffRole: 'DSR',
    date: '2026-09-03',
    outTime: '09:40 AM',
    expectedReturnTime: '05:00 PM',
    actualReturnTime: '04:55 PM',
    purposeType: 'Market Cash Collection',
    destination: 'Dhanmondi & Mohammadpur Route Outlets',
    remarks: 'Scheduled retail market credit recovery.',
    approvalStatus: 'Approved',
    approvedBy: 'Faruk Ahmed (Manager)',
    isCompleted: true,
    createdAt: '2026-09-03T09:40:00.000Z',
  },
  {
    id: 'mov_20260903_003',
    tokenNo: 'MOV-20260903-003',
    staffId: 'emp_stf_2',
    staffName: 'Kabir Hossain',
    staffRole: 'Other Staff',
    date: '2026-09-03',
    outTime: '11:15 AM',
    expectedReturnTime: '01:30 PM',
    actualReturnTime: '01:05 PM',
    purposeType: 'Document submission',
    destination: 'Customs & VAT Circle Office',
    remarks: 'Monthly VAT return form submission.',
    approvalStatus: 'Approved',
    approvedBy: 'Faruk Ahmed (Manager)',
    isCompleted: true,
    createdAt: '2026-09-03T11:15:00.000Z',
  },
  {
    id: 'mov_20260903_004',
    tokenNo: 'MOV-20260903-004',
    staffId: 'dsr_2',
    staffName: 'Karim',
    staffRole: 'DSR',
    date: '2026-09-03',
    outTime: '10:00 AM',
    expectedReturnTime: '05:30 PM',
    actualReturnTime: '05:35 PM',
    purposeType: 'Market Cash Collection',
    destination: 'Mirpur Wholesale Cluster',
    remarks: 'Bulk merchant collections.',
    approvalStatus: 'Approved',
    approvedBy: 'Faruk Ahmed (Manager)',
    isCompleted: true,
    createdAt: '2026-09-03T10:00:00.000Z',
  },
];

// Default System Audit Logs
export const DEFAULT_AUDIT_LOGS: SystemAuditEntry[] = [
  {
    id: 'audit_001',
    timestamp: '2026-09-03T09:15:00.000Z',
    actor: 'Hasan Mahmud (Teller)',
    role: 'Teller',
    action: 'DISBURSE_FLOAT',
    module: 'DSR_FINANCE',
    details: 'Disbursed ৳20,000 to Rahim (DSR-101) under voucher V-TAK-20260903-001.',
  },
  {
    id: 'audit_002',
    timestamp: '2026-09-03T10:30:00.000Z',
    actor: 'Faruk Ahmed (Manager)',
    role: 'Manager',
    action: 'APPROVE_MOVEMENT',
    module: 'MOVEMENT',
    details: 'Approved Gate Pass MOV-20260903-001 for Nusrat Jahan (Bank work).',
  },
  {
    id: 'audit_003',
    timestamp: '2026-09-03T17:05:00.000Z',
    actor: 'Hasan Mahmud (Teller)',
    role: 'Teller',
    action: 'RECEIVE_COLLECTION',
    module: 'DSR_FINANCE',
    details: 'Received ৳50,000 from Rahim (DSR-101) under voucher V-GIV-20260903-001.',
  },
];


// Default seed attendance records (Logically separate from financial records)
const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_20260903_rahim',
    dsrId: 'dsr_1',
    dsrName: 'Rahim',
    date: '2026-09-03',
    arrivalTime: '09:15 AM',
    departureTime: '05:10 PM',
    status: 'Departed',
    remarks: 'Daily market collection round completed; all 24 retail outlets visited.',
    createdAt: '2026-09-03T09:15:00.000Z',
  },
  {
    id: 'att_20260903_karim',
    dsrId: 'dsr_2',
    dsrName: 'Karim',
    date: '2026-09-03',
    arrivalTime: '09:30 AM',
    departureTime: '05:45 PM',
    status: 'Departed',
    remarks: 'Mirpur key accounts recovery & order booking.',
    createdAt: '2026-09-03T09:30:00.000Z',
  },
  {
    id: 'att_20260903_tanvir',
    dsrId: 'dsr_3',
    dsrName: 'Tanvir',
    date: '2026-09-03',
    arrivalTime: '09:00 AM',
    departureTime: '04:30 PM',
    status: 'Departed',
    remarks: 'Mohakhali zone visited. Good cash collection.',
    createdAt: '2026-09-03T09:00:00.000Z',
  },
  {
    id: 'att_20260902_salam',
    dsrId: 'dsr_4',
    dsrName: 'Salam',
    date: '2026-09-02',
    arrivalTime: '09:10 AM',
    departureTime: '05:00 PM',
    status: 'Departed',
    remarks: 'Sadarghat wholesale market round.',
    createdAt: '2026-09-02T09:10:00.000Z',
  },
];

// Default seed financial transactions
// CRITICAL: "Money Given" and "Money Taken" are stored as SEPARATE financial records!
const DEFAULT_TRANSACTIONS: FinancialTransaction[] = [
  // Rahim on 03-09-2026: Given ৳50,000 (Voucher V-GIV-20260903-001) - Delivered from Principal Bank as per Demand
  {
    id: 'txn_giv_20260903_001',
    voucherNo: 'V-GIV-20260903-001',
    type: 'GIVEN',
    dsrId: 'dsr_1',
    dsrName: 'Rahim',
    date: '2026-09-03',
    time: '05:05 PM',
    amount: 50000,
    reason: 'মূল ব্যাংক থেকে ক্যাশ ও ইলেকট্রনিক ব্যালেন্স সরবরাহ (Bank Requisition Refill for Outlet)',
    paymentMode: 'Cash',
    medium: 'Both',
    requisitionNo: 'REQ-BNK-2026-089',
    parentBank: 'মূল ব্যাংক (প্রধান শাখা)',
    attendanceId: 'att_20260903_rahim',
    verifiedBy: 'প্রধান ক্যাশিয়ার (হাসান)',
    remarks: 'আউটলেটের চাহিদা মাফিক মূল ব্যাংক থেকে ক্যাশ ও ব্যালেন্স ডেলিভারি গৃহীত।',
    createdAt: '2026-09-03T17:05:00.000Z',
  },
  // Rahim on 03-09-2026: Taken ৳20,000 (Voucher V-TAK-20260903-001) - Sent to Principal Bank via DSR
  {
    id: 'txn_tak_20260903_001',
    voucherNo: 'V-TAK-20260903-001',
    type: 'TAKEN',
    dsrId: 'dsr_1',
    dsrName: 'Rahim',
    date: '2026-09-03',
    time: '09:20 AM',
    amount: 20000,
    reason: 'আউটলেটের অতিরিক্ত ক্যাশ মূল ব্যাংকে জমা প্রেরণ (Excess Cash Sent to Main Bank via DSR)',
    paymentMode: 'Cash',
    medium: 'Cash',
    requisitionNo: 'REQ-BNK-2026-089',
    parentBank: 'মূল ব্যাংক (প্রধান শাখা)',
    attendanceId: 'att_20260903_rahim',
    verifiedBy: 'আউটলেট ম্যানেজার (ফারুক)',
    remarks: 'আউটলেটের উদ্বৃত্ত ক্যাশ মূল ব্যাংকে জমা দিতে ডিএসআরের নিকট হস্তান্তর।',
    createdAt: '2026-09-03T09:20:00.000Z',
  },
  // Karim on 03-09-2026: Given ৳75,000
  {
    id: 'txn_giv_20260903_002',
    voucherNo: 'V-GIV-20260903-002',
    type: 'GIVEN',
    dsrId: 'dsr_2',
    dsrName: 'Karim',
    date: '2026-09-03',
    time: '05:40 PM',
    amount: 75000,
    reason: 'মূল ব্যাংক মিরপুর শাখা থেকে ক্যাশ ব্যালেন্স রিফিল ডেলিভারি',
    paymentMode: 'Cash',
    medium: 'Cash',
    requisitionNo: 'REQ-BNK-2026-090',
    parentBank: 'মূল ব্যাংক (মিরপুর শাখা)',
    attendanceId: 'att_20260903_karim',
    verifiedBy: 'প্রধান ক্যাশিয়ার (হাসান)',
    remarks: 'বান্ডিল নোট ভেরিফাইড এবং আউটলেট ভল্টে জমা।',
    createdAt: '2026-09-03T17:40:00.000Z',
  },
  // Karim on 03-09-2026: Taken ৳15,000
  {
    id: 'txn_tak_20260903_002',
    voucherNo: 'V-TAK-20260903-002',
    type: 'TAKEN',
    dsrId: 'dsr_2',
    dsrName: 'Karim',
    date: '2026-09-03',
    time: '09:35 AM',
    amount: 15000,
    reason: 'ইলেকট্রনিক ব্যালেন্স ক্রয়ের বিপরীতে মূল ব্যাংকে ক্যাশ প্রেরণ',
    paymentMode: 'Cash',
    medium: 'Cash',
    requisitionNo: 'REQ-BNK-2026-090',
    parentBank: 'মূল ব্যাংক (মিরপুর শাখা)',
    attendanceId: 'att_20260903_karim',
    verifiedBy: 'আউটলেট ম্যানেজার (ফারুক)',
    remarks: 'ডিএসআরের মাধ্যমে ব্যাংকে প্রেরণ সম্পন্ন।',
    createdAt: '2026-09-03T09:35:00.000Z',
  },
  // Tanvir on 03-09-2026: Given ৳42,000
  {
    id: 'txn_giv_20260903_003',
    voucherNo: 'V-GIV-20260903-003',
    type: 'GIVEN',
    dsrId: 'dsr_3',
    dsrName: 'Tanvir',
    date: '2026-09-03',
    time: '04:25 PM',
    amount: 42000,
    reason: 'Retailers Credit Recovery Collection',
    paymentMode: 'Cash',
    attendanceId: 'att_20260903_tanvir',
    verifiedBy: 'Head Cashier (Hasan)',
    remarks: 'All memo invoices attached.',
    createdAt: '2026-09-03T16:25:00.000Z',
  },
  // Tanvir on 03-09-2026: Taken ৳8,000
  {
    id: 'txn_tak_20260903_003',
    voucherNo: 'V-TAK-20260903-003',
    type: 'TAKEN',
    dsrId: 'dsr_3',
    dsrName: 'Tanvir',
    date: '2026-09-03',
    time: '09:05 AM',
    amount: 8000,
    reason: 'Daily Field Allowance & Bike Fuel',
    paymentMode: 'Cash',
    attendanceId: 'att_20260903_tanvir',
    verifiedBy: 'Branch Manager (Faruk)',
    remarks: 'Regular daily allowance voucher.',
    createdAt: '2026-09-03T09:05:00.000Z',
  },
  // Salam on 2026-09-02: Given ৳65,000
  {
    id: 'txn_giv_20260902_001',
    voucherNo: 'V-GIV-20260902-001',
    type: 'GIVEN',
    dsrId: 'dsr_4',
    dsrName: 'Salam',
    date: '2026-09-02',
    time: '04:55 PM',
    amount: 65000,
    reason: 'Sadarghat Wholesale Market Turnover',
    paymentMode: 'Cash',
    attendanceId: 'att_20260902_salam',
    verifiedBy: 'Head Cashier (Hasan)',
    remarks: 'Cash accepted and sealed.',
    createdAt: '2026-09-02T16:55:00.000Z',
  },
  // Salam on 2026-09-02: Taken ৳25,000
  {
    id: 'txn_tak_20260902_001',
    voucherNo: 'V-TAK-20260902-001',
    type: 'TAKEN',
    dsrId: 'dsr_4',
    dsrName: 'Salam',
    date: '2026-09-02',
    time: '09:15 AM',
    amount: 25000,
    reason: 'Wholesale Porterage & Dispatch Advance',
    paymentMode: 'Cash',
    attendanceId: 'att_20260902_salam',
    verifiedBy: 'Branch Manager (Faruk)',
    remarks: 'Disbursed in 500 Taka notes.',
    createdAt: '2026-09-02T09:15:00.000Z',
  },
];

class StorageService {
  private getLocal<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setLocal<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('Storage set error:', err);
    }
  }

  constructor() {
    this.initializeDefaults();
  }

  public initializeDefaults(force = false): void {
    if (force || !localStorage.getItem(STORAGE_KEYS.STAFF_MEMBERS)) {
      this.setLocal(STORAGE_KEYS.STAFF_MEMBERS, DEFAULT_STAFF_MEMBERS);
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.STAFF)) {
      this.setLocal(STORAGE_KEYS.STAFF, DEFAULT_STAFF);
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      this.setLocal(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.setLocal(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
      this.setLocal(STORAGE_KEYS.MOVEMENTS, DEFAULT_MOVEMENTS);
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.setLocal(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    }
  }

  // --- ALL STAFF MEMBERS (Universal Master) ---
  public getAllStaff(): StaffMember[] {
    return this.getLocal<StaffMember[]>(STORAGE_KEYS.STAFF_MEMBERS, DEFAULT_STAFF_MEMBERS);
  }

  public addStaffMember(data: Omit<StaffMember, 'id'>): StaffMember {
    const list = this.getAllStaff();
    const newStaff: StaffMember = {
      ...data,
      id: `emp_${Date.now()}`,
    };
    list.push(newStaff);
    this.setLocal(STORAGE_KEYS.STAFF_MEMBERS, list);

    // If DSR, sync with backward-compatible DSR list
    if (newStaff.role === 'DSR') {
      this.addStaff({
        name: newStaff.name,
        staffCode: newStaff.staffCode,
        phone: newStaff.phone,
        route: newStaff.route || 'General Area',
        baseOpeningBalance: newStaff.baseOpeningBalance,
        status: newStaff.status,
      });
    }

    this.addAuditLog({
      actor: 'System Admin',
      role: 'Administrator',
      action: 'CREATE_STAFF',
      module: 'STAFF',
      details: `Added new staff member: ${newStaff.name} (${newStaff.staffCode}) as ${newStaff.role}.`,
    });

    return newStaff;
  }

  public updateStaffMember(staff: StaffMember): void {
    const list = this.getAllStaff().map(s => (s.id === staff.id ? staff : s));
    this.setLocal(STORAGE_KEYS.STAFF_MEMBERS, list);

    if (staff.role === 'DSR') {
      const dsrList = this.getStaff().map(s =>
        s.staffCode === staff.staffCode
          ? {
              ...s,
              name: staff.name,
              phone: staff.phone,
              route: staff.route || s.route,
              baseOpeningBalance: staff.baseOpeningBalance,
              status: staff.status,
            }
          : s
      );
      this.setLocal(STORAGE_KEYS.STAFF, dsrList);
    }
  }

  // --- UNIVERSAL STAFF MOVEMENTS / GATE PASS ---
  public getMovementRecords(dateFilter?: string): StaffMovementRecord[] {
    const all = this.getLocal<StaffMovementRecord[]>(STORAGE_KEYS.MOVEMENTS, DEFAULT_MOVEMENTS);
    if (dateFilter) {
      return all.filter(m => m.date === dateFilter);
    }
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public addMovementRecord(data: Omit<StaffMovementRecord, 'id' | 'tokenNo' | 'createdAt'>): StaffMovementRecord {
    const list = this.getMovementRecords();
    const count = list.filter(m => m.date === data.date).length + 1;
    const tokenNo = `MOV-${data.date.replace(/-/g, '')}-${String(count).padStart(3, '0')}`;
    
    const newRecord: StaffMovementRecord = {
      ...data,
      id: `mov_${Date.now()}`,
      tokenNo,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newRecord);
    this.setLocal(STORAGE_KEYS.MOVEMENTS, list);

    this.addAuditLog({
      actor: data.staffName,
      role: data.staffRole,
      action: 'CREATE_MOVEMENT',
      module: 'MOVEMENT',
      details: `Gate pass ${tokenNo} issued for ${data.staffName} (${data.purposeType}).`,
    });

    return newRecord;
  }

  public updateMovementRecord(record: StaffMovementRecord): void {
    const list = this.getMovementRecords().map(m => (m.id === record.id ? record : m));
    this.setLocal(STORAGE_KEYS.MOVEMENTS, list);
  }

  public recordMovementReturn(movementId: string, actualReturnTime: string): StaffMovementRecord | null {
    const list = this.getMovementRecords();
    const index = list.findIndex(m => m.id === movementId);
    if (index === -1) return null;

    const record = list[index];
    const durationMinutes = calculateDurationMinutes(record.outTime, actualReturnTime);
    const updated: StaffMovementRecord = {
      ...record,
      actualReturnTime,
      durationMinutes,
      isCompleted: true,
      syncStatus: this.isOnline() ? 'SYNCED' : 'OFFLINE_PENDING',
    };
    list[index] = updated;
    this.setLocal(STORAGE_KEYS.MOVEMENTS, list);

    this.addAuditLog({
      actor: record.staffName,
      role: record.staffRole,
      action: 'RETURN_MOVEMENT',
      module: 'MOVEMENT',
      details: `${record.staffName} returned from field (${record.purposeType}) at ${actualReturnTime}. Duration: ${durationMinutes} minutes.`,
    });

    return updated;
  }

  // --- SYSTEM AUDIT LOGS ---
  public getAuditLogs(): SystemAuditEntry[] {
    return this.getLocal<SystemAuditEntry[]>(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
  }

  public addAuditLog(entry: Omit<SystemAuditEntry, 'id' | 'timestamp'>): void {
    const list = this.getAuditLogs();
    const newEntry: SystemAuditEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newEntry);
    this.setLocal(STORAGE_KEYS.AUDIT_LOGS, list.slice(0, 300)); // cap at 300 entries
  }

  // --- DASHBOARD REAL-TIME METRICS ---
  public getStatsSummary(targetDate: string) {
    const staff = this.getAllStaff();
    const activeStaff = staff.filter(s => s.status === 'active');
    const attendance = this.getAttendanceRecords(targetDate);
    const movements = this.getMovementRecords(targetDate);
    const transactions = this.getTransactions({ date: targetDate });

    const totalGiven = transactions
      .filter(t => t.type === 'GIVEN')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTaken = transactions
      .filter(t => t.type === 'TAKEN')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingMovements = movements.filter(m => m.approvalStatus === 'Pending');

    return {
      totalStaffCount: activeStaff.length,
      presentStaffCount: attendance.length,
      fieldMovementCount: movements.filter(m => !m.isCompleted).length,
      completedMovementsCount: movements.filter(m => m.isCompleted).length,
      totalCashGivenToday: totalGiven,
      totalCashTakenToday: totalTaken,
      netCashPositionToday: totalGiven - totalTaken,
      pendingApprovalsCount: pendingMovements.length,
      transactionsCountToday: transactions.length,
    };
  }

  // --- STAFF ---
  public getStaff(): DSRStaff[] {
    return this.getLocal<DSRStaff[]>(STORAGE_KEYS.STAFF, DEFAULT_STAFF);
  }

  public addStaff(staffData: Omit<DSRStaff, 'id'>): DSRStaff {
    const list = this.getStaff();
    const newStaff: DSRStaff = {
      ...staffData,
      id: `dsr_${Date.now()}`,
    };
    list.push(newStaff);
    this.setLocal(STORAGE_KEYS.STAFF, list);
    return newStaff;
  }

  public updateStaff(staff: DSRStaff): void {
    const list = this.getStaff().map(s => (s.id === staff.id ? staff : s));
    this.setLocal(STORAGE_KEYS.STAFF, list);
  }

  // --- ATTENDANCE (Separately Maintained) ---
  public getAttendanceRecords(dateFilter?: string): AttendanceRecord[] {
    const all = this.getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    if (dateFilter) {
      return all.filter(a => a.date === dateFilter);
    }
    return all.sort((a, b) => b.date.localeCompare(a.date));
  }

  // --- BRANCH / OUTLET MANAGEMENT ---
  public getOutlets(): BranchOutlet[] {
    return this.getLocal<BranchOutlet[]>(STORAGE_KEYS.OUTLETS, DEFAULT_BRANCH_OUTLETS);
  }

  public addOutlet(outletData: Omit<BranchOutlet, 'id'>): BranchOutlet {
    const outlets = this.getOutlets();
    const newOutlet: BranchOutlet = {
      ...outletData,
      id: `outlet_${Date.now()}`,
    };
    outlets.push(newOutlet);
    this.setLocal(STORAGE_KEYS.OUTLETS, outlets);
    return newOutlet;
  }

  public getSelectedOutletId(): string {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_OUTLET) || 'outlet_1';
  }

  public setSelectedOutletId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_OUTLET, id);
  }

  // --- OFFLINE SYNC QUEUE ENGINE ---
  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public getOfflineQueue(): any[] {
    return this.getLocal<any[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);
  }

  public addToOfflineQueue(item: any): void {
    const queue = this.getOfflineQueue();
    queue.push({
      ...item,
      enqueuedAt: new Date().toISOString(),
    });
    this.setLocal(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  }

  public clearOfflineQueue(): void {
    this.setLocal(STORAGE_KEYS.OFFLINE_QUEUE, []);
  }

  public async syncOfflineQueueToServer(): Promise<{ syncedCount: number }> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { syncedCount: 0 };

    // Simulate reliable server network upload
    await new Promise(r => setTimeout(r, 1200));

    // Mark all attendances and movements as SYNCED
    const attendance = this.getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    attendance.forEach(a => {
      a.syncStatus = 'SYNCED';
    });
    this.setLocal(STORAGE_KEYS.ATTENDANCE, attendance);

    const movements = this.getLocal<StaffMovementRecord[]>(STORAGE_KEYS.MOVEMENTS, DEFAULT_MOVEMENTS);
    movements.forEach(m => {
      m.syncStatus = 'SYNCED';
    });
    this.setLocal(STORAGE_KEYS.MOVEMENTS, movements);

    const count = queue.length;
    this.clearOfflineQueue();

    this.addAuditLog({
      actor: 'Auto Sync Service',
      role: 'Administrator',
      action: 'SERVER_SYNC',
      module: 'SYNC',
      details: `Successfully synchronized ${count} offline attendance and movement events to server cloud database.`,
    });

    return { syncedCount: count };
  }

  public saveAttendance(record: Omit<AttendanceRecord, 'id' | 'createdAt'>): AttendanceRecord {
    const all = this.getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE);
    const staff = this.getAllStaff().find(s => s.id === record.staffId || s.id === record.dsrId);
    
    // Shift calculations: Late, Early, Overtime, Working Hours
    const lateMinutes = record.lateMinutes !== undefined 
      ? record.lateMinutes 
      : calculateLateMinutes(record.arrivalTime);

    let earlyMinutes = record.earlyMinutes || 0;
    let overtimeMinutes = record.overtimeMinutes || 0;
    let workingMinutes = record.workingMinutes || 0;

    if (record.departureTime) {
      earlyMinutes = calculateEarlyMinutes(record.departureTime);
      overtimeMinutes = calculateOvertimeMinutes(record.departureTime);
      
      const totalSpan = calculateDurationMinutes(record.arrivalTime, record.departureTime);
      // Deduct any completed movement durations during this day
      const staffMovements = this.getMovementRecords(record.date).filter(
        m => (m.staffId === record.staffId || m.staffName === record.dsrName) && m.isCompleted
      );
      const movementOutMinutes = staffMovements.reduce(
        (acc, curr) => acc + (curr.durationMinutes || 0),
        0
      );
      workingMinutes = Math.max(0, totalSpan - movementOutMinutes);
    }

    // Determine status if arrival was late and status is still generic
    let computedStatus = record.status;
    if (computedStatus === 'Present' && lateMinutes > 0) {
      computedStatus = 'Late';
    }

    // Default branch and sync status
    const branchId = record.branchId || staff?.branchId || this.getSelectedOutletId();
    const branchName = record.branchName || staff?.branchName || 'ঢাকা প্রধান আউটলেট';
    const isNetworkUp = this.isOnline();
    const syncStatus = record.syncStatus || (isNetworkUp ? 'SYNCED' : 'OFFLINE_PENDING');

    // Look for existing attendance for this DSR on this date
    const existingIndex = all.findIndex(a => (a.dsrId === record.dsrId || a.staffId === record.staffId) && a.date === record.date);

    let savedRecord: AttendanceRecord;
    if (existingIndex >= 0) {
      savedRecord = {
        ...all[existingIndex],
        ...record,
        branchId,
        branchName,
        lateMinutes,
        earlyMinutes,
        overtimeMinutes,
        workingMinutes,
        status: computedStatus,
        syncStatus,
      };
      all[existingIndex] = savedRecord;
    } else {
      savedRecord = {
        ...record,
        id: `att_${record.date.replace(/-/g, '')}_${record.dsrId}_${Date.now()}`,
        branchId,
        branchName,
        lateMinutes,
        earlyMinutes,
        overtimeMinutes,
        workingMinutes,
        status: computedStatus,
        syncStatus,
        createdAt: new Date().toISOString(),
      };
      all.push(savedRecord);
    }

    this.setLocal(STORAGE_KEYS.ATTENDANCE, all);

    if (!isNetworkUp) {
      this.addToOfflineQueue({
        type: 'ATTENDANCE_PUNCH',
        recordId: savedRecord.id,
        staffName: savedRecord.dsrName,
        date: savedRecord.date,
        time: savedRecord.departureTime || savedRecord.arrivalTime,
      });
    }

    return savedRecord;
  }

  // --- MONTHLY ATTENDANCE REPORT GENERATION ---
  public getMonthlyAttendanceReport(year: number, month: number, branchId?: string): StaffMonthlyReport[] {
    const allStaff = this.getAllStaff();
    const targetStaff = branchId && branchId !== 'ALL' 
      ? allStaff.filter(s => s.branchId === branchId) 
      : allStaff;

    // Get days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStr = String(month).padStart(2, '0');

    // Total working days (assuming Friday is weekend)
    let totalWorkingDays = 0;
    const isWeekendDay: { [day: number]: boolean } = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const isFriday = dateObj.getDay() === 5; // Friday
      isWeekendDay[day] = isFriday;
      if (!isFriday) totalWorkingDays++;
    }

    const reports: StaffMonthlyReport[] = [];

    targetStaff.forEach(staff => {
      let presentDays = 0;
      let lateDays = 0;
      let totalLateMinutes = 0;
      let earlyDepartureDays = 0;
      let earlyDepartures = 0;
      let overtimeMinutes = 0;
      let totalWorkingMinutes = 0;
      const dailyStatus: { [day: number]: 'P' | 'L' | 'M' | 'E' | 'A' | 'H' | 'W' } = {};

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const dateKey = `${year}-${monthStr}-${dayStr}`;

        if (isWeekendDay[day]) {
          dailyStatus[day] = 'W'; // Weekend
          continue;
        }

        const att = this.getAttendanceRecords(dateKey).find(
          a => a.staffId === staff.id || a.dsrId === staff.id || a.dsrName === staff.name
        );

        const movements = this.getMovementRecords(dateKey).filter(
          m => m.staffId === staff.id || m.staffName === staff.name
        );

        if (att) {
          presentDays++;
          if (att.lateMinutes && att.lateMinutes > 0) {
            lateDays++;
            totalLateMinutes += att.lateMinutes;
            dailyStatus[day] = 'L';
          } else if (movements.length > 0) {
            dailyStatus[day] = 'M';
          } else {
            dailyStatus[day] = 'P';
          }

          if (att.earlyMinutes && att.earlyMinutes > 0) {
            earlyDepartures++;
            earlyDepartureDays++;
          }
          if (att.overtimeMinutes && att.overtimeMinutes > 0) {
            overtimeMinutes += att.overtimeMinutes;
          }
          if (att.workingMinutes && att.workingMinutes > 0) {
            totalWorkingMinutes += att.workingMinutes;
          } else {
            totalWorkingMinutes += 480; // Standard 8 hours
          }
        } else {
          dailyStatus[day] = 'A'; // Absent
        }
      }

      const allStaffMovements = this.getMovementRecords().filter(
        m => (m.staffId === staff.id || m.staffName === staff.name) && m.date.startsWith(`${year}-${monthStr}`)
      );

      const absentDays = Math.max(0, totalWorkingDays - presentDays);
      const attendancePercentage = totalWorkingDays > 0 
        ? Math.round((presentDays / totalWorkingDays) * 100) 
        : 0;

      reports.push({
        staffId: staff.id,
        staffName: staff.name,
        staffCode: staff.staffCode,
        role: staff.role,
        designation: staff.designation,
        branchId: staff.branchId || 'outlet_1',
        branchName: staff.branchName || 'ঢাকা প্রধান আউটলেট',
        totalWorkingDays,
        presentDays,
        lateDays,
        totalLateMinutes,
        earlyDepartureDays,
        earlyDepartures,
        movementCount: allStaffMovements.length,
        totalOvertimeMinutes: overtimeMinutes,
        overtimeMinutes,
        totalWorkingMinutes,
        absentDays,
        attendancePercentage,
        dailyStatus,
      });
    });

    return reports;
  }

  public getStaffMonthlyReport(year: number, month: number, branchId?: string): StaffMonthlyReport[] {
    return this.getMonthlyAttendanceReport(year, month, branchId);
  }


  // --- FINANCIAL TRANSACTIONS (Separately Maintained) ---
  public getTransactions(filter?: {
    type?: MovementType;
    dsrId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }): FinancialTransaction[] {
    let all = this.getLocal<FinancialTransaction[]>(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);

    if (filter) {
      if (filter.type) {
        all = all.filter(t => t.type === filter.type);
      }
      if (filter.dsrId) {
        all = all.filter(t => t.dsrId === filter.dsrId);
      }
      if (filter.date) {
        all = all.filter(t => t.date === filter.date);
      }
      if (filter.startDate && filter.endDate) {
        all = all.filter(t => t.date >= filter.startDate! && t.date <= filter.endDate!);
      }
    }

    return all.sort((a, b) => {
      // Sort newest date & time first
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  public addSingleTransaction(data: {
    type: MovementType;
    dsrId: string;
    dsrName: string;
    date: string;
    time: string;
    amount: number;
    reason: string;
    paymentMode?: 'Cash' | 'bKash' | 'Bank Transfer';
    medium?: 'Cash' | 'Electronic Balance' | 'Both';
    requisitionNo?: string;
    parentBank?: string;
    attendanceId?: string;
    signature?: string;
    verifiedBy?: string;
    remarks?: string;
  }): FinancialTransaction {
    const all = this.getLocal<FinancialTransaction[]>(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    const dateCode = data.date.replace(/-/g, '');
    const prefix = data.type === 'GIVEN' ? 'V-GIV' : 'V-TAK';
    const randSeq = String(all.length + 1).padStart(3, '0');
    const voucherNo = `${prefix}-${dateCode}-${randSeq}`;

    const newTxn: FinancialTransaction = {
      id: `txn_${data.type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      voucherNo,
      type: data.type,
      dsrId: data.dsrId,
      dsrName: data.dsrName,
      date: data.date,
      time: data.time,
      amount: Number(data.amount) || 0,
      reason: data.reason,
      paymentMode: data.paymentMode || 'Cash',
      medium: data.medium || 'Cash',
      requisitionNo: data.requisitionNo,
      parentBank: data.parentBank,
      attendanceId: data.attendanceId,
      signature: data.signature,
      verifiedBy: data.verifiedBy || 'Office Accounts Desk',
      remarks: data.remarks,
      createdAt: new Date().toISOString(),
    };

    all.push(newTxn);
    this.setLocal(STORAGE_KEYS.TRANSACTIONS, all);
    return newTxn;
  }

  // --- COMPOSITE DAILY VISIT RECORDING ---
  // Submits the user's daily visit form, upholding the business rule:
  // "Money Given" and "Money Taken" MUST be stored as separate financial transaction records.
  public recordDailyVisit(form: DailyDSRVisitForm): {
    attendance: AttendanceRecord;
    givenTxn?: FinancialTransaction;
    takenTxn?: FinancialTransaction;
  } {
    // 1. Record/Update Attendance
    const attendance = this.saveAttendance({
      dsrId: form.dsrId,
      dsrName: form.dsrName,
      date: form.date,
      arrivalTime: form.arrivalTime,
      departureTime: form.departureTime,
      status: form.departureTime ? 'Departed' : 'In Field',
      remarks: form.remarks,
    });

    let givenTxn: FinancialTransaction | undefined;
    let takenTxn: FinancialTransaction | undefined;

    // 2. Separate record for Money Given To Office (Money & Balance Delivered from Parent Bank)
    if (form.moneyGivenToOffice && form.amountGiven > 0) {
      givenTxn = this.addSingleTransaction({
        type: 'GIVEN',
        dsrId: form.dsrId,
        dsrName: form.dsrName,
        date: form.date,
        time: form.departureTime || form.arrivalTime || '05:00 PM',
        amount: form.amountGiven,
        reason: form.givenReason || 'মূল ব্যাংক থেকে ক্যাশ ও ব্যালেন্স রিফিল সরবরাহ',
        paymentMode: 'Cash',
        medium: form.medium || 'Cash',
        requisitionNo: form.requisitionNo,
        parentBank: form.parentBank,
        attendanceId: attendance.id,
        signature: form.dsrSignature,
        verifiedBy: 'আউটলেট ক্যাশিয়ার',
        remarks: form.remarks,
      });
    }

    // 3. Separate record for Money Taken From Office (Excess Cash Sent to Parent Bank via DSR)
    if (form.moneyTakenFromOffice && form.amountTaken > 0) {
      takenTxn = this.addSingleTransaction({
        type: 'TAKEN',
        dsrId: form.dsrId,
        dsrName: form.dsrName,
        date: form.date,
        time: form.arrivalTime || '09:00 AM',
        amount: form.amountTaken,
        reason: form.takenReason || 'আউটলেটের উদ্বৃত্ত ক্যাশ মূল ব্যাংকে জমা প্রেরণ',
        paymentMode: 'Cash',
        medium: 'Cash',
        requisitionNo: form.requisitionNo,
        parentBank: form.parentBank,
        attendanceId: attendance.id,
        signature: form.dsrSignature,
        verifiedBy: 'আউটলেট ম্যানেজার',
        remarks: form.remarks,
      });
    }

    return { attendance, givenTxn, takenTxn };
  }

  // --- DAILY DSR SUMMARY CALCULATION ---
  // Calculates: DSR Name | Date | Arrival | Departure | Given | Taken | Net Position | Remarks
  public getDailySummaries(targetDate: string): DailyDSRSummaryItem[] {
    const staffList = this.getStaff();
    const attendanceRecords = this.getAttendanceRecords(targetDate);
    const transactions = this.getTransactions({ date: targetDate });

    // Collect all DSRs that either have attendance or transactions on targetDate
    const dsrIdsOnDate = new Set<string>();
    attendanceRecords.forEach(a => dsrIdsOnDate.add(a.dsrId));
    transactions.forEach(t => dsrIdsOnDate.add(t.dsrId));

    // If no records on date, show all active staff for that date as blank templates
    const targetStaffIds = dsrIdsOnDate.size > 0 
      ? Array.from(dsrIdsOnDate)
      : staffList.map(s => s.id);

    const summaries: DailyDSRSummaryItem[] = [];

    for (const dsrId of targetStaffIds) {
      const staff = staffList.find(s => s.id === dsrId);
      const dsrName = staff ? staff.name : 'Unknown DSR';
      const att = attendanceRecords.find(a => a.dsrId === dsrId);
      
      // Filter transactions strictly for this DSR on targetDate
      const dsrTxns = transactions.filter(t => t.dsrId === dsrId);

      // Sum all GIVEN records
      const givenTxns = dsrTxns.filter(t => t.type === 'GIVEN');
      const totalGiven = givenTxns.reduce((acc, curr) => acc + curr.amount, 0);

      // Sum all TAKEN records
      const takenTxns = dsrTxns.filter(t => t.type === 'TAKEN');
      const totalTaken = takenTxns.reduce((acc, curr) => acc + curr.amount, 0);

      // Net Position = Given - Taken (Money Given to office minus Money Taken from office)
      const netPosition = totalGiven - totalTaken;

      const openingBal = staff ? staff.baseOpeningBalance : 0;
      const closingBal = openingBal + netPosition;

      // Remarks from attendance or transaction notes
      let remarks = att?.remarks || '';
      if (!remarks && dsrTxns.length > 0) {
        remarks = dsrTxns.map(t => t.reason).join('; ');
      }

      // Requisition / Bank references
      const reqNo = givenTxns[0]?.requisitionNo || takenTxns[0]?.requisitionNo;
      const parentBnk = givenTxns[0]?.parentBank || takenTxns[0]?.parentBank || staff?.parentBank;
      const med = givenTxns[0]?.medium || takenTxns[0]?.medium || 'Cash';

      summaries.push({
        id: `${dsrId}_${targetDate}`,
        dsrId,
        dsrName,
        date: targetDate,
        displayDate: formatDateDDMMYYYY(targetDate),
        arrival: att?.arrivalTime || '—',
        departure: att?.departureTime || '—',
        given: totalGiven,
        taken: totalTaken,
        netPosition,
        openingBalance: openingBal,
        closingBalance: closingBal,
        remarks: remarks || 'No remarks recorded',
        requisitionNo: reqNo,
        parentBank: parentBnk,
        medium: med,
        attendanceId: att?.id,
        givenTransactionId: givenTxns[0]?.id,
        takenTransactionId: takenTxns[0]?.id,
        signature: givenTxns[0]?.signature || takenTxns[0]?.signature,
      });
    }

    return summaries.sort((a, b) => {
      // Sort staff with active money movements first
      const aHasActivity = (a.given > 0 || a.taken > 0 || a.arrival !== '—') ? 1 : 0;
      const bHasActivity = (b.given > 0 || b.taken > 0 || b.arrival !== '—') ? 1 : 0;
      if (bHasActivity !== aHasActivity) return bHasActivity - aHasActivity;
      return a.dsrName.localeCompare(b.dsrName);
    });
  }

  // Clear & reset all data
  public resetAllData(): void {
    this.initializeDefaults(true);
  }
}

export const storage = new StorageService();
