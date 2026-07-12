import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, FileText, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { now, isToday, isYesterday, todayDateString } from '../utils/appTime';

// Map notification type to icon and styling color
const getNotificationMeta = (type) => {
  switch (type?.toLowerCase()) {
    case 'confirmed':
      return { icon: Calendar, color: 'bg-mint-green text-primary-teal' };
    case 'results':
      return { icon: FileText, color: 'bg-light-teal text-primary-teal' };
    case 'prescription':
      return { icon: CheckCircle2, color: 'bg-mint-green text-primary-teal' };
    case 'alert':
    case 'update':
      return { icon: ShieldAlert, color: 'bg-warm-yellow text-text-dark' };
    default:
      return { icon: Bell, color: 'bg-light-teal text-primary-teal' };
  }
};

// Calculate Date Section — uses IST-anchored appTime helpers
const getSection = (timestamp) => {
  if (!timestamp) return 'Earlier';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  // Get YYYY-MM-DD of the notification date in IST
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const dateStr = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;

  if (isToday(dateStr)) return 'Today';
  if (isYesterday(dateStr)) return 'Yesterday';
  return 'Earlier';
};

// Formats timestamp to human readable relative time — uses IST-anchored now()
const formatTimeLabel = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  const sec = getSection(timestamp);
  const timeStr = date.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
  
  if (sec === 'Today') {
    const hoursAgo = Math.floor((now() - date) / (1000 * 60 * 60));
    if (hoursAgo === 0) {
      const minutesAgo = Math.floor((now() - date) / (1000 * 60));
      return `Today \u00b7 ${minutesAgo || 1}m ago`;
    }
    return `Today \u00b7 ${hoursAgo} hours ago`;
  } else if (sec === 'Yesterday') {
    return `Yesterday \u00b7 ${timeStr}`;
  } else {
    return `Earlier \u00b7 ${date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' })}`;
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
    <div className="max-w-[680px] mx-auto px-5 py-8 bg-white font-sans text-text-medium">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-dark">
            Notifications
          </h1>
          <p className="text-xs text-text-light mt-0.5">
            Stay updated with your doctor communications.
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          disabled={loading}
          className="text-xs font-semibold text-primary-teal hover:underline mb-0.5 shrink-0"
        >
          Mark all read
        </button>
      </div>

      {/* Grouped Notifications */}
      <div className="space-y-6">
        {loading && notifications.length === 0 ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-teal" />
          </div>
        ) : notifications.length > 0 ? (
          sections.map((sec) => {
            const secItems = notifications.filter((n) => getSection(n.createdAt) === sec);
            if (secItems.length === 0) return null;
            
            return (
              <div key={sec} className="space-y-2.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-light border-b border-border-light pb-2">
                  {sec}
                </h3>
                
                <div className="space-y-2">
                  {secItems.map((n) => {
                    const { icon: IconComponent, color } = getNotificationMeta(n.type);
                    const isUnread = !n.read;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 ${
                          isUnread
                            ? 'bg-light-teal/30 border-primary-teal/15 hover:border-primary-teal/30'
                            : 'bg-white border-border-custom hover:border-[#d1d5db]'
                        }`}
                      >
                        <div className="flex items-start space-x-3.5 w-full text-left">
                          <div className={`p-2 rounded-lg shrink-0 ${color}`}>
                            <IconComponent className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className={`text-xs font-bold truncate ${isUnread ? 'text-text-dark' : 'text-text-medium'}`}>
                                {n.title}
                              </h4>
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-teal shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-[#4b5563] mt-1 leading-relaxed pr-2">
                              {n.body}
                            </p>
                            <span className="text-[10px] text-text-light mt-2 block">{formatTimeLabel(n.createdAt)}</span>
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
          <div className="bg-[#f9fafb] border border-border-custom rounded-2xl p-12 text-center text-text-light">
            You do not have any notifications.
          </div>
        )}
      </div>

    </div>
  );
}
