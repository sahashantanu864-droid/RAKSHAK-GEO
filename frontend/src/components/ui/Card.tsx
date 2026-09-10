import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
};

export const Card: React.FC<CardProps> = ({ children, className = '', elevated = false }) => {
  return (
    <div className={`bg-canvas-elevated border border-hairline rounded-md p-6 ${elevated ? 'shadow-sm shadow-black/5' : ''} ${className}`}>
      {children}
    </div>
  );
};
