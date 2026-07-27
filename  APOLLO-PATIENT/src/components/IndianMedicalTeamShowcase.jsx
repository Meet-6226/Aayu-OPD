import React from 'react';
import { Star, MessageSquare, Clock } from 'lucide-react';

export default function IndianMedicalTeamShowcase({ className = '' }) {
  return (
    <div className={`relative w-full max-w-[560px] mx-auto flex flex-col items-center justify-center select-none font-inter ${className}`}>
      
      {/* TOP BADGE: Expert Apollo Doctors & Staff */}
      <div className="bg-[#1E7F6A] text-white px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shrink-0 mb-4 z-20 cursor-default text-xs font-semibold">
        <Star className="h-3.5 w-3.5 fill-[#ECFDF5] text-[#ECFDF5]" />
        <span>Expert Apollo Doctors & Staff</span>
      </div>

      {/* MAIN 5-MEMBER TRANSPARENT DOCTORS CUTOUT */}
      <div className="relative w-full flex items-center justify-center">
        
        {/* Left Sleek Compact Pill */}
        <div className="absolute -left-4 bottom-6 z-20 bg-white border border-[#E5E7EB] px-3.5 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-[#1E7F6A]" />
          <span className="text-xs font-semibold text-[#111827]">WhatsApp Confirmed</span>
        </div>

        {/* Right Sleek Compact Pill */}
        <div className="absolute -right-4 bottom-6 z-20 bg-white border border-[#E5E7EB] px-3.5 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[#1E7F6A]" />
          <span className="text-xs font-semibold text-[#111827]">0-Min Queue Wait</span>
        </div>

        {/* 5-Member Indian Doctors & Nurses Transparent Cutout */}
        <img
          src="/indian_team_5_cutout_transparent.png"
          alt="Apollo Medical Team"
          className="w-full max-w-[500px] h-auto object-contain filter drop-shadow-md hover:scale-[1.01] transition-transform duration-300 pointer-events-none"
          onError={(e) => {
            e.target.src = "/indian_doctors_cutout_transparent.png";
          }}
        />
      </div>

    </div>
  );
}
