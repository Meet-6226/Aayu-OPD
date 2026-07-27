import React from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Clock, Check } from 'lucide-react';

export default function IndianDoctorsShowcase({ className = '' }) {
  return (
    <div className={`relative w-full max-w-[680px] mx-auto flex items-center justify-center p-4 sm:p-6 select-none font-inter ${className}`}>
      
      {/* ── TOP RIGHT BADGE: Expert Apollo Doctors ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="absolute top-2 right-2 sm:right-6 z-20 bg-[#165B52] text-white px-4 py-2 rounded-2xl shadow-xl border border-white/20 flex items-center space-x-2 cursor-default"
      >
        <Star className="h-4 w-4 fill-[#EAF7F2] text-[#EAF7F2]" />
        <span className="text-xs sm:text-sm font-bold tracking-wide">
          Expert Apollo Doctors
        </span>
      </motion.div>
 
      {/* ── LEFT FLOATING BADGE: WhatsApp Confirmed ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -16, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-1/2 -translate-y-1/2 left-[-20px] sm:left-[-10px] z-20 bg-white/95 backdrop-blur-md border border-[#E8ECEF] p-3.5 sm:p-4 rounded-[20px] shadow-2xl flex items-center space-x-3 text-left max-w-[230px]"
      >
        <div className="w-10 h-10 rounded-full bg-[#1E7F6A]/15 flex items-center justify-center text-[#1E7F6A] shrink-0">
          <MessageSquare className="h-5 w-5 fill-[#1E7F6A]" />
        </div>
        <div>
          <h5 className="font-extrabold text-xs sm:text-sm text-[#182033] leading-tight">
            WhatsApp Confirmed
          </h5>
          <p className="text-[10.5px] text-[#1E7F6A] font-semibold mt-0.5 leading-none flex items-center space-x-1">
            <span>Instant slot alerts sent</span>
            <Check className="h-3 w-3 inline stroke-[3]" />
          </p>
        </div>
      </motion.div>
 
      {/* ── BOTTOM RIGHT FLOATING BADGE: 0-Min Queue Wait ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute bottom-2 right-[-10px] sm:right-[10px] z-20 bg-white/95 backdrop-blur-md border border-[#E8ECEF] p-3.5 sm:p-4 rounded-[20px] shadow-2xl flex items-center space-x-3 text-left max-w-[230px]"
      >
        <div className="w-10 h-10 rounded-full bg-[#1E7F6A]/15 flex items-center justify-center text-[#1E7F6A] shrink-0">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h5 className="font-extrabold text-xs sm:text-sm text-[#182033] leading-tight">
            0-Min Queue Wait
          </h5>
          <p className="text-[10.5px] text-[#3B4452] font-medium mt-0.5 leading-none">
            Live GPS OPD Sync
          </p>
        </div>
      </motion.div>
 
      {/* ── MAIN DOCTORS IMAGE ───────────────────────────────────────────── */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <img
          src="/indian_doctors_cutout_transparent.png"
          alt="Expert Apollo Doctors"
          className="w-full max-w-[580px] h-auto object-contain filter drop-shadow-2xl hover:scale-[1.01] transition-transform duration-300"
          onError={(e) => {
            // Fallback to indian_doctors_hero.png if transparent cutout unavailable
            e.target.src = "/indian_doctors_hero.png";
          }}
        />
      </div>
 
    </div>
  );
}
