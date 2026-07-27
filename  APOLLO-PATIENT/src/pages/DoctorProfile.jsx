import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Heart, Award, ArrowLeft, Shield, Calendar, MapPin } from 'lucide-react';
import { useDoctorSlots } from '../hooks/useDoctorSlots';
import { getNext7DaysIST } from '../utils/appTime';

// Generate next 7 dates starting today — IST-anchored via appTime.js
const getNext7Days = () => getNext7DaysIST(7).map(d => ({
  dayLabel: d.dayLabel,
  dateLabel: d.dateLabel,
  monthLabel: d.monthLabel,
  fullDateString: d.fullDateString,
  dateString: d.dateString,
}));

function DoctorProfileSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-8 bg-white font-sans text-text-medium py-8 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 bg-[#f3f4f6] rounded w-24 mb-6"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left column skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border-custom rounded-2xl p-6 space-y-6">
            <div className="flex items-start">
              <div className="w-16 h-16 rounded-full bg-[#f3f4f6] shrink-0"></div>
              <div className="ml-4 space-y-2 flex-1">
                <div className="h-5 bg-[#f3f4f6] rounded w-36"></div>
                <div className="h-3.5 bg-[#f3f4f6] rounded w-20"></div>
                <div className="h-3 bg-[#f3f4f6] rounded w-48 mt-2"></div>
                <div className="h-3 bg-[#f3f4f6] rounded w-32"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-y border-[#f3f4f6] py-4 text-center">
              <div className="space-y-1"><div className="h-3 bg-[#f3f4f6] rounded w-12 mx-auto"></div><div className="h-4 bg-[#f3f4f6] rounded w-16 mx-auto"></div></div>
              <div className="space-y-1"><div className="h-3 bg-[#f3f4f6] rounded w-12 mx-auto"></div><div className="h-4 bg-[#f3f4f6] rounded w-16 mx-auto"></div></div>
              <div className="space-y-1"><div className="h-3 bg-[#f3f4f6] rounded w-12 mx-auto"></div><div className="h-4 bg-[#f3f4f6] rounded w-16 mx-auto"></div></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-[#f3f4f6] rounded w-28"></div>
              <div className="h-3 bg-[#f3f4f6] rounded w-full"></div>
              <div className="h-3 bg-[#f3f4f6] rounded w-5/6"></div>
            </div>
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-border-custom rounded-2xl p-6 space-y-6">
            <div className="h-5 bg-[#f3f4f6] rounded w-40"></div>
            <div className="space-y-2">
              <div className="h-3 bg-[#f3f4f6] rounded w-20"></div>
              <div className="flex space-x-2 pb-2">
                <div className="h-16 bg-[#f3f4f6] rounded-xl w-16 shrink-0"></div>
                <div className="h-16 bg-[#f3f4f6] rounded-xl w-16 shrink-0"></div>
                <div className="h-16 bg-[#f3f4f6] rounded-xl w-16 shrink-0"></div>
                <div className="h-16 bg-[#f3f4f6] rounded-xl w-16 shrink-0"></div>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-[#f3f4f6]">
              <div className="h-3 bg-[#f3f4f6] rounded w-24"></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-10 bg-[#f3f4f6] rounded-lg"></div>
                <div className="h-10 bg-[#f3f4f6] rounded-lg"></div>
                <div className="h-10 bg-[#f3f4f6] rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const datesList = getNext7Days();

  const [selectedDate, setSelectedDate] = useState(datesList[1]); // default tomorrow
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationMode, setConsultationMode] = useState('in_person');

  const { doctor, slots, loading, error, fetchDoctor, fetchSlots } = useDoctorSlots();

  // Fetch doctor details on mount
  useEffect(() => {
    if (id) {
      fetchDoctor(id);
    }
  }, [id, fetchDoctor]);

  // Fetch slots whenever selectedDate or doctorId changes
  useEffect(() => {
    if (id && selectedDate) {
      fetchSlots(id, selectedDate.dateString);
      setSelectedSlot(null); // Clear selected slot when date changes
    }
  }, [id, selectedDate, fetchSlots]);

  const handleBookingRedirect = () => {
    if (!selectedSlot) return;
    const finalFeeNum = consultationMode === 'online' ? (doctor.onlineConsultationFee || Math.round(doctor.consultationFee * 0.65)) : doctor.consultationFee;
    navigate('/booking/confirm', {
      state: {
        doctorId: id,
        doctorName: doctor.name,
        dept: doctor.department,
        date: selectedDate.fullDateString,
        dateString: selectedDate.dateString,
        time: selectedSlot.time,
        slotId: selectedSlot.id,
        fees: `₹${finalFeeNum}`,
        consultationMode: consultationMode
      }
    });
  };

  // Group slots client-side
  const getPeriod = (timeStr) => {
    if (!timeStr) return 'Morning';
    if (timeStr.includes('AM')) return 'Morning';
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour === 12 || hour < 4) return 'Afternoon';
    return 'Evening';
  };

  const groupedSlots = {
    Morning: [],
    Afternoon: [],
    Evening: []
  };

  slots.forEach((slot) => {
    const period = getPeriod(slot.time);
    if (groupedSlots[period]) {
      groupedSlots[period].push(slot);
    }
  });

  const totalSlotsCount = slots.length;

  if (loading && !doctor) {
    return <DoctorProfileSkeleton />;
  }

  if (error || !doctor) {
    return (
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-20 text-center font-sans">
        <h2 className="text-xl font-bold text-red-500 mb-2">Doctor Profile Not Found</h2>
        <p className="text-text-medium mb-6">The requested doctor's account does not exist or has been modified.</p>
        <button
          onClick={() => navigate('/doctors')}
          className="bg-primary-teal text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          View all doctors
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to results</span>
      </button>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        
        {/* LEFT COLUMN: Doctor info (2 cols, sticky on desktop) */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-24 self-start">
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6">
            <div className="flex items-start">
              <div className="w-14 h-14 rounded-[6px] bg-[#f0fdfa] border border-[#ccfbf1] flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-[#0f766e]">{doctor.initials || "DR"}</span>
              </div>
              <div className="ml-4 space-y-1">
                <h1 className="text-[18px] font-bold text-[#111827] leading-snug">
                  {doctor.name}
                </h1>
                <span className="inline-block bg-[#f0fdfa] text-[#0f766e] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
                  {doctor.department}
                </span>
                <p className="text-xs text-[#6B7280] mt-1">{doctor.qualifications}</p>
                <p className="text-xs text-[#9CA3AF]">{doctor.hospital || "CareFlow Clinic, Jubilee Hills"}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-y border-[#F3F4F6] py-4 mt-5 text-center text-xs">
              <div>
                <p className="text-[#9CA3AF] uppercase tracking-wider font-semibold text-[10px]">Experience</p>
                <p className="text-[15px] font-bold text-[#111827] mt-1">{doctor.experienceYears} yrs</p>
              </div>
              <div>
                <p className="text-[#9CA3AF] uppercase tracking-wider font-semibold text-[10px]">Rating</p>
                <p className="text-[15px] font-bold text-[#111827] mt-1">★ {doctor.rating ? doctor.rating.toFixed(1) : "5.0"}</p>
              </div>
              <div>
                <p className="text-[#9CA3AF] uppercase tracking-wider font-semibold text-[10px]">Fee</p>
                <p className="text-[15px] font-bold text-[#111827] mt-1">
                  ₹{consultationMode === 'online' ? (doctor.onlineConsultationFee || Math.round(doctor.consultationFee * 0.65)) : doctor.consultationFee}
                </p>
              </div>
            </div>

            {/* About section */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-text-dark mb-2">About Doctor</h3>
              <p className="text-xs text-text-medium leading-relaxed">
                {doctor.bio}
              </p>
            </div>

            {/* Specializations */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-text-dark mb-3">Specializations</h3>
              <div className="flex flex-wrap gap-1.5">
                {doctor.specializations?.map((spec, i) => (
                  <span
                    key={i}
                    className="bg-[#f9fafb] border border-border-custom px-2.5 py-1 rounded-lg text-xs text-text-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Booking (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6">
            <h2 className="font-semibold text-[16px] text-[#111827] mb-5">
              Book Appointment
            </h2>

            {/* Consultation Mode Selector */}
            {doctor.offersOnlineConsultation && (
              <div className="mb-5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2.5">
                  Consultation Mode
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#F3F4F6] p-1 rounded-[10px]">
                  <button
                    type="button"
                    onClick={() => setConsultationMode('in_person')}
                    className={`py-2.5 px-4 rounded-[8px] text-xs font-semibold text-center transition-all duration-150 ${
                      consultationMode === 'in_person'
                        ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                        : 'text-[#6B7280] hover:text-[#374151]'
                    }`}
                  >
                    In-Clinic Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultationMode('online')}
                    className={`py-2.5 px-4 rounded-[8px] text-xs font-semibold text-center transition-all duration-150 ${
                      consultationMode === 'online'
                        ? 'bg-white text-[#0369A1] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                        : 'text-[#6B7280] hover:text-[#374151]'
                    }`}
                  >
                    Video Consultation
                  </button>
                </div>
              </div>
            )}

            {/* Date picker (7 day horizontal scroll) */}
            <div className="mb-6">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2.5">
                  Select Date
                </label>
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin select-none">
                  {datesList.map((dt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(dt)}
                      className={`flex flex-col items-center justify-center p-3 rounded-[6px] border text-center shrink-0 min-w-[66px] transition-all duration-150 ${
                        selectedDate.dateString === dt.dateString
                          ? 'border-[#0f766e] bg-[#f0fdfa] text-[#0f766e]'
                          : 'border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider font-semibold">{dt.dayLabel}</span>
                      <span className="text-[17px] font-bold mt-1 leading-none">{dt.dateLabel}</span>
                      <span className="text-[10px] text-[#9CA3AF] mt-1">{dt.monthLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

            {/* Time Slots grid grouped by period */}
            <div className="space-y-6">
              {loading ? (
                <div className="py-12 text-center text-text-light text-sm">
                  Loading slots...
                </div>
              ) : totalSlotsCount > 0 ? (
                Object.keys(groupedSlots).map((period) => (
                  groupedSlots[period].length > 0 && (
                    <div key={period} className="border-t border-[#f3f4f6] pt-4 first:border-t-0 first:pt-0">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light mb-3">
                        {period} Slots
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {groupedSlots[period].map((slot, i) => (
                          <button
                            key={slot.id || i}
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 text-center text-xs font-semibold rounded-[6px] border transition-all duration-150 ${
                              !slot.isAvailable
                                ? 'bg-[#F9FAFB] border-transparent text-[#D1D5DB] cursor-not-allowed line-through'
                                : selectedSlot?.id === slot.id
                                ? 'border-[#0f766e] bg-[#0f766e] text-white'
                                : 'border-[#E5E7EB] bg-white text-[#374151] hover:border-[#0f766e]/50'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))
              ) : (
                <div className="py-12 border-t border-[#f3f4f6] text-center text-text-light text-sm">
                  No slots scheduled for this date. Please check another date.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* CONFIRMATION STICKY BAR */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] p-4 z-40 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] transition-all duration-200">
          <div className="max-w-[1320px] mx-auto w-full flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Selected</p>
              <p className="text-sm font-semibold text-[#111827] mt-0.5">
                {selectedDate.fullDateString} · {selectedSlot.time}
              </p>
              {consultationMode === 'online' && (
                <p className="text-[11px] text-[#0369A1] font-semibold mt-0.5">Video Consultation</p>
              )}
            </div>
            
            <button
              onClick={handleBookingRedirect}
              className="px-6 py-2.5 bg-[#0f766e] text-white font-semibold text-sm rounded-[6px] hover:bg-[#0d5a54] transition-colors duration-150 shrink-0"
            >
              Confirm →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
