import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'banner';
  inverted?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  inverted = false,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const primaryStroke = inverted ? '#ffffff' : '#f8fafc';
  const secondaryStroke = inverted ? '#cbd5e1' : '#94a3b8';
  const bgBadge = inverted ? '#090d16' : '#020617';

  // Faithful vector rendition of the official Mineiro Auto Center mark
  const svgGraphic = (
    <svg
      viewBox="0 0 300 300"
      className={`${sizeMap[size]} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Mineiro Auto Center e Mecânica"
    >
      {/* Outer Gear Ring */}
      <g stroke={secondaryStroke} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        {/* Gear Teeth */}
        <path d="M150 45 L150 30 M150 270 L150 255" />
        <path d="M45 150 L30 150 M270 150 L255 150" />
        <path d="M75 75 L65 65 M235 235 L225 225" />
        <path d="M225 75 L235 65 M65 235 L75 225" />
        <path d="M105 52 L100 40 M200 260 L195 248" />
        <path d="M195 52 L200 40 M100 260 L105 248" />
        <path d="M52 105 L40 100 M260 200 L248 195" />
        <path d="M248 105 L260 100 M40 200 L52 195" />
        {/* Main circular gear boundary */}
        <circle cx="150" cy="150" r="95" strokeWidth="5" strokeDasharray="14 10" opacity="0.4" />
        <circle cx="150" cy="150" r="80" strokeWidth="4" />
      </g>

      {/* Arched text paths */}
      <defs>
        <path id="curveTop" d="M 85 85 A 90 90 0 0 1 215 85" fill="transparent" />
        <path id="curveBottom" d="M 215 220 A 90 90 0 0 1 85 220" fill="transparent" />
      </defs>

      {/* AUTO text along top curve */}
      <text fill={primaryStroke} fontSize="20" fontWeight="900" letterSpacing="0.28em">
        <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
          AUTO
        </textPath>
      </text>

      {/* CENTER text along bottom curve */}
      <text fill={primaryStroke} fontSize="19" fontWeight="900" letterSpacing="0.22em">
        <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
          CENTER
        </textPath>
      </text>

      {/* Crossed Mechanic Tools */}
      {/* Tool 1: Open-end wrench diagonal (top-left to bottom-right) */}
      <g stroke={primaryStroke} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Top-left wrench head */}
        <path d="M90 65 C80 68 70 80 78 95 C82 102 90 106 97 104 L107 94 C100 88 100 78 107 72 Z" fill={bgBadge} />
        {/* Shaft */}
        <line x1="98" y1="102" x2="202" y2="206" strokeWidth="10" />
        {/* Bottom-right wrench head */}
        <path d="M210 235 C220 232 230 220 222 205 C218 198 210 194 203 196 L193 206 C200 212 200 222 193 228 Z" fill={bgBadge} />
      </g>

      {/* Tool 2: Screwdriver diagonal (top-right to bottom-left) */}
      <g stroke={primaryStroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {/* Screwdriver tip */}
        <line x1="228" y1="72" x2="205" y2="95" strokeWidth="6" />
        <rect x="225" y="69" width="10" height="4" transform="rotate(-45 225 69)" fill={primaryStroke} />
        {/* Shaft */}
        <line x1="205" y1="95" x2="115" y2="185" strokeWidth="8" />
        {/* Screwdriver handle bottom-left */}
        <rect
          x="72"
          y="200"
          width="40"
          height="18"
          rx="5"
          transform="rotate(45 72 200)"
          fill={bgBadge}
          stroke={primaryStroke}
          strokeWidth="5"
        />
        <line x1="78" y1="218" x2="94" y2="234" stroke={secondaryStroke} strokeWidth="3" />
      </g>

      {/* Central License Plate / Plaque */}
      <g>
        {/* Background plate */}
        <rect
          x="48"
          y="122"
          width="204"
          height="56"
          rx="6"
          fill={bgBadge}
          stroke={primaryStroke}
          strokeWidth="7"
        />
        {/* Inner thin border */}
        <rect
          x="54"
          y="128"
          width="192"
          height="44"
          rx="4"
          fill="none"
          stroke={primaryStroke}
          strokeWidth="2.5"
          opacity="0.85"
        />
        {/* Main "MINEIRO" Brand typography */}
        <text
          x="150"
          y="160"
          fill={primaryStroke}
          fontSize="35"
          fontWeight="900"
          fontFamily="'Cabinet Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          MINEIRO
        </text>
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return svgGraphic;
  }

  return (
    <div className="flex items-center gap-3">
      {svgGraphic}
      <div className="flex flex-col">
        <span className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight font-heading">
          MINEIRO
        </span>
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-blue-400 uppercase leading-none">
          Auto Center e Mecânica
        </span>
      </div>
    </div>
  );
};
