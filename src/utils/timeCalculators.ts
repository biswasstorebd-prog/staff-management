/**
 * Time and Shift Calculations
 * Shift Timing: Default 09:00 AM - 05:00 PM
 * Grace Period: 15 minutes (Arrival up to 09:15 AM is On-Time)
 */

export interface ShiftConfig {
  startTime: string; // "09:00 AM"
  endTime: string;   // "05:00 PM"
  graceMinutes: number; // 15
}

export const DEFAULT_SHIFT: ShiftConfig = {
  startTime: '09:00 AM',
  endTime: '05:00 PM',
  graceMinutes: 15,
};

/**
 * Converts a time string like "08:57 AM", "11:20 AM", "05:02 PM" to total minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  // Clean string
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/(\d{1,2}):(\d{2})(?:\s*([AP]M))?/);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3];

  if (modifier === 'PM' && hours < 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Calculates late arrival in minutes
 * If arrival <= shift start (09:00 AM) + grace (15 mins), lateMinutes = 0
 * If arrival > 09:15 AM, lateMinutes = arrivalMinutes - shiftStartMinutes
 */
export function calculateLateMinutes(arrivalTime: string, shift: ShiftConfig = DEFAULT_SHIFT): number {
  if (!arrivalTime) return 0;
  const arrivalMinutes = timeStringToMinutes(arrivalTime);
  const startMinutes = timeStringToMinutes(shift.startTime);
  const threshold = startMinutes + shift.graceMinutes;

  if (arrivalMinutes > threshold) {
    return arrivalMinutes - startMinutes;
  }
  return 0;
}

/**
 * Calculates early departure in minutes
 * If departure < shift end (05:00 PM), earlyMinutes = shiftEndMinutes - departureMinutes
 */
export function calculateEarlyMinutes(departureTime: string, shift: ShiftConfig = DEFAULT_SHIFT): number {
  if (!departureTime) return 0;
  const departureMinutes = timeStringToMinutes(departureTime);
  const endMinutes = timeStringToMinutes(shift.endTime);

  if (departureMinutes < endMinutes) {
    return endMinutes - departureMinutes;
  }
  return 0;
}

/**
 * Calculates overtime in minutes
 * If departure > shift end (05:00 PM), overtimeMinutes = departureMinutes - shiftEndMinutes
 */
export function calculateOvertimeMinutes(departureTime: string, shift: ShiftConfig = DEFAULT_SHIFT): number {
  if (!departureTime) return 0;
  const departureMinutes = timeStringToMinutes(departureTime);
  const endMinutes = timeStringToMinutes(shift.endTime);

  if (departureMinutes > endMinutes) {
    return departureMinutes - endMinutes;
  }
  return 0;
}

/**
 * Calculates duration between two times in minutes
 * e.g. 11:20 AM to 12:48 PM = 88 minutes
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const start = timeStringToMinutes(startTime);
  const end = timeStringToMinutes(endTime);
  if (end >= start) {
    return end - start;
  }
  // Overnight rollover
  return 1440 - start + end;
}

/**
 * Formats minutes into human-readable string: e.g. 88 mins -> "1h 28m" or Bengali "১ ঘণ্টা ২৮ মিনিট"
 */
export function formatMinutesBengali(minutes: number): string {
  if (!minutes || minutes <= 0) return '০ মিনিট';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} ঘণ্টা ${remainingMinutes} মিনিট`;
  } else if (hours > 0) {
    return `${hours} ঘণ্টা`;
  }
  return `${remainingMinutes} মিনিট`;
}

export function formatMinutesEnglish(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${remainingMinutes}m`;
}
