// ─── Risk Helpers ───
export const getRiskColor = (level) => {
  const map = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
  return map[level] || '#64748b';
};

export const getRiskBg = (level) => {
  const map = { high: '#fee2e2', medium: '#fef3c7', low: '#dcfce7' };
  return map[level] || '#f1f5f9';
};

export const getRiskLabel = (score) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

export const getRiskText = (level) => {
  const map = { high: 'High Risk', medium: 'Medium Risk', low: 'Low Risk' };
  return map[level] || 'Unknown';
};

// ─── Status Helpers ───
export const getStatusColor = (status) => {
  const map = {
    'Checked In': { bg: '#e8faee', color: '#16a34a' },
    'Waiting': { bg: '#fef3c7', color: '#d97706' },
    'Scheduled': { bg: '#eff6ff', color: '#2563eb' },
    'Completed': { bg: '#f0fdf4', color: '#16a34a' },
    'Cancelled': { bg: '#fee2e2', color: '#dc2626' },
    'No Show': { bg: '#fef2f2', color: '#ef4444' },
  };
  return map[status] || { bg: '#f1f5f9', color: '#64748b' };
};

// ─── Reminder Status ───
export const getReminderStatus = (status) => {
  const map = {
    delivered: { bg: '#e8faee', color: '#16a34a', label: 'Delivered' },
    failed: { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
    pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
  };
  return map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
};

// ─── Time Formatters ───
export const formatWaitTime = (minutes) => {
  if (minutes === 0) return 'No wait';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

// ─── Persona Color ───
export const getPersonaColor = (persona) => {
  const map = {
    'Chronic Worrier': { bg: '#fef3c7', color: '#b45309' },
    'Lifestyle Juggler': { bg: '#eff6ff', color: '#2563eb' },
    'Senior Dependent': { bg: '#fdf4ff', color: '#7c3aed' },
    'Health Conscious': { bg: '#e8faee', color: '#16a34a' },
    'Non-compliant': { bg: '#fee2e2', color: '#dc2626' },
    'Young Professional': { bg: '#e5f9f8', color: '#1b504c' },
    'Senior Independent': { bg: '#fdf4ff', color: '#7c3aed' },
  };
  return map[persona] || { bg: '#f1f5f9', color: '#64748b' };
};

// ─── Avatar Initials ───
export const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// ─── Random Avatar Color ───
const avatarColors = ['#1b504c', '#7c3aed', '#ea580c', '#0284c7', '#be185d', '#065f46', '#92400e'];
export const getAvatarColor = (name) => {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
};

// ─── Percentage helper ───
export const toPercent = (value, total) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

// ─── Clamp ───
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// ─── Channel Icon Map ───
export const channelIconName = (channel) => {
  const map = {
    SMS: 'MessageSquare',
    WhatsApp: 'Phone',
    Email: 'Mail',
    IVR: 'PhoneCall',
    'WhatsApp': 'MessageCircle',
  };
  return map[channel] || 'Bell';
};
