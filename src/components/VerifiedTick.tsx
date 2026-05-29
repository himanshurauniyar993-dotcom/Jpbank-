import React from 'react';

interface VerifiedTickProps {
  type?: string;
  size?: number;
  className?: string;
}

export default function VerifiedTick({ type, size = 16, className = "" }: VerifiedTickProps) {
  if (!type) return null;

  const shadowFilter = (
    <filter id="tickShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" />
      <feOffset dx="0.5" dy="1" result="offsetblur" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.4" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );

  const goldenGradient = (
    <linearGradient id="goldenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFD700" />
      <stop offset="50%" stopColor="#FFB900" />
      <stop offset="100%" stopColor="#FF8C00" />
    </linearGradient>
  );

  if (type === 'golden') {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block ml-1 align-middle ${className}`}
        style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' }}
      >
        <defs>
          {shadowFilter}
          {goldenGradient}
        </defs>
        <path 
          d="M12 0L14.6 3.4L18.8 2.6L19.6 6.8L23.6 8.4L21.4 12L23.6 15.6L19.6 17.2L18.8 21.4L14.6 20.6L12 24L9.4 20.6L5.2 21.4L4.4 17.2L0.4 15.6L2.6 12L0.4 8.4L4.4 6.8L5.2 2.6L9.4 3.4L12 0Z" 
          fill="url(#goldenGradient)" 
        />
        <path 
          d="M7 12L10.5 15.5L17 9" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    );
  }

  if (type === 'blue') {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block ml-1 align-middle ${className}`}
        style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path 
          d="M12 0L14.6 3.4L18.8 2.6L19.6 6.8L23.6 8.4L21.4 12L23.6 15.6L19.6 17.2L18.8 21.4L14.6 20.6L12 24L9.4 20.6L5.2 21.4L4.4 17.2L0.4 15.6L2.6 12L0.4 8.4L4.4 6.8L5.2 2.6L9.4 3.4L12 0Z" 
          fill="#1DA1F2" 
        />
        <path 
          d="M7 12L10.5 15.5L17 9" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    );
  }

  if (type === 'brown') {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block ml-1 align-middle ${className}`}
        style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path 
          d="M12 0L14.6 3.4L18.8 2.6L19.6 6.8L23.6 8.4L21.4 12L23.6 15.6L19.6 17.2L18.8 21.4L14.6 20.6L12 24L9.4 20.6L5.2 21.4L4.4 17.2L0.4 15.6L2.6 12L0.4 8.4L4.4 6.8L5.2 2.6L9.4 3.4L12 0Z" 
          fill="#8B4513" 
        />
        <path 
          d="M7 12L10.5 15.5L17 9" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    );
  }

  return null;
}
