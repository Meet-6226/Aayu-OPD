/**
 * Shared Data Formatting & Validation utilities
 * BOTH APOLLO-PATIENT and DEMO-DAY import identical copies of this file.
 *
 * Date/time: All current-time logic delegates to appTime.js — the single
 * source of truth. Never call new Date() here for "now" or "today".
 */
import { todayDateString as _todayDateString } from './appTime';

export function formatPatientId(phoneNumber) {
  if (!phoneNumber) return '';
  // Strip all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  // If it's a 10 digit Indian number, prepend 91 country code
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  // Strip leading zero if any
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

export function formatPatientPhone(phoneNumber) {
  const digits = formatPatientId(phoneNumber);
  return digits ? '+' + digits : '';
}

export function formatAppointmentDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    return '';
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatAppointmentTime(dateInput) {
  if (!dateInput) return '';
  
  // If it's already a string in "HH:MM AM/PM" or similar, standardise it
  if (typeof dateInput === 'string' && /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/.test(dateInput)) {
    return dateInput.toUpperCase().trim();
  }
  
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return '';
  }
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
}

export function getTodayDateString() {
  // Delegates to appTime — the single source of truth for Asia/Kolkata "today"
  return _todayDateString();
}

// Runtime Validations (fail loud)
export function validateAppointmentData(data) {
  if (!data.appointmentDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.appointmentDate)) {
    throw new Error(`Invalid date format: "${data.appointmentDate}". Must be YYYY-MM-DD`);
  }
  if (!data.patientId || /[^a-zA-Z0-9_-]/.test(data.patientId)) {
    throw new Error(`Invalid patientId: "${data.patientId}". Must be a valid alphanumeric Firebase UID`);
  }
  if (!data.doctorId || !/^doc_\d{3}$/.test(data.doctorId)) {
    throw new Error(`Invalid doctorId: "${data.doctorId}". Must match format doc_XXX`);
  }
  if (!data.appointmentTime || !/^\d{2}:\d{2}\s*(AM|PM)$/.test(data.appointmentTime)) {
    throw new Error(`Invalid appointmentTime format: "${data.appointmentTime}". Must be HH:MM AM/PM`);
  }
}

export function validatePatientData(data) {
  if (!data.uid || /[^a-zA-Z0-9_-]/.test(data.uid)) {
    throw new Error(`Invalid patient document ID (uid): "${data.uid}". Must be a valid alphanumeric Firebase UID`);
  }
  if (data.phone) {
    // Auto-clean spaces, dashes, parentheses, and brackets to normalize to E.164
    data.phone = data.phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+\d+$/.test(data.phone)) {
      throw new Error(`Invalid phone format: "${data.phone}". Must start with + followed by country code and digits`);
    }
  }
}
