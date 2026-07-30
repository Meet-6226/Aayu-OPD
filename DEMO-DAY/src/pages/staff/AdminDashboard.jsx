import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, PieChart, Pie, Cell
} from 'recharts';
import { Download, RefreshCw, Cpu } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { fetchModelInfo, predictNoShowRisk } from '../../services/mlApi';

// ─── Sparkline Trend Mock Data ───
const sparkData1 = [{ v: 30 }, { v: 45 }, { v: 35 }, { v: 50 }, { v: 48 }, { v: 62 }, { v: 55 }, { v: 70 }];
const sparkData2 = [{ v: 28 }, { v: 26 }, { v: 29 }, { v: 25 }, { v: 24 }, { v: 23 }, { v: 24.3 }];
const sparkData3 = [{ v: 10 }, { v: 18 }, { v: 15 }, { v: 24 }, { v: 29 }, { v: 32 }, { v: 38.5 }];
const sparkData4 = [{ v: 18 }, { v: 17 }, { v: 15 }, { v: 16 }, { v: 15 }, { v: 14 }, { v: 14 }];

// ─── Row 2: 30 Days No-Show Area Chart Data ───
const noShow30Days = [
  { date: '1 Jun', rate: 26.5 },
  { date: '5 Jun', rate: 28.2 },
  { date: '10 Jun', rate: 23.1 },
  { date: '15 Jun', rate: 24.2 },
  { date: '20 Jun', rate: 27.2 },
  { date: '25 Jun', rate: 23.5 },
  { date: '30 Jun', rate: 24.3 }
];

// ─── Row 2: Recovery Rate by Day Bar Data ───
const recoveryRateByDay = [
  { day: 'Mon', rate: 68 },
  { day: 'Tue', rate: 72 },
  { day: 'Wed', rate: 58 },
  { day: 'Thu', rate: 65 },
  { day: 'Fri', rate: 48 },
  { day: 'Sat', rate: 35 },
  { day: 'Sun', rate: 20 }
];

// ─── Row 3: Heatmap Mock Data Grid ───
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = ['9 AM', '10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

const heatmapData = {
  'All Doctors': [
    { day: 'Mon', time: '9 AM', rate: 8, skipped: 1, total: 12 },
    { day: 'Mon', time: '10 AM', rate: 15, skipped: 3, total: 20 },
    { day: 'Mon', time: '11 AM', rate: 24, skipped: 5, total: 21 },
    { day: 'Mon', time: '12 PM', rate: 12, skipped: 2, total: 17 },
    { day: 'Mon', time: '2 PM', rate: 28, skipped: 4, total: 14 },
    { day: 'Mon', time: '3 PM', rate: 19, skipped: 3, total: 16 },
    { day: 'Mon', time: '4 PM', rate: 35, skipped: 7, total: 20 },
    { day: 'Mon', time: '5 PM', rate: 45, skipped: 9, total: 20 },

    { day: 'Tue', time: '9 AM', rate: 12, skipped: 2, total: 16 },
    { day: 'Tue', time: '10 AM', rate: 8, skipped: 1, total: 12 },
    { day: 'Tue', time: '11 AM', rate: 18, skipped: 3, total: 17 },
    { day: 'Tue', time: '12 PM', rate: 15, skipped: 3, total: 20 },
    { day: 'Tue', time: '2 PM', rate: 22, skipped: 4, total: 18 },
    { day: 'Tue', time: '3 PM', rate: 27, skipped: 5, total: 18 },
    { day: 'Tue', time: '4 PM', rate: 31, skipped: 6, total: 19 },
    { day: 'Tue', time: '5 PM', rate: 38, skipped: 7, total: 18 },

    { day: 'Wed', time: '9 AM', rate: 14, skipped: 2, total: 14 },
    { day: 'Wed', time: '10 AM', rate: 19, skipped: 3, total: 16 },
    { day: 'Wed', time: '11 AM', rate: 25, skipped: 5, total: 20 },
    { day: 'Wed', time: '12 PM', rate: 9, skipped: 1, total: 11 },
    { day: 'Wed', time: '2 PM', rate: 35, skipped: 6, total: 17 },
    { day: 'Wed', time: '3 PM', rate: 42, skipped: 8, total: 19 },
    { day: 'Wed', time: '4 PM', rate: 38, skipped: 8, total: 21 },
    { day: 'Wed', time: '5 PM', rate: 48, skipped: 10, total: 21 },

    { day: 'Thu', time: '9 AM', rate: 6, skipped: 1, total: 16 },
    { day: 'Thu', time: '10 AM', rate: 12, skipped: 2, total: 17 },
    { day: 'Thu', time: '11 AM', rate: 22, skipped: 4, total: 18 },
    { day: 'Thu', time: '12 PM', rate: 14, skipped: 2, total: 14 },
    { day: 'Thu', time: '2 PM', rate: 26, skipped: 5, total: 19 },
    { day: 'Thu', time: '3 PM', rate: 18, skipped: 3, total: 17 },
    { day: 'Thu', time: '4 PM', rate: 29, skipped: 5, total: 17 },
    { day: 'Thu', time: '5 PM', rate: 32, skipped: 6, total: 19 },

    { day: 'Fri', time: '9 AM', rate: 18, skipped: 3, total: 17 },
    { day: 'Fri', time: '10 AM', rate: 25, skipped: 5, total: 20 },
    { day: 'Fri', time: '11 AM', rate: 33, skipped: 6, total: 18 },
    { day: 'Fri', time: '12 PM', rate: 15, skipped: 3, total: 20 },
    { day: 'Fri', time: '2 PM', rate: 41, skipped: 7, total: 17 },
    { day: 'Fri', time: '3 PM', rate: 39, skipped: 7, total: 18 },
    { day: 'Fri', time: '4 PM', rate: 44, skipped: 8, total: 18 },
    { day: 'Fri', time: '5 PM', rate: 52, skipped: 11, total: 21 },

    { day: 'Sat', time: '9 AM', rate: 22, skipped: 3, total: 14 },
    { day: 'Sat', time: '10 AM', rate: 29, skipped: 5, total: 17 },
    { day: 'Sat', time: '11 AM', rate: 42, skipped: 8, total: 19 },
    { day: 'Sat', time: '12 PM', rate: 35, skipped: 6, total: 17 },
    { day: 'Sat', time: '2 PM', rate: 55, skipped: 11, total: 20 },
    { day: 'Sat', time: '3 PM', rate: 62, skipped: 13, total: 21 },
    { day: 'Sat', time: '4 PM', rate: 58, skipped: 11, total: 19 },
    { day: 'Sat', time: '5 PM', rate: 68, skipped: 15, total: 22 },
  ],
  'Dr. Rajesh Mehta': [
    { day: 'Mon', time: '9 AM', rate: 5, skipped: 1, total: 20 },
    { day: 'Mon', time: '10 AM', rate: 8, skipped: 1, total: 13 },
    { day: 'Mon', time: '11 AM', rate: 12, skipped: 2, total: 16 },
    { day: 'Mon', time: '12 PM', rate: 9, skipped: 1, total: 11 },
    { day: 'Mon', time: '2 PM', rate: 15, skipped: 2, total: 13 },
    { day: 'Mon', time: '3 PM', rate: 10, skipped: 1, total: 10 },
    { day: 'Mon', time: '4 PM', rate: 18, skipped: 2, total: 11 },
    { day: 'Mon', time: '5 PM', rate: 22, skipped: 3, total: 14 },
    ...DAYS.slice(1).flatMap(d => TIME_SLOTS.map(t => ({ day: d, time: t, rate: Math.floor(Math.random() * 25), skipped: 2, total: 15 })))
  ]
};

// ─── Row 4: Department Breakdown ───
const deptData = [
  { name: 'Cardiology', rate: 32 },
  { name: 'Orthopedics', rate: 28 },
  { name: 'Neurology', rate: 35 },
  { name: 'General Medicine', rate: 22 },
  { name: 'Dermatology', rate: 15 }
];

// ─── Row 4: Persona Distribution ───
const personaData = [
  { name: 'Working Professional', value: 42, color: '#1b504c' },
  { name: 'Elderly', value: 23, color: '#397a74' },
  { name: 'Student', value: 18, color: '#689f9a' },
  { name: 'Default', value: 17, color: '#97c9c4' }
];

// ─── Row 5: Revenue Impact ───
const revenueData = [
  { date: '1 Jun', atRisk: 80, recovered: 20, loss: 60 },
  { date: '5 Jun', atRisk: 75, recovered: 28, loss: 47 },
  { date: '10 Jun', atRisk: 72, recovered: 35, loss: 37 },
  { date: '15 Jun', atRisk: 68, recovered: 42, loss: 26 },
  { date: '20 Jun', atRisk: 55, recovered: 48, loss: 7 },
  { date: '25 Jun', atRisk: 42, recovered: 55, loss: 0 },
  { date: '30 Jun', atRisk: 30, recovered: 68, loss: 0 }
];

// ─── Count-up Hook ───
function useCountUp(targetStr, duration = 800) {
  const isCurrency = targetStr.startsWith('₹');
  const isPercent = targetStr.endsWith('%');
  const isMin = targetStr.includes('min');
  const isLakhs = targetStr.includes('L');
  // Remove currency, %, commas, L, min etc for numeric parsing
  let cleanNum = parseFloat(targetStr.replace(/[^0-9.]/g, '')) || 0;
  const [val, setVal] = useState(0);

  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * cleanNum);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [cleanNum, duration]);

  if (isCurrency) {
    return `₹${val.toFixed(1)}${isLakhs ? 'L' : ''}`;
  }
  if (isPercent) {
    return `${val.toFixed(1)}%`;
  }
  if (isMin) {
    return `${val.toFixed(1)} min`;
  }
  return Math.round(val).toLocaleString();
}

// ─── KPI Card ───
function KpiCard({ label, value, subtext = "vs last week", trend, sparklineData, trendIsGoodDown = false }) {
  const displayVal = useCountUp(value);
  const isPositive = trend > 0;
  const showGreen = (isPositive && !trendIsGoodDown) || (!isPositive && trendIsGoodDown);

  return (
    <div
      style={{
        background: 'white', 
        borderRadius: '12px', 
        padding: '1.25rem', 
        border: '1px solid #e2e8f0',
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start', 
        flexWrap: 'wrap', 
        gap: '1rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = '#1b504c40';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      <div>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{label}</span>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#1a1a2e', margin: '0.25rem 0', fontVariantNumeric: 'tabular-nums' }}>
          {displayVal}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: 600, color: showGreen ? '#16a34a' : '#ef4444' }}>
          <span>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
          <span style={{ color: '#94a3b8', fontWeight: 400 }}>{subtext}</span>
        </div>
      </div>

      <div style={{ width: 80, height: 36, marginTop: '0.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData}>
            <Area type="monotone" dataKey="v" stroke="#1b504c" strokeWidth={1.5} fill="none" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Heatmap Component ───
function Heatmap({ doctorFilter }) {
  const activeGrid = heatmapData[doctorFilter] || heatmapData['All Doctors'];
  const [hoveredCell, setHoveredCell] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div style={{ minWidth: 540, display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', gap: '0.375rem' }}>
          <div />
          {DAYS.map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 500, color: '#4b5563', paddingBottom: '0.5rem', fontFamily: 'Space Grotesk, sans-serif' }}>
              {day}
            </div>
          ))}

          {TIME_SLOTS.map(time => {
            return (
              <React.Fragment key={time}>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: 500, color: '#64748b', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {time}
                </div>

                {DAYS.map(day => {
                  const cell = activeGrid.find(c => c.day === day && c.time === time) || { rate: 0, skipped: 0, total: 0 };
                  
                  let bg = '#e8faee';
                  let text = '#16a34a';
                  if (cell.rate > 10 && cell.rate <= 20) {
                    bg = '#e8faee';
                    text = '#15803d';
                  } else if (cell.rate > 20 && cell.rate <= 30) {
                    bg = '#fff3d6';
                    text = '#b45309';
                  } else if (cell.rate > 30 && cell.rate <= 40) {
                    bg = '#fff3d6';
                    text = '#78350f';
                  } else if (cell.rate > 40) {
                    bg = '#fee2e2';
                    text = '#991b1b';
                  }

                  const isHovered = hoveredCell && hoveredCell.day === day && hoveredCell.time === time;

                  return (
                    <div
                      key={day}
                      onMouseEnter={() => setHoveredCell({ day, time, ...cell })}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{ position: 'relative' }}
                    >
                      <div
                        style={{
                          background: bg,
                          color: text,
                          height: 36,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {cell.rate}%
                      </div>

                      {isHovered && (
                        <div
                          style={{
                            position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                            background: '#1a1a2e', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '4px',
                            fontSize: '0.68rem', zIndex: 20, whiteSpace: 'nowrap', pointerEvents: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{day} {time}</span> · <span>{cell.rate}% no-show</span>
                          <div style={{ marginTop: '0.15rem', color: '#94a3b8' }}>
                            {cell.skipped} of {cell.total} patients skipped
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid #f3f4f6', paddingTop: '0.875rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>NO-SHOW RISK LEGEND:</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: '0–10% (Optimal)', bg: '#e8faee', text: '#16a34a' },
            { label: '20–30% (Moderate)', bg: '#fff3d6', text: '#b45309' },
            { label: '40%+ (High risk)', bg: '#fee2e2', text: '#991b1b' },
          ].map(leg => (
            <div key={leg.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: leg.bg, color: leg.text, padding: '0.2rem 0.625rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 500 }}>
              {leg.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [doctorFilter, setDoctorFilter] = useState('All Doctors');
  const [modelInfo, setModelInfo]       = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fetch live model metrics on mount and set mounted status
  useEffect(() => {
    setMounted(true);
    fetchModelInfo().then(info => {
      if (info) setModelInfo(info);
    });
  }, []);

  // Recalculate risk scores for all upcoming appointments in Firestore
  const handleRecalculate = async () => {
    if (recalculating) return;
    setRecalculating(true);
    try {
      const { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');

      // Fetch today’s and future confirmed appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const apptQuery = query(
        collection(db, 'appointments'),
        where('status', '==', 'confirmed')
      );
      const snap = await getDocs(apptQuery);
      const docs = snap.docs;

      if (docs.length === 0) {
        toast('No confirmed appointments found to recalculate.', { icon: 'ℹ️' });
        return;
      }

      toast.loading(`Recalculating ${docs.length} appointment(s)…`, { id: 'recalc' });
      let updated = 0;

      for (const apptDoc of docs) {
        const appt = apptDoc.data();
        // Fetch linked patient data
        let patientData = {};
        try {
          const { getDoc } = await import('firebase/firestore');
          const patientRef = doc(db, 'patients', appt.patientId);
          const patientSnap = await getDoc(patientRef);
          if (patientSnap.exists()) patientData = patientSnap.data();
        } catch (_) {}

        const mlResult = await predictNoShowRisk({
          patientNoShows:   patientData.totalNoShows  || 0,
          patientVisits:    patientData.totalVisits   || 1,
          distanceKm:       patientData.distanceKm    || 10,
          leadTimeDays:     appt.leadTimeDays         || 0,
          patientAge:       patientData.age           || 30,
          patientGender:    patientData.gender        || 'male',
          appointmentDate:  appt.appointmentDate,
          appointmentTime:  appt.appointmentTime,
          department:       appt.department           || 'General Medicine',
          persona:          appt.persona              || '',
          familyNotified:   appt.familyNotified       || false,
          consultationType: 'new',
          patientName:      patientData.name          || 'Patient',
          weatherRain:      appt.weatherRainUsed      ?? false,
          trafficCongestionScore: appt.trafficScore    ?? 0.3,
        });

        try {
          await updateDoc(doc(db, 'appointments', apptDoc.id), {
            riskScore:    mlResult.risk_score,
            riskLevel:    mlResult.risk_level,
            shapFactors:  mlResult.shap_factors,
            mlSummary:    mlResult.summary,
            modelVersion: mlResult.model_version,
            updatedAt:    serverTimestamp(),
          });
          updated++;
        } catch (_) {}
      }

      toast.success(`✓ Recalculated ${updated}/${docs.length} appointments with real ML scores`, { id: 'recalc', duration: 4000 });
    } catch (err) {
      toast.error(`Recalculation failed: ${err.message}`, { id: 'recalc' });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 500, color: '#1a1a2e', letterSpacing: '-0.02em', margin: 0 }}>
            Analytics & Insights
          </h1>
          <p style={{ fontSize: '15px', color: '#374151', marginTop: '0.25rem', margin: 0 }}>
            Predictive no-show metrics, waitlist recovery efficacy, and revenue leaks
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: '6px' }}>
            {['Last 7 Days', 'Last 30 Days', 'Last 90 Days'].map(opt => (
              <button
                key={opt}
                onClick={() => setDateRange(opt)}
                style={{
                  padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                  background: dateRange === opt ? '#1b504c' : 'transparent',
                  color: dateRange === opt ? 'white' : '#64748b',
                  transition: 'all 120ms',
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          <button
            onClick={() => toast.success('Exporting analytics PDF...')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 1rem', background: 'white', color: '#1b504c', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
            }}
          >
            <Download size={14} /> Export PDF
          </button>

          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 1rem',
              background: recalculating ? '#f1f5f9' : '#1b504c', color: recalculating ? '#94a3b8' : 'white',
              border: 'none', borderRadius: '6px', cursor: recalculating ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem', fontWeight: 500, transition: 'all 150ms',
            }}
          >
            <RefreshCw size={14} style={{ animation: recalculating ? 'spin 1s linear infinite' : 'none' }} />
            {recalculating ? 'Recalculating…' : 'Recalculate Risk Scores'}
          </button>
        </div>
      </div>

      {/* KPI METRICS (4 cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <KpiCard label="Total Monthly Appointments" value="2,847" trend={12} sparklineData={sparkData1} />
        <KpiCard label="No-Show Rate" value="18.4%" trend={-4.2} sparklineData={sparkData2} trendIsGoodDown />
        <KpiCard label="Revenue Recovered" value="₹2.4L" trend={28} sparklineData={sparkData3} />
        <KpiCard label="Avg Slot Recovery Time" value="2.8 min" trend={-3.5} sparklineData={sparkData4} trendIsGoodDown />
      </div>

      {/* MAIN CHARTS (Increased gap to 3rem / gap-12) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '3rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        
        {/* Left Chart: Area chart (Single Color #1b504c) */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 500, color: '#1a1a2e', margin: 0 }}>
                No-Show Rate — Last 30 Days
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Shows day-to-day rate variations and reference targets</span>
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1b504c', background: '#e5f9f8', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Reference Target (25%)
            </div>
          </div>

          {mounted && (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={noShow30Days} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                <defs>
                  <linearGradient id="colorNoShow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b504c" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#1b504c" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ 
                  fontFamily: 'Plus Jakarta Sans, sans-serif', 
                  fontSize: '0.75rem', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  background: 'white'
                }} />
                <ReferenceLine y={25} stroke="#1b504c" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="rate" name="No-show Rate" stroke="#1b504c" strokeWidth={2} fill="url(#colorNoShow)" activeDot={{ r: 5, stroke: 'white', strokeWidth: 2, fill: '#1b504c' }} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right Chart: Bar chart (Single Color #1b504c) */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #f3f4f6' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 500, color: '#1a1a2e', marginBottom: '0.25rem', margin: 0 }}>
            Recovery Rate by Day
          </h2>
          <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Efficacy percentage by slot fill triggers</span>

          {mounted && (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={recoveryRateByDay} margin={{ top: 10, right: 0, bottom: 0, left: -25 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '0.78rem' }} />
                <Bar dataKey="rate" fill="#1b504c" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* HEATMAP */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '1.75rem', border: '1px solid #f3f4f6', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 500, color: '#1a1a2e', margin: 0 }}>
                OPD Utilization Density
              </h2>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Heatmap grid tracks historical cancellation density across OPD operating slots.</p>
          </div>

          <select
            value={doctorFilter}
            onChange={e => setDoctorFilter(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', color: '#374151', outline: 'none', background: 'white' }}
          >
            <option value="All Doctors">All Doctors</option>
            <option value="Dr. Rajesh Mehta">Dr. Rajesh Mehta</option>
          </select>
        </div>

        <Heatmap doctorFilter={doctorFilter} />
      </div>

      {/* ROW 4 — DEPT BREAKDOWN & PERSONA (Increased gap to 3rem / gap-12) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '3rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        
        {/* Left: Department (Single Color #1b504c) */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #f3f4f6' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 500, color: '#1a1a2e', marginBottom: '1.25rem', margin: 0 }}>
            No-Shows by Department
          </h2>

          {mounted && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 35 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="rate" fill="#1b504c" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right: Persona Donut (Exception: uses 4 muted variations of #1b504c) */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #f3f4f6' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 500, color: '#1a1a2e', marginBottom: '1.25rem', margin: 0 }}>
            Persona Distribution
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={personaData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="value">
                      {personaData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total</span>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: '#1a1a2e', fontVariantNumeric: 'tabular-nums' }}>2,847</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {personaData.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                  <span style={{ fontWeight: 500, color: '#374151' }}>{p.name}</span>
                  <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>({p.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ROW 5 — REVENUE IMPACT (Single Color #1b504c for recovered) */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '1.75rem', border: '1px solid #f3f4f6', marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 500, color: '#1a1a2e', marginBottom: '0.25rem', margin: 0 }}>
          Revenue Recovered Trend
        </h2>
        <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
          Visualizing recovered no-show fees over 30 days as automated reminders roll out.
        </span>

        {mounted && (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1b504c" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#1b504c" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="k" />
              <Tooltip contentStyle={{ 
                fontFamily: 'Plus Jakarta Sans, sans-serif', 
                fontSize: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                background: 'white'
              }} />
              <Area type="monotone" dataKey="recovered" name="Revenue Recovered" stroke="#1b504c" fill="url(#colorRevenue)" strokeWidth={2} activeDot={{ r: 5, stroke: 'white', strokeWidth: 2, fill: '#1b504c' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <Toaster position="top-right" />

      {/* ROW 6 — MODEL PERFORMANCE CARD (real data from /model-info) */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '1.75rem', border: '1px solid #f3f4f6', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Cpu size={16} color="#1b504c" />
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 500, color: '#1a1a2e', margin: 0 }}>
            Model Performance
          </h2>
          {modelInfo && (
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#94a3b8', background: '#f8fafc', padding: '0.15rem 0.5rem', borderRadius: '99px', border: '1px solid #e2e8f0' }}>
              {modelInfo.model_version} &middot; {modelInfo.feature_count} features
            </span>
          )}
        </div>
        <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
          Live accuracy metrics from the trained XGBoost classifier &mdash; fetched directly from the deployed ML API.
        </span>

        {modelInfo ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'AUC-ROC',   value: modelInfo.metrics?.xgboost?.auc_roc,   color: '#1b504c', help: 'Discrimination ability' },
              { label: 'Recall',    value: modelInfo.metrics?.xgboost?.recall,    color: '#2563eb', help: 'No-shows caught' },
              { label: 'F1 Score',  value: modelInfo.metrics?.xgboost?.f1_score,  color: '#7c3aed', help: 'Precision-recall balance' },
              { label: 'Precision', value: modelInfo.metrics?.xgboost?.precision, color: '#d97706', help: 'Alert accuracy' },
              { label: 'Accuracy',  value: modelInfo.metrics?.xgboost?.accuracy,  color: '#64748b', help: 'Overall correctness' },
            ].map(m => (
              <div 
                key={m.label} 
                style={{ 
                  background: 'linear-gradient(to bottom, #ffffff, #f8fafc)', 
                  borderRadius: '12px', 
                  padding: '1.25rem 1rem', 
                  border: '1px solid #e2e8f0', 
                  textAlign: 'center',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = m.color + '60'; // 37% opacity of the custom color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.65rem', fontWeight: 700, color: m.color, fontVariantNumeric: 'tabular-nums' }}>
                  {m.value != null ? (m.value * 100).toFixed(1) + '%' : '—'}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginTop: '0.25rem' }}>{m.label}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem' }}>{m.help}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '2rem 0' }}>
            Loading model metrics from ML API… (may take 30–50s if service is waking up)
          </div>
        )}

        {modelInfo && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#166534' }}>
            <strong>Why XGBoost over Logistic Regression?</strong> XGBoost achieves 2.4× better recall (catching actual no-shows), which is the metric that matters for scheduling — missing a no-show is far more costly than a false alarm.
          </div>
        )}
      </div>

    </div>
  );
}
