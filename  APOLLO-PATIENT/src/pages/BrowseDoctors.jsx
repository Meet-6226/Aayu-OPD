import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Award, Shield, Heart } from 'lucide-react';
import { useDoctors } from '../hooks/useDoctors';

const departments = [
  "All", "General Medicine", "Cardiology", "Orthopedics", "Dermatology",
  "Neurology", "ENT", "Gynecology", "Pediatrics"
];

function DoctorCardSkeleton() {
  return (
    <div className="bg-white border border-border-custom rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
      <div className="flex items-start w-full">
        <div className="w-14 h-14 rounded-full bg-[#f3f4f6] shrink-0"></div>
        <div className="ml-4 space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-[#f3f4f6] rounded w-28"></div>
            <div className="h-3 bg-[#f3f4f6] rounded w-16"></div>
          </div>
          <div className="h-3.5 bg-[#f3f4f6] rounded w-40"></div>
          <div className="h-3.5 bg-[#f3f4f6] rounded w-48"></div>
          <div className="flex items-center space-x-3 pt-2">
            <div className="h-3 bg-[#f3f4f6] rounded w-12"></div>
            <div className="h-3 bg-[#f3f4f6] rounded w-24"></div>
          </div>
        </div>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-[#f3f4f6] pt-4 sm:border-none sm:pt-0 shrink-0 gap-3 w-full sm:w-auto">
        <div className="space-y-1 text-left sm:text-right">
          <div className="h-3 bg-[#f3f4f6] rounded w-8 sm:ml-auto"></div>
          <div className="h-5 bg-[#f3f4f6] rounded w-16 sm:ml-auto"></div>
        </div>
        <div className="h-9 bg-[#f3f4f6] rounded w-24"></div>
      </div>
    </div>
  );
}

export default function BrowseDoctors() {
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const navigate = useNavigate();

  const { doctors, loading, fetchAllDoctors, fetchByDepartment, searchDoctors } = useDoctors();

  // Load all doctors on mount
  useEffect(() => {
    fetchAllDoctors();
  }, [fetchAllDoctors]);

  // Handle department filtering
  const handleDeptClick = async (dept) => {
    setSelectedDept(dept);
    setSearchQuery(''); // Clear search when switching departments
    await fetchByDepartment(dept);
  };

  // Handle search text changes
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedDept('All'); // Reset department when searching globally
    await searchDoctors(val);
  };

  const handleBook = (id) => {
    navigate(`/doctor/${id}#book`);
  };

  // Client-side sorting on already filtered doctors state
  const getSortedDoctors = () => {
    let sorted = [...doctors];
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
    } else if (sortBy === 'price-high') {
      sorted.sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'experience') {
      sorted.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
    }
    return sorted;
  };

  const processedDoctors = getSortedDoctors();

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-8 bg-white font-sans text-text-medium py-8">
      {/* Header Info */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-dark">
          Find a Specialist
        </h1>
        <p className="text-text-medium text-sm mt-1">
          Search and book physical or virtual consultations with verified medical experts.
        </p>
      </div>

      {/* MOBILE ONLY: Horizontal Department Chips */}
      <div className="lg:hidden flex flex-wrap gap-2 mb-6">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => handleDeptClick(dept)}
            className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all ${
              selectedDept === dept
                ? 'bg-primary-teal text-white'
                : 'bg-[#f9fafb] border border-border-custom text-text-medium'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* DESKTOP LEFT SIDEBAR (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-1 space-y-6 self-start sticky top-24">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light mb-3">
              Departments
            </h3>
            <div className="space-y-1">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => handleDeptClick(dept)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all ${
                    selectedDept === dept
                      ? 'bg-light-teal text-primary-teal font-medium'
                      : 'hover:bg-[#f9fafb] text-text-medium hover:text-text-dark'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border-custom">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light mb-3">
              Sort By
            </h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 border border-border-custom rounded-lg text-sm text-text-medium bg-white focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal"
            >
              <option value="rating">Highest Rating</option>
              <option value="experience">Most Experience</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search bar */}
          <div className="bg-white/80 backdrop-blur-md border border-border-custom rounded-2xl px-4.5 py-3.5 flex items-center transition-all duration-300 focus-within:border-primary-teal focus-within:ring-4 focus-within:ring-primary-teal/10 shadow-sm">
            <Search className="h-4.5 w-4.5 text-text-light mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search by doctor name, qualification, or department..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent border-none outline-none w-full text-sm text-text-dark placeholder-[#9ca3af] p-0"
            />
          </div>

          {/* Results count & Mobile Sort */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-medium font-bold">
              {loading ? "Loading doctors..." : `Showing ${processedDoctors.length} doctors`}
            </span>
            <div className="lg:hidden flex items-center space-x-2">
              <span className="text-text-light text-xs uppercase font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1.5 border border-border-custom rounded-lg text-xs bg-white text-text-medium"
              >
                <option value="rating">Rating</option>
                <option value="experience">Experience</option>
                <option value="price-low">Price: Low-High</option>
                <option value="price-high">Price: High-Low</option>
              </select>
            </div>
          </div>

          {/* Doctor Card List */}
          <div className="space-y-4">
            {loading ? (
              // 3 skeletons
              <>
                <DoctorCardSkeleton />
                <DoctorCardSkeleton />
                <DoctorCardSkeleton />
              </>
            ) : processedDoctors.length > 0 ? (
              processedDoctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/doctor/${doc.id}`)}
                  className="bg-white border border-border-custom/80 rounded-2xl p-5 hover:border-primary-teal/30 hover:scale-[1.015] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                >
                  <div className="flex items-start">
                    {/* Avatar circle */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-light-teal to-teal-50 flex items-center justify-center shrink-0 border border-primary-teal/10 shadow-inner">
                      <span className="text-base font-bold text-primary-teal font-display">{doc.initials || "DR"}</span>
                    </div>
                    
                    {/* Core details */}
                    <div className="ml-4 space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <h4 className="text-base font-bold text-text-dark leading-snug font-display">
                          {doc.name}
                        </h4>
                        <span className="bg-primary-teal/10 text-primary-teal text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg tracking-wider font-display">
                          {doc.department}
                        </span>
                      </div>
                      <p className="text-xs text-text-medium font-medium">{doc.qualifications}</p>
                      <p className="text-xs text-text-light">{doc.hospital || "Apollo Hospital, Jubilee Hills"}</p>
                      
                      <div className="flex items-center space-x-3 text-xs mt-2 pt-1">
                        <div className="flex items-center space-x-1 bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{doc.rating ? doc.rating.toFixed(1) : "5.0"}</span>
                          <span className="text-amber-700/60 font-medium">({doc.reviewCount || 0})</span>
                        </div>
                        <span className="text-text-light">&#183;</span>
                        <span className="text-text-medium font-semibold">{doc.experienceYears} years experience</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-[#f3f4f6] pt-4 sm:border-none sm:pt-0 shrink-0 gap-3">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-text-light font-medium uppercase tracking-wider leading-none">Fee</p>
                      <p className="text-lg font-extrabold text-text-dark mt-0.5">₹{doc.consultationFee}</p>
                    </div>
                    <div className="flex space-x-2 sm:space-x-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBook(doc.id);
                        }}
                        className="bg-primary-teal text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-primary-dark shadow-md shadow-primary-teal/10 hover:shadow-primary-teal/20 transition-all cursor-pointer"
                      >
                        Book slot
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#f9fafb] border border-border-custom rounded-2xl p-12 text-center text-text-light">
                No doctors matching your selection. Please try adjusting your search terms or filters.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
