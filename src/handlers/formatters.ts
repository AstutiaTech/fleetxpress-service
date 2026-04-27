/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from "dayjs";

/**
 * Formats a number as currency with abbreviation (K, M, B, T, etc.)
 * @param value The numeric value to format
 * @param currencySymbol The currency symbol to prepend (default: '₦')
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted string, e.g. ₦2.5M
 */
export function formatCurrencyAbbr(
  value: number,
  currencySymbol = '₦',
  decimals = 1
): string {
  if (value === null || value === undefined || isNaN(value)) return '';
  const absValue = Math.abs(value);
  let formatted = '';
  let suffix = '';

  if (absValue >= 1e12) {
    formatted = (value / 1e12).toFixed(decimals);
    suffix = 'T';
  } else if (absValue >= 1e9) {
    formatted = (value / 1e9).toFixed(decimals);
    suffix = 'B';
  } else if (absValue >= 1e6) {
    formatted = (value / 1e6).toFixed(decimals);
    suffix = 'M';
  } else if (absValue >= 1e3) {
    formatted = (value / 1e3).toFixed(decimals);
    suffix = 'K';
  } else {
    formatted = value.toLocaleString(undefined, { maximumFractionDigits: decimals });
  }

  // Remove trailing .0 if present
  if (decimals > 0) {
    formatted = formatted.replace(/\.0+$/, '');
  }

  return `${currencySymbol}${formatted}${suffix}`;
}

export function formatCurrencyInput(raw: string) {
  if (!raw) return '';
  // Remove all non-digit except dot
  const parts = raw.split('.');
  let intPart = parts[0].replace(/\D/g, '');
  const decPart = parts[1] ? parts[1].replace(/\D/g, '') : '';
  intPart = intPart.replace(/^0+(?!$)/, ''); // Remove leading zeros
  let formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decPart.length > 0) {
    formatted += '.' + decPart;
  }
  return formatted;
}

/**
 * Formats a number as price with currency symbol and comma separators
 * @param value The numeric value to format
 * @param currencySymbol The currency symbol to prepend (default: '₦')
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string, e.g. ₦1,234,567.89
 */
export function formatPrice(
  value: number | string | null | undefined,
  currencySymbol: string = '₦',
  decimals: number = 2
): string {
  if (value === null || value === undefined || value === '') return `${currencySymbol}0.00`;
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return `${currencySymbol}0.00`;
  
  return `${currencySymbol}${numValue.toLocaleString('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function unformatCurrencyInput(formatted: string) {
  return formatted.replace(/,/g, '');
}

export function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatName(raw: string): string {
  return raw
    .split("_") // ["john", "doe"]
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // ["John", "Doe"]
    .join(" "); // "John Doe"
}

export function encodeString(value: string): string {
  return Buffer.from(value).toString("base64");
}

export function decodeBase64(str: string): string {
  return Buffer.from(str, "base64").toString("utf-8");
}

export function timeAgo(
  time: string | number | Date | dayjs.Dayjs | null | undefined
): string {
  // Normalize input to Date
  let date: Date;
  if (typeof time === "string") {
    // Replace dashes with slashes and remove T/Z for Safari compatibility
    date = new Date(time.replace(/-/g, "/").replace(/[TZ]/g, " "));
  } else if (typeof time === "number") {
    date = new Date(time);
  } else if (time instanceof Date) {
    date = time;
  } else if (time && typeof (time as any).toDate === "function") {
    date = (time as dayjs.Dayjs).toDate();
  } else {
    return "";
  }

  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  const dayDiff = Math.floor(diff / 86400);

  if (isNaN(dayDiff) || dayDiff < 0 || dayDiff >= 31) {
    return dayjs(time).format("MMMM DD, YYYY");
  }

  if (dayDiff === 0) {
    if (diff < 60) return "just now";
    if (diff < 120) return "1 minute ago";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 7200) return "1 hour ago";
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  }
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;
  if (dayDiff < 31) return `${Math.ceil(dayDiff / 7)} weeks ago`;

  return dayjs(time).format("MMMM DD, YYYY");
}

export function formatDate(
  date: string | number | Date | dayjs.Dayjs | null | undefined,
  format: string | undefined
) {
  if (date === undefined || date === "") {
    return dayjs().format(format);
  } else {
    return dayjs(date).format(format);
  }
}

/**
 * Format file size in human-readable format
 * @param bytes The file size in bytes
 * @returns Formatted string, e.g. "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}