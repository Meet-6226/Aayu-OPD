import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, AlertTriangle, RefreshCw, IndianRupee,
  ArrowRight, Clock, Send, BarChart2, Plus,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { hourlyLoad } from '../../data/staffMockData';
import { useStaffAppointments } from '../../hooks/useStaffAppointments';
import { useSlotRecovery } from '../../hooks/useSlotRecovery';
import { nowHour, todayDisplayLong, todayDateString } from '../../utils/appTime';

import Loader from '../../components/ui/Loader';

// ─── Persona map ───
const PERSONA_MAP = {
  'Chronic Worrier':   { emoji: '😟', label: 'Chronic Worrier' },
  'Lifestyle Juggler': { emoji: '💼', label: 'Working Pro' },
  'Senior Dependent':  { emoji: '👴', label: 'Elderly' },
  'Health Conscious':  { emoji: '🌱', label: 'Health-Conscious' },
  'Non-compliant':     { emoji: '⚠️',  label: 'Non-compliant' },
  'Young Professional':{ emoji: '🎓', label: 'Young Pro' },
  'Senior Independent':{ emoji: '👴', label: 'Elderly' },
};

const RISK_CONFIG = {
  high:   { color: '#ef4444', dot: '#ef4444', label: 'High Risk' },
  medium: { color: '#d97706', dot: '#f59e0b', label: 'Medium Risk' },
  low:    { color: '#16a34a', dot: '#22c55e', label: 'Low Risk' },
};

// ─── Stat Card ───
function StatCard({ icon: Icon, number, label, numberColor = '#1a1a2e' }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1.25rem',
        border: '1px solid #f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{label}</span>
        <Icon size={16} color="#9ca3af" strokeWidth={1.5} />
      </div>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '1.75rem',
        fontWeight: 700,
        color: numberColor,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums'
      }}>
        {number}
      </div>
    </div>
  );
}

// ─── Timeline Patient Card ───
function TimelineCard({ patient, isLast }) {
  const navigate = useNavigate();
  const risk = RISK_CONFIG[patient.riskLevel] || RISK_CONFIG.low;
  const persona = PERSONA_MAP[patient.persona] || { emoji: '👤', label: patient.personaTag };

  const shapTop2 = patient.shapFactors
    ? patient.shapFactors
        .sort((a, b) => b.value - a.value)
        .slice(0, 2)
        .map(f => `${f.name} +${Math.round(f.value)}%`)
        .join(' · ')
    : '';

  return (
    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
      {/* Timeline column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 56, flexShrink: 0 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 500, fontFamily: 'Space Grotesk, sans-serif', color: '#64748b', whiteSpace: 'nowrap', marginBottom: '0.5rem', textAlign: 'center' }}>
          {patient.appointmentTime.replace(':00', '').replace(' ', '\n')}
        </div>
        {/* Static dot */}
        <div
          style={{ width: 6, height: 6, borderRadius: '50%', background: risk.dot, flexShrink: 0, marginTop: '0.35rem', zIndex: 2 }}
        />
        {!isLast && (
          <div style={{ flex: 1, width: 1, background: '#e2e8f0', marginTop: '0.25rem', minHeight: 40 }} />
        )}
      </div>

      {/* Card */}
      <div
        onClick={() => navigate(`/staff/patient/${patient.id}`)}
        style={{
          flex: 1,
          background: 'white',
          borderRadius: '8px',
          padding: '1.25rem',
          border: '1px solid #f3f4f6',
          borderLeft: `3px solid ${risk.dot}`,
          cursor: 'pointer',
          transition: 'background-color 150ms',
          marginBottom: isLast ? 0 : '0.875rem',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a2e' }}>{patient.name}</span>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>· {patient.age}y {patient.gender}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {patient.doctor} · {patient.specialty}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#374151', background: '#f1f5f9', borderRadius: '4px', padding: '0.15rem 0.4rem' }}>
              {persona.emoji} {persona.label}
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: risk.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: risk.dot }} />
              {risk.label}
            </span>
          </div>
        </div>

        {shapTop2 && (
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ color: '#d97706', fontWeight: 500 }}>Factors:</span>
            <span>{shapTop2}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: '#64748b' }}>
            <span style={{ color: '#16a34a', fontWeight: 500 }}>48h confirmed</span>
            <span>·</span>
            {patient.persona.includes('Senior') || patient.persona.includes('Elderly') ? (
              <span style={{ color: '#16a34a', fontWeight: 500 }}>Family notified</span>
            ) : (
              <span style={{ color: '#16a34a', fontWeight: 500 }}>WhatsApp read</span>
            )}
            <span>·</span>
            <span style={{ color: '#d97706', fontWeight: 500 }}>Awaiting final confirm</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#1b504c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            Details <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Doctor Schedule Card ───
function DoctorCard({ doc }) {
  const total = 12;
  const filled = doc.filledSlots;
  const pct = Math.round((filled / total) * 100);
  const barColor = '#1b504c';
  const initials = doc.avatar;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1rem',
        border: '1px solid #f3f4f6',
        minWidth: 160,
        flex: 1,
        transition: 'background-color 150ms',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1b504c', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{doc.name.replace('Dr. ', '')}</div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{doc.department}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{filled}/{total} slots</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: barColor, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99 }} />
      </div>
    </div>
  );
}

// ─── Activity Feed ───
const ACTIVITY = [
  { text: 'Rahul Sharma confirmed via WhatsApp', time: '2 min ago' },
  { text: 'Priya Sharma — High risk flagged by AI', time: '15 min ago' },
  { text: 'Slot 11:00 AM recovered — Dr. Mehta', time: '1 hr ago' },
  { text: 'Family notified for Mr. Ramesh Gupta', time: '2 hrs ago' },
];

function ActivityFeed() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {ACTIVITY.map((item, i) => (
        <div
          key={i}
          style={{
            padding: '0.5rem 0',
            borderBottom: i < ACTIVITY.length - 1 ? '1px solid #f8fafc' : 'none',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.4 }}>{item.text}</div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>{item.time}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Revenue Ticker ───
function RevenueTicker({ amount }) {
  return (
    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#b45309', fontVariantNumeric: 'tabular-nums' }}>
      ₹{amount.toLocaleString('en-IN')}
    </span>
  );
}

function SH({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 500, letterSpacing: '-0.01em', color: '#1a1a2e', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.15rem 0 0 0' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function MorningBriefingPage() {
  const navigate = useNavigate();
  const { appointments, doctors: liveDoctors, loading, fetchTodaySummary } = useStaffAppointments();
  const { openSlots, waitlist } = useSlotRecovery();

  // Compute dynamic doctor schedules from live Firestore data
  const docList = Object.values(liveDoctors).map(docInfo => {
    const docAppts = appointments.filter(a => a.doctorId === docInfo.id);
    const filledSlots = docAppts.filter(a => ['confirmed', 'completed', 'walk-in'].includes(a.status)).length;
    return {
      id: docInfo.id,
      name: docInfo.name,
      department: docInfo.department,
      avatar: docInfo.avatar || docInfo.name.replace('Dr. ', '').split(' ').map(n => n[0]).join(''),
      filledSlots
    };
  });

  const summary = fetchTodaySummary();
  const highRiskCount = summary.highRisk;
  
  // Show first 3 active appointments for today
  const upNextPatients = appointments
    .filter(a => ['confirmed', 'pending', 'walk-in'].includes(a.status))
    .slice(0, 3);

  const slotsRecovered = appointments.filter(a => a.status === 'recovered').length;

  const hour = nowHour(); // IST-anchored via appTime.js
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dayStr = todayDisplayLong(); // IST-anchored via appTime.js

  if (loading) {
    return <Loader message="Synchronizing Clinic Intelligence..." />;
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* GREETING */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          {greeting}, Anjali
        </h1>
        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span>{dayStr}</span>
          <span>·</span>
          <span>Apollo Hospital, Jubilee Hills</span>
          <span style={{ fontSize: '0.72rem', color: '#b45309', background: '#fef3c7', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
            System Date: {todayDateString()}
          </span>
        </div>
      </div>

      {/* ALERT BANNER */}
      <div
        style={{
          background: '#1b504c',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, fontSize: '1.2rem', letterSpacing: '-0.01em', marginBottom: '0.25rem' }}>
            {highRiskCount} patients need attention today
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.83rem' }}>
            ₹{summary.revenueAtRisk.toLocaleString('en-IN')} revenue at risk · {openSlots.filter(s => s.status !== 'recovered').length} slots recoverable · {waitlist.filter(w => w.status === 'waiting').length} on waitlist
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => navigate('/staff/appointments')}
            style={{ background: 'white', color: '#1b504c', border: 'none', borderRadius: '6px', padding: '0.45rem 1rem', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            View All <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard icon={Users}          number={summary.total}  label="Total Appointments" />
        <StatCard icon={AlertTriangle}  number={highRiskCount}   label="High Risk No-Shows" numberColor="#ef4444" />
        <StatCard icon={RefreshCw}      number={slotsRecovered}   label="Slots Recovered" />
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.25rem',
          border: '1px solid #f3f4f6',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Revenue at Risk</span>
            <IndianRupee size={16} color="#9ca3af" strokeWidth={1.5} />
          </div>
          <RevenueTicker amount={summary.revenueAtRisk} />
        </div>
      </div>

      {/* MAIN BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '2.5rem', marginBottom: '2.5rem', alignItems: 'start' }}>

        {/* LEFT — Timeline */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.75rem', border: '1px solid #f3f4f6' }}>
          <SH
            title="Up Next"
            subtitle="Next 3 appointments by risk priority"
            action={
              <button onClick={() => navigate('/staff/appointments')} style={{ fontSize: '0.75rem', color: '#1b504c', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                All patients <ChevronRight size={13} />
              </button>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {upNextPatients.map((p, i) => (
              <TimelineCard key={p.id} patient={p} isLast={i === upNextPatients.length - 1} />
            ))}
          </div>
        </div>

        {/* RIGHT — Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #f3f4f6' }}>
            <SH title="Quick Actions" subtitle="Common OPD tasks" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {[
                { label: 'Add walk-in', icon: Plus, onClick: () => navigate('/staff/appointments') },
                { label: 'Doctor late', icon: Clock, onClick: () => navigate('/staff/doctor-view') },
                { label: 'Bulk remind', icon: Send, onClick: () => navigate('/staff/reminders') },
                { label: 'Recovery report', icon: BarChart2, onClick: () => navigate('/staff/slot-recovery') },
              ].map((link, idx) => {
                const LinkIcon = link.icon;
                return (
                  <button
                    key={idx}
                    onClick={link.onClick}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0.5rem 0',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: '#1b504c',
                      fontWeight: 500,
                      transition: 'color 120ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#153f3c'}
                    onMouseLeave={e => e.currentTarget.style.color = '#1b504c'}
                  >
                    <LinkIcon size={14} color="#9ca3af" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* DOCTOR SCHEDULE + ACTIVITY FEED */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem', marginBottom: '2.5rem', alignItems: 'start' }}>
        
        {/* Doctor Schedule */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.75rem', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <SH
            title="Today's Doctor Schedule"
            subtitle="Slot fill rate across OPD"
            action={
              <button onClick={() => navigate('/staff/doctor-view')} style={{ fontSize: '0.75rem', color: '#1b504c', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                Full view <ChevronRight size={13} />
              </button>
            }
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {docList.slice(0, 3).map((doc) => <DoctorCard key={doc.id} doc={doc} />)}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #f3f4f6' }}>
          <SH title="Live Activity" subtitle="Real-time OPD events" />
          <div style={{ marginTop: '1rem' }}>
            <ActivityFeed />
          </div>
        </div>

      </div>

      {/* HOURLY LOAD CHART */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', border: '1px solid #f3f4f6', boxShadow: '0 4px 20px rgba(0,0,0,0.015)' }}>
        <SH
          title="Hourly Patient Load"
          subtitle="Appointments distributed across today's schedule"
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.6rem', background: '#e8faee', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#1b504c' }}>Peak: 10–11 AM</span>
            </div>
          }
        />
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={hourlyLoad} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
            <defs>
              <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1b504c" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#1b504c" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
            <RTooltip
              contentStyle={{ 
                fontFamily: 'Plus Jakarta Sans, sans-serif', 
                fontSize: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                background: 'white'
              }}
              itemStyle={{ color: '#1b504c', fontWeight: 600 }}
            />
            <Area 
              type="monotone" 
              dataKey="patients" 
              name="Patients" 
              stroke="#1b504c" 
              strokeWidth={2} 
              fill="url(#colorPatients)" 
              activeDot={{ r: 5, stroke: 'white', strokeWidth: 2, fill: '#1b504c' }}
              dot={{ fill: '#1b504c', r: 3, strokeWidth: 0 }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
