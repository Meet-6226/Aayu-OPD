import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ChevronRight, X } from 'lucide-react';
import { useDoctors } from '../hooks/useDoctors';

const departments = [
  'All', 'General Medicine', 'Cardiology', 'Orthopedics', 'Dermatology',
  'Neurology', 'ENT', 'Gynecology', 'Pediatrics',
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-low', label: 'Price ↑' },
  { value: 'price-high', label: 'Price ↓' },
  { value: 'experience', label: 'Most Exp.' },
];

const AVATAR_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-sky-100',    text: 'text-sky-700'    },
  { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  { bg: 'bg-rose-100',   text: 'text-rose-700'   },
  { bg: 'bg-teal-100',   text: 'text-teal-700'   },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
];

const getAvatarColor = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const getDoctorInitials = (name = '') => {
  const clean = name.replace(/^Dr\.\s+/i, '').trim();
  return clean.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DR';
};

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse border-b border-gray-50 last:border-0">
      <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded w-44" />
        <div className="h-3 bg-gray-100 rounded w-28" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-10 shrink-0" />
      <div className="h-8 bg-gray-100 rounded-lg w-20 shrink-0" />
    </div>
  );
}

export default function BrowseDoctors() {
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const navigate = useNavigate();

  const { doctors, loading, fetchAllDoctors, fetchByDepartment, searchDoctors } = useDoctors();

  useEffect(() => { fetchAllDoctors(); }, [fetchAllDoctors]);

  const handleDeptClick = async (dept) => {
    setSelectedDept(dept);
    setSearchQuery('');
    await fetchByDepartment(dept);
  };

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedDept('All');
    await searchDoctors(val);
  };

  const getSortedDoctors = () => {
    const sorted = [...doctors];
    if (sortBy === 'price-low') sorted.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
    else if (sortBy === 'price-high') sorted.sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
    else if (sortBy === 'rating') sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'experience') sorted.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
    return sorted;
  };

  const processedDoctors = getSortedDoctors();

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-7">

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Find a Specialist</h1>
        <p className="text-sm text-gray-500 mt-1">
          Book in-person consultations with verified Apollo specialists.
        </p>
      </div>

      {/* ── SEARCH BAR ──────────────────────────────────────────── */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, qualification, or specialty..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/10 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); fetchAllDoctors(); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── LAYOUT ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── SIDEBAR ─────────────────────────────────────────── */}
        <div className="lg:col-span-1 self-start lg:sticky lg:top-20">
          {/* Mobile chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden mb-4 scrollbar-hide">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => handleDeptClick(dept)}
                className={`shrink-0 text-[12px] px-3 py-1.5 rounded-full font-medium transition-all ${
                  selectedDept === dept && !searchQuery
                    ? 'bg-primary-teal text-white'
                    : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">
              Department
            </p>
            <div className="pb-2">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => handleDeptClick(dept)}
                  className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                    selectedDept === dept && !searchQuery
                      ? 'text-primary-teal font-semibold bg-primary-teal/5'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="border-t border-gray-100 px-4 pt-3 pb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sort By</p>
              <div className="space-y-1">
                {SORT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value)}
                    className={`w-full text-left px-2 py-2 rounded-lg text-[13px] transition-colors ${
                      sortBy === value
                        ? 'text-primary-teal font-semibold bg-primary-teal/5'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── DOCTOR LIST ─────────────────────────────────────── */}
        <div className="lg:col-span-3">
          {/* Result count + mobile sort */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">
              {loading ? 'Loading…' : `${processedDoctors.length} doctors`}
              {selectedDept !== 'All' && !searchQuery && (
                <span className="text-gray-400"> in {selectedDept}</span>
              )}
            </p>
            {/* Mobile sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="lg:hidden text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-primary-teal"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="divide-y divide-gray-50">
                {[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
              </div>
            ) : processedDoctors.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {processedDoctors.map((doc) => {
                  const { bg, text } = getAvatarColor(doc.name);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => navigate(`/doctor/${doc.id}`)}
                      className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                        <span className={`text-[12px] font-bold ${text}`}>
                          {doc.initials || getDoctorInitials(doc.name)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] font-semibold text-gray-900 leading-snug">
                            {doc.name}
                          </p>
                          {doc.isAvailable && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                              Available
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-gray-500 mt-0.5 truncate">
                          {doc.department}
                          {doc.qualifications ? ` · ${doc.qualifications}` : ''}
                          {doc.experienceYears ? ` · ${doc.experienceYears} yrs` : ''}
                        </p>
                      </div>

                      {/* Rating */}
                      {doc.rating && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="h-3 w-3 text-amber-400 fill-current" />
                          <span className="text-[13px] font-semibold text-gray-700">{doc.rating}</span>
                        </div>
                      )}

                      {/* Fee */}
                      <div className="hidden sm:block text-right shrink-0">
                        <p className="text-[14px] font-bold text-gray-900">₹{doc.consultationFee}</p>
                      </div>

                      {/* Book button */}
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/doctor/${doc.id}#book`); }}
                        className="shrink-0 text-[12px] font-semibold text-white bg-primary-teal px-4 py-2 rounded-lg hover:bg-primary-dark transition-all duration-150 shadow-sm"
                      >
                        Book
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-gray-400">
                No doctors found for your selection.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
