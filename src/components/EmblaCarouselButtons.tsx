// EmblaCarouselButtons.tsx
import React from 'react';

interface ButtonProps {
  enabled: boolean;
  onClick: () => void;
}

export const PrevButton: React.FC<ButtonProps> = ({ enabled, onClick }) => (
  <button
    className={`absolute top-1/2 left-4 transform -translate-y-1/2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md z-10 transition ${
      enabled ? 'opacity-100 cursor-pointer hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'
    }`}
    onClick={onClick}
    disabled={!enabled}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
);

export const NextButton: React.FC<ButtonProps> = ({ enabled, onClick }) => (
  <button
    className={`absolute top-1/2 right-4 transform -translate-y-1/2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md z-10 transition ${
      enabled ? 'opacity-100 cursor-pointer hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'
    }`}
    onClick={onClick}
    disabled={!enabled}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
);
