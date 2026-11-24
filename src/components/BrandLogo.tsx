import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md';
  showWordmark?: boolean;
}

export const BrandMark: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="1.5"
      y="1.5"
      width="37"
      height="37"
      rx="9.5"
      fill="#0E261B"
      stroke="#6C8C2E"
      strokeWidth="2"
    />
    {/* Vertical road bar */}
    <rect x="17" y="7.5" width="6" height="25" rx="3" fill="#D8FA64" />
    {/* Horizontal road bar */}
    <rect x="9.5" y="17" width="21" height="6" rx="3" fill="#D8FA64" />
    {/* Center fault pin */}
    <rect x="17.25" y="17.25" width="5.5" height="5.5" rx="1.2" fill="#E06236" />
    {/* Top-right telemetry beacon */}
    <circle cx="30" cy="10.5" r="2.6" fill="#D8FA64" />
  </svg>
);

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
}) => {
  const markSize = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-base' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <BrandMark className={`${markSize} shrink-0`} />
      {showWordmark && (
        <span className={`${textSize} font-extrabold tracking-tight leading-none`}>
          <span className="text-white">Street</span>
          <span className="text-[#D8FA64]">Fix</span>
        </span>
      )}
    </span>
  );
};
