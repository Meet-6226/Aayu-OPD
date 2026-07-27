import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ChevronRight, X, MapPin, Video, Languages, Clock, Filter } from 'lucide-react';
import { useDoctors } from '../hooks/useDoctors';

const departments = [
  'All', 'General Medicine', 'Cardiology', 'Orthopedics', 'Dermatology',
  'Neurology', 'ENT', 'Gynecology', 'Pediatrics',
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'experience', label: 'Most Experienced' },
];

const POPULAR_SEARCHES = ['Cardiology', 'Dr. Reddy', 'General Medicine', 'Dermatology'];

const getDoctorInitials = (name = '') => {
  const clean = name.replace(/^Dr\.\s+/i, '').trim();
  return clean.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DR';
};

const getDoctorLanguages = (id) => {
  const langs = {
    doc_001: 'English, Hindi, Gujarati',
    doc_002: 'English, Tamil, Telugu',
    doc_003: 'English, Malayalam, Hindi',
    doc_004: 'English, Telugu, Hindi',
    doc_005: 'English, Marathi, Hindi',
    doc_006: 'English, Malayalam, Tamil',
    doc_007: 'English, Hindi, Kannada',
    doc_008: 'English, Telugu, Kannada',
    doc_009: 'English, Bengali, Hindi',
    doc_010: 'English, Telugu, Hindi',
  };
  return langs[id] || 'English, Hindi';
};

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-[8px] bg-[#F1F5F9] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-[#F1F5F9] rounded w-40" />
          <div className="h-3 bg-[#F1F5F9] rounded w-56" />
          <div className="h-3 bg-[#F1F5F9] rounded w-32" />
        </div>
      </div>
    </div>
  );
}

export default function BrowseDoctors() {
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const { doctors, loading, fetchAllDoctors, fetchByDepartment, searchDoctors } = useDoctors();

  useEffect(() => {
    fetchAllDoctors();
  }, [fetchAllDoctors]);

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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Header */}
        <div className="border-b border-[#E2E8F0] pb-5">
          <h1 className="text-xl font-semibold tracking-tight">Find a Specialist</h1>
          <p className="text-xs text-[#64748B] mt-1">
            {processedDoctors.length} doctors available · Book OPD or video consultations
          </p>
        </div>

        {/* Search bar */}
        <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 shadow-elev-1">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search by name, department, or qualification…  ⌘K"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] pl-10 pr-9 py-2.5 text-sm placeholder-[#94A3B8] focus:outline-none focus:border-[#0f766e] focus:bg-white focus:shadow-[0_0_0_2px_rgba(15,118,110,0.12)] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); fetchAllDoctors(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border border-[#E2E8F0] rounded-[8px] bg-white text-[#475569]"
              >
                <Filter className="h-3.5 w-3.5" /> Filters
              </button>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 py-2.5 text-[#475569] focus:outline-none focus:border-[#0f766e] font-medium min-w-[140px]"
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2.5 text-[11px] text-[#64748B] flex-wrap">
            <span className="text-[#94A3B8] font-medium">Popular:</span>
            {POPULAR_SEARCHES.map(term => (
              <button
                key={term}
                onClick={() => handleSearchChange({ target: { value: term } })}
                className="hover:text-[#0f766e] underline decoration-dotted"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* Sidebar filters */}
          <div className={`lg:col-span-3 space-y-3 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 shadow-elev-1">
              <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-3">Department</p>
              <div className="space-y-0.5">
                {departments.map(dept => (
                  <button
                    key={dept}
                    onClick={() => handleDeptClick(dept)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-[8px] font-medium transition-colors ${
                      selectedDept === dept && !searchQuery
                        ? 'bg-[#0F172A] text-white'
                        : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4">
              <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">Availability</p>
              <label className="flex items-center gap-2 text-xs text-[#475569] py-1.5 cursor-pointer">
                <input type="checkbox" className="rounded border-[#CBD5E1] text-[#0f766e] focus:ring-[#0f766e]" defaultChecked />
                Available today
              </label>
              <label className="flex items-center gap-2 text-xs text-[#475569] py-1.5 cursor-pointer">
                <input type="checkbox" className="rounded border-[#CBD5E1] text-[#0f766e] focus:ring-[#0f766e]" />
                Video consultation
              </label>
            </div>
          </div>

          {/* Doctor cards */}
          <div className="lg:col-span-9 space-y-2">
            <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider px-0.5">
              {loading ? 'Loading…' : `${processedDoctors.length} results`}
            </p>

            {loading ? (
              [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
            ) : processedDoctors.length > 0 ? (
              processedDoctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/doctor/${doc.id}`)}
                  className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 cursor-pointer hover:border-[#CBD5E1] transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-[8px] bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-[#475569]">
                          {doc.initials || getDoctorInitials(doc.name)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0f766e] transition-colors">
                            {doc.name}
                          </h2>
                          <span className="text-[9px] font-semibold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[4px] uppercase">
                            {doc.status === 'available' ? 'Available' : 'Scheduled'}
                          </span>
                        </div>

                        <p className="text-xs text-[#64748B] mt-0.5">
                          <span className="font-medium text-[#475569]">{doc.department}</span>
                          {doc.qualifications ? ` · ${doc.qualifications}` : ''}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-[10px] text-[#64748B]">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {doc.experienceYears ? `${doc.experienceYears} yrs exp` : 'Senior'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3 text-[#D97706]" />
                            {doc.rating ? Number(doc.rating).toFixed(1) : '4.9'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Languages className="h-3 w-3" />
                            {getDoctorLanguages(doc.id).split(', ').slice(0, 2).join(', ')}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {doc.room || 'OPD · Block A'}
                          </span>
                        </div>

                        {doc.specializations && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.specializations.slice(0, 3).map((spec, i) => (
                              <span key={i} className="text-[9px] font-medium text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-[4px]">
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pl-15 sm:pl-0 border-t sm:border-t-0 border-[#F1F5F9] pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-medium">Fee</p>
                        <p className="text-base font-semibold font-mono-data text-[#0F172A]">₹{doc.consultationFee || 800}</p>
                        {doc.offersOnlineConsultation && (
                          <p className="text-[10px] font-medium text-[#2563eb] mt-0.5 inline-flex items-center gap-0.5">
                            <Video className="h-3 w-3" /> Video available
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/doctor/${doc.id}`); }}
                        className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d5a54] text-white text-xs font-semibold rounded-[8px] transition-colors inline-flex items-center gap-1"
                      >
                        Book <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-[#E2E8F0] rounded-[10px] py-16 text-center">
                <p className="text-sm font-medium text-[#475569]">No specialists match your criteria</p>
                <p className="text-xs text-[#94A3B8] mt-1">Adjust filters or try a different search term</p>
                <button
                  onClick={() => { setSelectedDept('All'); setSearchQuery(''); fetchAllDoctors(); }}
                  className="mt-3 text-xs font-semibold text-[#0f766e] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
