import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Shield, ArrowRight, Eye, EyeOff, Users, Clock, Activity, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { now } from '../../utils/appTime';

const stats = [
  { label: 'Patients Today', value: '284', icon: Users },
  { label: 'Avg Wait Time', value: '18 min', icon: Clock },
  { label: 'Risk Alerts', value: '12', icon: Activity },
  { label: 'On-time Rate', value: '82%', icon: TrendingUp },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('apollo_staff_logged_in') === 'true') {
      const role = localStorage.getItem('apollo_staff_role') || 'admin';
      if (role === 'doctor') {
        navigate('/staff/doctor-view');
      } else {
        navigate('/staff/dashboard');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanUsername = form.username.trim();
    const cleanPassword = form.password.trim();
    
    if (!cleanUsername || !cleanPassword) {
      toast.error('Please enter credentials');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    
    console.log("[Staff Login] Attempting login for:", cleanUsername, "Password length:", cleanPassword.length);
    
    if (cleanUsername === 'apollo_admin@apollo.com' && cleanPassword === 'Nidaan One OPD#Staff2026!') {
      localStorage.setItem('apollo_staff_logged_in', 'true');
      localStorage.setItem('apollo_staff_role', 'admin');
      toast.success('Welcome to Nidaan One OPD Platform!');
      navigate('/staff/dashboard');
    } else if (cleanUsername === 'doctor@apollo.com' && cleanPassword === 'Doctor#2026!') {
      localStorage.setItem('apollo_staff_logged_in', 'true');
      localStorage.setItem('apollo_staff_role', 'doctor');
      toast.success('Welcome Doctor Rajesh Mehta!');
      navigate('/staff/doctor-view');
    } else {
      toast.error('Invalid username or password!');
    }
  };


  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f8fafc',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      {/* Left Panel — Branding (65% width) */}
      <div
        style={{
          flex: '0 0 65%',
          background: '#1b504c',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4.5rem',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '4rem' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={16} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Nidaan One OPD
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Intelligence Platform
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: '4rem' }}>
          <h1 style={{
            color: 'white',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '2.5rem',
            fontWeight: 500,
            lineHeight: 1.2,
            marginBottom: '1.25rem',
            letterSpacing: '-0.02em',
          }}>
            Smarter OPD. <br />
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>Better Patient Outcomes.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem', lineHeight: 1.5, maxWidth: 440, margin: 0 }}>
            OPD intelligence for Nidaan One Clinics — featuring real-time risk stratification, automated slot recovery, and caregiver notification routing.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', maxWidth: 600 }}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{
                  borderLeft: '1px solid rgba(255,255,255,0.15)',
                  paddingLeft: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <Icon size={13} color="rgba(255,255,255,0.5)" />
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>{stat.label}</span>
                </div>
                <div style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem', fontVariantNumeric: 'tabular-nums' }}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel — Login Form (35% width) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          background: 'white',
          borderLeft: '1px solid #f3f4f6',
        }}
      >
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 500, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: '#1a1a2e', marginBottom: '0.35rem' }}>
              Staff Portal
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
              Sign in with your Nidaan One credentials
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                Username / Employee ID
              </label>
              <input
                type="text"
                required
                placeholder="admin@apollo.com"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '0.85rem',
                  color: '#1a1a2e',
                  background: 'white',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{
                    width: '100%',
                    height: 38,
                    padding: '0 2.5rem 0 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '0.85rem',
                    color: '#1a1a2e',
                    background: 'white',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 38,
                background: '#1b504c',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 150ms',
                marginTop: '0.5rem',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#153f3c'}
              onMouseLeave={e => e.currentTarget.style.background = '#1b504c'}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Select Roles for Demo */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Demo Login
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setForm({ username: 'apollo_admin@apollo.com', password: 'Nidaan One OPD#Staff2026!' })}
                style={{
                  flex: 1, height: 32, fontSize: '0.75rem', fontWeight: 600,
                  color: '#1b504c', background: '#e5f9f8', border: '1px solid #97c9c4',
                  borderRadius: '6px', cursor: 'pointer', transition: 'all 120ms'
                }}
              >
                👤 Admin
              </button>
              <button
                type="button"
                onClick={() => setForm({ username: 'doctor@apollo.com', password: 'Doctor#2026!' })}
                style={{
                  flex: 1, height: 32, fontSize: '0.75rem', fontWeight: 600,
                  color: '#1b504c', background: '#e5f9f8', border: '1px solid #97c9c4',
                  borderRadius: '6px', cursor: 'pointer', transition: 'all 120ms'
                }}
              >
                🩺 Doctor
              </button>
            </div>
          </div>

          <p style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>
            Nidaan One Clinics Group © {now().getFullYear()} · v2.1
          </p>
        </div>
      </div>
    </div>
  );
}
