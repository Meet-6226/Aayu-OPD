import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ChevronRight, X, ShieldCheck, MapPin, Video, Languages } from 'lucide-react';
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
    <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 animate-pulse flex flex-col md:flex-row justify-between gap-5">
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-[12px] bg-[#F3F4F6] shrink-0" />
        <div className="space-y-2">
          <div className="h-4 bg-[#F3F4F6] rounded w-40" />
          <div className="h-3.5 bg-[#F3F4F6] rounded w-24" />
          <div className="h-3 bg-[#F3F4F6] rounded w-48" />
        </div>
      </div>
      <div className="h-9 bg-[#F3F4F6] rounded-[10px] w-24 align-self-end md:align-self-center shrink-0" />
    </div>
  );
}

export default function BrowseDoctors() {
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
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
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#374151]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-bold text-[#111827] tracking-tight">Find a Specialist</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Book OPD appointments or online video consultations with verified specialists.
          </p>
        </div>

        {/* Search & Sort Panel */}
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by name, department, or qualification..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-white border border-[#E5E7EB] rounded-[12px] pl-10 pr-9 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1E7F6A] focus:shadow-[0_0_0_3px_rgba(30,127,106,0.12)] transition-all duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); fetchAllDoctors(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <span className="text-xs font-semibold text-[#6B7280]">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs bg-white border border-[#E5E7EB] rounded-[10px] px-3 py-2 text-[#374151] focus:outline-none focus:border-[#1E7F6A] font-semibold"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Sidebar Filters */}
          <div className="lg:col-span-3 space-y-4">
            {/* Desktop department list */}
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Departments</p>
              <div className="space-y-1">
                {departments.map(dept => (
                  <button
                    key={dept}
                    onClick={() => handleDeptClick(dept)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-[8px] font-semibold transition-colors ${
                      selectedDept === dept && !searchQuery
                        ? 'bg-[#ECFDF5] text-[#1E7F6A]'
                        : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Doctor Cards Grid */}
          <div className="lg:col-span-9 space-y-4">
            {loading ? (
              [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
            ) : processedDoctors.length > 0 ? (
              processedDoctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/doctor/${doc.id}`)}
                  className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 cursor-pointer hover:border-[#D1D5DB] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-150 group"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-5">
                    
                    {/* Left: Avatar + Details */}
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-[12px] bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-[#1E7F6A]">
                          {doc.initials || getDoctorInitials(doc.name)}
                        </span>
                      </div>

                      {/* Doctor Info */}
                      <div className="min-w-0 space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-[#111827] group-hover:text-[#1E7F6A] transition-colors duration-150">
                            {doc.name}
                          </h2>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#047857] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                            <ShieldCheck className="h-3 w-3" />
                            Verified
                          </span>
                        </div>

                        {/* Specializations & Qualifications */}
                        <p className="text-xs text-[#374151]">
                          <strong className="text-[#1E7F6A]">{doc.department}</strong>
                          {doc.qualifications ? ` · ${doc.qualifications}` : ''}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-[#6B7280] flex-wrap pt-0.5">
                          <span className="font-semibold text-[#374151]">
                            {doc.experienceYears ? `${doc.experienceYears} Years Exp` : 'Senior Consultant'}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Languages className="h-3.5 w-3.5" />
                            {getDoctorLanguages(doc.id)}
                          </span>
                        </div>

                        {/* Specialization Tags */}
                        {doc.specializations && (
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {doc.specializations.slice(0, 3).map((spec, i) => (
                              <span key={i} className="text-[10px] font-semibold text-[#4B5563] bg-[#F3F4F6] px-2.5 py-0.5 rounded-full">
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Hospital Location */}
                        <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] pt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>Apollo Hospital, Jubilee Hills</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Booking Actions & Consultation Mode */}
                    <div className="flex flex-row md:flex-col justify-between md:justify-center md:items-end items-center gap-4 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#F3F4F6]">
                      
                      {/* Price & Rating */}
                      <div className="text-left md:text-right">
                        <div className="flex items-center gap-1.5 md:justify-end mb-1 text-xs">
                          {doc.rating && (
                            <span className="inline-flex items-center gap-0.5 font-bold text-[#111827]">
                              <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                              {Number(doc.rating).toFixed(1)}
                            </span>
                          )}
                          <span className="text-[#9CA3AF]">Rating</span>
                        </div>
                        <p className="text-base font-bold text-[#111827] font-mono">
                          ₹{doc.consultationFee || 800}
                        </p>
                        {doc.offersOnlineConsultation && (
                          <p className="text-[10px] font-semibold text-[#0369A1] mt-0.5">
                            Online Consult Available
                          </p>
                        )}
                      </div>

                      {/* CTA button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/doctor/${doc.id}`); }}
                        className="px-5 py-2.5 bg-[#1E7F6A] hover:bg-[#165B52] text-white text-xs font-semibold rounded-[10px] transition-colors duration-150 flex items-center gap-1"
                      >
                        Book Consultation
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-[#E5E7EB] rounded-[14px] py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <p className="text-sm font-semibold text-[#374151]">No specialists match your criteria</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Try resetting the department filter or typing a different search query</p>
                <button
                  onClick={() => { setSelectedDept('All'); setSearchQuery(''); fetchAllDoctors(); }}
                  className="mt-4 text-xs font-semibold text-[#1E7F6A] hover:underline"
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
