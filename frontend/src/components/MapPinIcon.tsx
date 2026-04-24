'use client';

import React, { useId } from 'react';

interface MapPinIconProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function MapPinIcon({ className = '', size = 'medium' }: MapPinIconProps) {
  const uniqueId = useId();
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-20 w-20 sm:h-24 sm:w-24',
  };

  const gradientId = `pinGradient-${uniqueId}`;
  const shadowId = `pinShadow-${uniqueId}`;

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="1" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* Pin body with gradient - teardrop shape */}
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={`url(#${gradientId})`}
        filter={`url(#${shadowId})`}
      />
      {/* White dot in center */}
      <circle
        cx="12"
        cy="9"
        r={size === 'large' ? '3' : '2.5'}
        fill="white"
        opacity="0.95"
      />
      <circle
        cx="12"
        cy="9"
        r={size === 'large' ? '2' : '1.5'}
        fill="white"
        opacity="1"
      />
    </svg>
  );
}

