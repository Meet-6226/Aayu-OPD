import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, FileText, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { now, isToday, isYesterday } from '../utils/appTime';

const getNotificationMeta = (type) => {
  switch (type?.toLowerCase()) {
    case 'confirmed':
      return { icon: Calendar, color: 'bg-[#ECFDF5] text-[#1E7F6A]' };
    case 'results':
      return { icon: FileText, color: 'bg-[#ECFDF5] text-[#1E7F6A]' };
    case 'prescription':
      return { icon: CheckCircle2, color: 'bg-[#ECFDF5] text-[#1E7F6A]' };
    case 'alert':
    case 'update':
      return { icon: ShieldAlert, color: 'bg-[#FFFBEB] text-[#D97706]' };
    default:
      return { icon: Bell, color: 'bg-[#ECFDF5] text-[#1E7F6A]' };
  }
};

const getSection = (timestamp) => {
  if (!timestamp) return 'Earlier';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const dateStr = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;

  if (isToday(dateStr)) return 'Today';
  if (isYesterday(dateStr)) return 'Yesterday';
  return 'Earlier';
};

const formatTimeLabel = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  const sec = getSection(timestamp);
  const timeStr = date.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
  
  if (sec === 'Today') {
    const hoursAgo = Math.floor((now() - date) / (1000 * 60 * 60));
    if (hoursAgo === 0) {
      const minutesAgo = Math.floor((now() - date) / (1000 * 60));
      return `Today · ${minutesAgo || 1}m ago`;
    }
    return `Today · ${hoursAgo} hours ago`;
  } else if (sec === 'Yesterday') {
    return `Yesterday · ${timeStr}`;
  } else {
    return `Earlier · ${date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' })}`;
  }
};

export default function PatientNotifications() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications(authUser?.uid);

  useEffect(() => {
    if (authUser?.uid) {
      fetchNotifications();
    }
  }, [authUser, fetchNotifications]);

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      await markAsRead(n.id);
    }
    if (n.appointmentId) {
      navigate(`/appointment/${n.appointmentId}`);
    } else if (n.type === 'results') {
      navigate('/profile');
    } else if (n.type === 'recovery') {
      navigate('/doctors');
    } else {
      navigate('/home');
    }
  };

  const sections = ['Today', 'Yesterday', 'Earlier'];

  return (
    <div className="min-h-screen bg-[#F5F7F8] font-sans text-[#374151]">
      <div className="max-w-[680px] mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">Notifications</h1>
            <p className="text-sm text-[#6B7280] mt-1">Stay updated with your doctor consultations and care plans.</p>
          </div>
          <button
            onClick={markAllAsRead}
            disabled={loading}
            className="text-xs font-semibold text-[#1E7F6A] hover:underline mb-0.5 shrink-0"
          >
            Mark all read
          </button>
        </div>

        {/* Grouped Notifications */}
        <div className="space-y-6">
          {loading && notifications.length === 0 ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#1E7F6A]" />
            </div>
          ) : notifications.length > 0 ? (
            sections.map((sec) => {
              const secItems = notifications.filter((n) => getSection(n.createdAt) === sec);
              if (secItems.length === 0) return null;
              
              return (
                <div key={sec} className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] border-b border-[#E5E7EB] pb-2 text-left">
                    {sec}
                  </h3>
                  
                  <div className="space-y-2.5">
                    {secItems.map((n) => {
                      const { icon: IconComponent, color } = getNotificationMeta(n.type);
                      const isUnread = !n.read;
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-4 rounded-[14px] border transition-all duration-150 cursor-pointer flex items-start justify-between gap-4 ${
                            isUnread
                              ? 'bg-[#F0FDF4] border-[#A7F3D0]'
                              : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                          }`}
                        >
                          <div className="flex items-start gap-3.5 w-full text-left">
                            <div className={`p-2.5 rounded-[10px] shrink-0 ${color}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-xs font-bold truncate ${isUnread ? 'text-[#111827]' : 'text-[#374151]'}`}>
                                  {n.title}
                                </h4>
                                {isUnread && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E7F6A] shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed pr-2">
                                {n.body}
                              </p>
                              <span className="text-[10px] text-[#9CA3AF] mt-2 block">{formatTimeLabel(n.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <Bell className="h-8 w-8 text-[#9CA3AF] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#374151]">All caught up</p>
              <p className="text-xs text-[#9CA3AF] mt-1">You do not have any new notifications at this time.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
