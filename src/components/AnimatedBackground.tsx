import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 artistic-pattern">
      {/* Ambient Gradient Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#065f46]/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] bg-[#fbbf24]/10 rounded-full blur-3xl" style={{ animationDuration: '9s' }} />
      <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-[#064e3b]/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
      
      {/* Golden Matrix Highlight Overlay */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(251, 191, 36, 0.08) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} 
      />
    </div>
  );
};
