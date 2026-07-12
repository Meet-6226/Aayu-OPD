import React from 'react';
import { motion } from 'framer-motion';

export function Card({ children, className = '', onClick, hover = false }) {
  const base = 'bg-white border border-gray-100 rounded-xl';
  
  if (onClick || hover) {
    return (
      <motion.div
        whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
        onClick={onClick}
        className={[base, onClick ? 'cursor-pointer' : '', className].join(' ')}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={[base, className].join(' ')}>
      {children}
    </div>
  );
}

export function DoctorCard({ doctor, onClick }) {
  return (
    <Card hover onClick={onClick} className="p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-[#e5f9f8] text-[#1b504c] flex items-center justify-center font-bold text-base flex-shrink-0">
          {doctor.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 leading-tight">{doctor.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{doctor.designation}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span className="text-xs font-semibold text-gray-700">{doctor.rating}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500">{doctor.experience} yrs exp</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="text-xs text-gray-500">{doctor.department}</span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <div>
              <span className="text-sm font-bold text-gray-900">₹{doctor.fee}</span>
              <span className="text-xs text-gray-400 ml-1">consult</span>
            </div>
            <span className="text-xs font-medium text-[#1b504c] bg-[#e5f9f8] px-2 py-1 rounded-md">
              {doctor.nextAvailable}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    primary: 'bg-[#e5f9f8] text-[#1b504c]',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-600',
    upcoming: 'bg-[#e5f9f8] text-[#1b504c]',
    completed: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-50 text-red-500',
  };

  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
      variants[variant] || variants.default,
      className
    ].join(' ')}>
      {children}
    </span>
  );
}
