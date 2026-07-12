import React from 'react';
import { motion } from 'framer-motion';

export function SlotPicker({ slots, selectedDate, onDateChange, selectedSlot, onSlotChange }) {
  const dates = Object.keys(slots);

  return (
    <div className="flex flex-col gap-4">
      {/* Date tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {dates.map(date => (
          <button
            key={date}
            onClick={() => {
              onDateChange(date);
              onSlotChange('');
            }}
            className={[
              'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150',
              selectedDate === date
                ? 'border-[#1b504c] bg-[#1b504c] text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
            ].join(' ')}
          >
            {date}
          </button>
        ))}
      </div>

      {/* Slot grid */}
      {slots[selectedDate]?.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {slots[selectedDate].map(slot => (
            <motion.button
              key={slot}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSlotChange(slot)}
              className={[
                'h-10 rounded-lg text-sm border transition-all duration-150',
                selectedSlot === slot
                  ? 'border-[#1b504c] bg-[#1b504c] text-white font-semibold'
                  : 'border-gray-200 text-gray-700 hover:border-[#1b504c]/40 bg-white'
              ].join(' ')}
            >
              {slot}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 text-sm">
          No slots available for {selectedDate}
        </div>
      )}
    </div>
  );
}
