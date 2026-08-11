/**
 * Indian Standard Time (IST - Asia/Kolkata) Date & Time Formatting Utilities
 * Standardizes timestamp representations across evaluations, attendance, reports, and exports.
 */

/**
 * Format a Date or timestamp string into IST (Asia/Kolkata) format
 * @param {string|Date|number} dateString - Input date/timestamp
 * @param {Intl.DateTimeFormatOptions} [options] - Optional Intl formatting overrides
 * @returns {string} Formatted IST date string (e.g. "11 Aug 2026, 06:30:45 PM")
 */
export const formatIST = (dateString, options = {}) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      ...options,
    });
  } catch (e) {
    return String(dateString);
  }
};

/**
 * Format a Date or timestamp string into IST with explicit "IST" suffix for reports and exports
 * @param {string|Date|number} dateString - Input date/timestamp
 * @returns {string} Formatted IST date string with suffix (e.g. "11 Aug 2026, 06:30:45 PM IST")
 */
export const formatISTWithSuffix = (dateString) => {
  if (!dateString) return '-';
  const formatted = formatIST(dateString);
  return formatted !== '-' ? `${formatted} IST` : '-';
};

/**
 * Format date in short date format (DD/MM/YYYY) in IST
 */
export const formatISTDateOnly = (dateString) => {
  if (!dateString) return '-';
  return formatIST(dateString, { hour: undefined, minute: undefined, second: undefined });
};

/**
 * Format time only (hh:mm:ss AM/PM) in IST
 */
export const formatISTTimeOnly = (dateString) => {
  if (!dateString) return '-';
  return formatIST(dateString, { day: undefined, month: undefined, year: undefined });
};
