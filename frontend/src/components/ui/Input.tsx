import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <input 
        className={`bg-canvas-elevated border border-hairline text-ink text-sm rounded-sm px-3 py-2 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors ${className}`}
        {...props}
      />
    </div>
  );
};
