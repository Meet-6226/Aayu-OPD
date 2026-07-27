import React from 'react';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, MapPin, User, Activity } from 'lucide-react';

export default function PatientConsultationShowcase({ className = '' }) {
  return (
    <div className={`relative w-full max-w-[480px] mx-auto select-none font-inter ${className}`}>
      
      {/* Main Doctor Image Frame */}
      <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden border-2 border-[#1E7F6A]/30 shadow-2xl bg-cover bg-center group" style={{ backgroundImage: "url('/indian_doctor.png')" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#165B52]/90 via-transparent to-transparent" />
        
        {/* Top Floating Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-3.5 left-4 z-10 bg-white/90 backdrop-blur-md border border-[#E8ECEF] px-3.5 py-1.5 rounded-full shadow-lg flex items-center space-x-2 text-left"
        >
          <Star className="h-3.5 w-3.5 fill-[#EAF7F2] text-[#EAF7F2]" />
          <span className="text-xs font-mono-data font-bold text-[#182033]">
            APOLLO CARDIOLOGY PANEL
          </span>
        </motion.div>

        {/* Doctor Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/15 backdrop-blur-md border border-white/20 p-4 rounded-[18px] flex items-center justify-between text-left text-white shadow-xl">
          <div>
            <span className="text-[10px] font-mono-data font-bold text-[#EAF7F2] uppercase tracking-wider block">
              Consultant Cardiologist
            </span>
            <h4 className="font-fraunces font-bold text-lg text-white mt-0.5">
              Dr. Priya Sharma, MD
            </h4>
            <p className="text-[11px] text-white/80 mt-0.5 flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-[#EAF7F2] inline" />
              <span>Apollo Greams Road, Chennai</span>
            </p>
          </div>

          <div className="bg-[#1E7F6A] text-white px-3 py-1.5 rounded-full text-[10.5px] font-mono-data font-bold flex items-center space-x-1.5 shrink-0 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>ACTIVE QUEUE</span>
          </div>
        </div>
      </div>

      {/* 2 Bottom Metric Chips */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white/90 backdrop-blur-md border border-[#E8ECEF] p-3 rounded-[14px] flex items-center space-x-3 text-left shadow-md">
          <div className="w-8 h-8 rounded-full bg-[#1E7F6A]/10 flex items-center justify-center text-[#1E7F6A] shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono-data text-[#3B4452] uppercase font-bold block">TODAY'S FLOW</span>
            <span className="text-xs font-bold text-[#182033] block">12 Consultations</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md border border-[#E8ECEF] p-3 rounded-[14px] flex items-center space-x-3 text-left shadow-md">
          <div className="w-8 h-8 rounded-full bg-[#1E7F6A]/10 flex items-center justify-center text-[#1E7F6A] shrink-0">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono-data text-[#3B4452] uppercase font-bold block">AVG WAIT TIME</span>
            <span className="text-xs font-bold text-[#1E7F6A] block">&lt; 3 Minutes</span>
          </div>
        </div>
      </div>

    </div>
  );
}
