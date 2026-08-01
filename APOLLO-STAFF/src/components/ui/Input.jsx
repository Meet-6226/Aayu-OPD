import React from 'react';

export function Input({ label, error, hint, icon, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
        <input
          className={[
            'w-full h-11 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400',
            'transition-all duration-150',
            'focus:outline-none focus:border-[#1b504c] focus:ring-2 focus:ring-[#1b504c]/10',
            error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : 'border-gray-200',
            icon ? 'pl-10 pr-4' : 'px-4',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export function OTPInput({ value, onChange, length = 6 }) {
  const inputs = React.useRef([]);

  const handleChange = (index, val) => {
    const digits = val.replace(/\D/g, '').slice(0, 1);
    const newVal = value.split('');
    newVal[index] = digits;
    const str = newVal.join('').slice(0, length);
    onChange(str);
    if (digits && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#1b504c] focus:ring-2 focus:ring-[#1b504c]/10 transition-all"
        />
      ))}
    </div>
  );
}
