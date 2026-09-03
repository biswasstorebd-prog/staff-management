export type StaffRole = 'Administrator' | 'Manager' | 'Teller' | 'DSR' | 'Other Staff';

export type EmploymentType = 'INTERNAL_OUTLET' | 'PARENT_BANK_DSR';

export interface BranchOutlet {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  location: string;
  isDefault?: boolean;
}

export interface StaffMember {
  id: string;
  staffCode: string;
  name: string;
  nameBn: string;
  role: StaffRole;
  designation: string;
  department: string;
  branchId?: string;
  branchName?: string;
  shiftStartTime?: string; // e.g. "09:00 AM"
  shiftEndTime?: string; // e.g. "05:00 PM"
  phone: string;
  email?: string;
  route?: string; // DSR specific or bank branch zone
  parentBank?: string; // e.g. "মূল ব্যাংক - প্রিন্সিপাল ব্রাঞ্চ"
  employmentType?: EmploymentType; // INTERNAL_OUTLET vs PARENT_BANK_DSR
  baseOpeningBalance: number; // Opening float (DSR) or drawer base (Teller)
  status: 'active' | 'inactive';
  fingerprintEnrolled: boolean;
  fingerprintEnrolledAt?: string;
  fingerprintTemplate?: string;
  joinedDate: string;
}

// Backward-compatible alias for existing DSR components
export interface DSRStaff {
  id: string;
  name: string;
  staffCode: string;
  phone: string;
  route: string;
  parentBank?: string;
  baseOpeningBalance: number;
  status: 'active' | 'inactive';
}

export type MovementType = 'GIVEN' | 'TAKEN';

export interface FinancialTransaction {
  id: string;
  voucherNo: string;
  type: MovementType; // GIVEN (Money Given To Office / Bank Refill) or TAKEN (Money Taken From Office / Bank Deposit)
  dsrId: string;
  dsrName: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:15 AM"
  amount: number;
  reason: string;
  paymentMode: 'Cash' | 'bKash' | 'Bank Transfer';
  medium?: 'Cash' | 'Electronic Balance' | 'Both';
  requisitionNo?: string; // Requisition slip number e.g. "REQ-BNK-2026-089"
  parentBank?: string; // Parent bank & branch
  attendanceId?: string; // separate relation id
  signature?: string; // base64 data URL
  verifiedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  staffId?: string; // universal
  dsrId?: string; // backward-compatibility
  staffName?: string;
  dsrName: string;
  role?: StaffRole;
  branchId?: string;
  branchName?: string;
  date: string; // YYYY-MM-DD
  arrivalTime: string; // e.g. "08:57 AM"
  departureTime?: string; // e.g. "05:02 PM"
  checkInTime?: string; // exact timestamp
  checkOutTime?: string; // exact timestamp
  status: 'Present' | 'In Field' | 'Departed' | 'Half Day' | 'Late' | 'On Leave';
  lateMinutes?: number;
  earlyMinutes?: number;
  overtimeMinutes?: number;
  workingMinutes?: number;
  verifiedMethod?: 'BIOMETRIC_HTTP_5050' | 'MANUAL' | 'CARD' | 'BIOMETRIC_AND_SIGNATURE';
  syncStatus?: 'SYNCED' | 'OFFLINE_PENDING';
  checkInSignature?: string; // Digital signature upon morning present
  finalOutSignature?: string; // Digital signature upon afternoon/evening final out
  signature?: string; // General signature
  remarks?: string;
  createdAt: string;
}

export interface StaffMovementRecord {
  id: string;
  tokenNo: string; // e.g. "MOV-20260903-001"
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  branchId?: string;
  branchName?: string;
  date: string;
  outTime: string; // e.g. "11:20 AM"
  expectedReturnTime?: string; // e.g. "01:00 PM"
  actualReturnTime?: string; // e.g. "12:48 PM"
  durationMinutes?: number;
  purposeType:
    | 'Official visit'
    | 'Bank work'
    | 'Customer visit'
    | 'Document submission'
    | 'Field duty'
    | 'Meeting'
    | 'Emergency'
    | 'Market Cash Collection'
    | 'Other';
  destination: string;
  remarks?: string;
  signature?: string; // Digital signature when going outside
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  isCompleted: boolean;
  syncStatus?: 'SYNCED' | 'OFFLINE_PENDING';
  createdAt: string;
}

export interface SystemUser {
  id: string;
  username: string;
  displayName: string;
  role: StaffRole;
  designation: string;
  avatarText: string;
}

export interface SystemAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: StaffRole;
  action: string;
  module: 'ATTENDANCE' | 'MOVEMENT' | 'DSR_FINANCE' | 'STAFF' | 'TELLER' | 'MANAGER' | 'SYSTEM' | 'SYNC';
  details: string;
}

export interface BiometricApiResponse {
  success: boolean;
  connected?: boolean;
  device?: string;
  status?: string;
  verified?: boolean;
  matchScore?: number;
  staffId?: string;
  staffName?: string;
  template?: string;
  quality?: number;
  nfiq?: number;
  timestamp?: string;
  message?: string;
}

export interface StaffMonthlyReport {
  staffId: string;
  staffName: string;
  staffCode: string;
  role: StaffRole;
  designation: string;
  branchId?: string;
  branchName: string;
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  totalLateMinutes?: number;
  earlyDepartureDays?: number;
  earlyDepartures: number;
  movementCount: number;
  totalOvertimeMinutes?: number;
  overtimeMinutes: number;
  totalWorkingMinutes?: number;
  absentDays: number;
  attendancePercentage: number;
  dailyStatus: { [day: number]: 'P' | 'L' | 'M' | 'E' | 'A' | 'H' | 'W' };
}

export interface DailyDSRVisitForm {
  dsrId: string;
  dsrName: string;
  date: string; // YYYY-MM-DD
  arrivalTime: string;
  departureTime: string;
  openingBalance: number;
  
  // Agent Banking requisition & bank details
  requisitionNo?: string;
  medium?: 'Cash' | 'Electronic Balance' | 'Both';
  parentBank?: string;

  // Money Given (From Main Bank to Agent Outlet)
  moneyGivenToOffice: boolean;
  amountGiven: number;
  givenReason: string;
  
  // Money Taken (From Agent Outlet to Main Bank via DSR)
  moneyTakenFromOffice: boolean;
  amountTaken: number;
  takenReason: string;
  
  remarks: string;
  dsrSignature?: string;
  officeSignature?: string;
}

export interface DailyDSRSummaryItem {
  id: string; // composite key e.g. dsrId_date
  dsrId: string;
  dsrName: string;
  date: string; // YYYY-MM-DD
  displayDate: string; // DD-MM-YYYY e.g. 03-09-2026
  arrival: string;
  departure: string;
  given: number;
  taken: number;
  netPosition: number; // Given - Taken
  openingBalance: number;
  closingBalance: number; // Opening + Given - Taken
  remarks: string;
  requisitionNo?: string;
  parentBank?: string;
  medium?: 'Cash' | 'Electronic Balance' | 'Both';
  attendanceId?: string;
  givenTransactionId?: string;
  takenTransactionId?: string;
  signature?: string;
}


