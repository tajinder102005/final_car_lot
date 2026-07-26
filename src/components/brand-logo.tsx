import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function BrandLogo({ size = "md", showText = true }: BrandLogoProps) {
  const iconSizes = {
    sm: "size-8",
    md: "size-10",
    lg: "size-14",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className="group relative flex items-center gap-3 select-none">
      {/* Outer Glowing Aura */}
      <div className="relative">
        <div className="absolute -inset-1 rounded-xl bg-linear-to-r from-orange-500 via-amber-500 to-red-600 opacity-60 blur-md transition-all duration-500 group-hover:opacity-100 group-hover:blur-lg" />
        
        {/* Animated Badge Container */}
        <div className={`relative flex ${iconSizes[size]} items-center justify-center rounded-xl bg-neutral-950 p-2 ring-1 ring-orange-500/30 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:ring-orange-500/80`}>
          {/* Animated Supercar & Tachometer SVG */}
          <svg
            className="size-full overflow-visible"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFC107" />
                <stop offset="50%" stopColor="#FF6D00" />
                <stop offset="100%" stopColor="#FF3D00" />
              </linearGradient>
              <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Tachometer Arc */}
            <path
              d="M 8 32 A 18 18 0 1 1 40 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="2 3"
              className="text-neutral-800 transition-colors duration-500 group-hover:text-orange-950"
            />
            <path
              d="M 8 32 A 18 18 0 0 1 36 16"
              fill="none"
              stroke="url(#logoGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#neonGlow)"
              className="opacity-70 transition-all duration-500 group-hover:opacity-100"
            />

            {/* Sleek Aerodynamic Car Silhouette */}
            <g className="transition-transform duration-500 group-hover:translate-x-0.5">
              <path
                d="M6 31 C8 29 12 28 15 28 L33 28 C36 28 39 29 41 31 L43 35 C43.5 36.5 42.5 38 41 38 L7 38 C5.5 38 4.5 36.5 5 35 Z"
                fill="url(#logoGrad)"
                filter="url(#neonGlow)"
              />
              <path
                d="M13 27 L18 18 C19.5 15.5 22.5 14 25.5 14 L31 14 C33 14 35 15 36.5 16.5 L40 22 L41.5 27 Z"
                fill="none"
                stroke="url(#logoGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Headlight Pulsing Beam */}
              <circle cx="39" cy="32" r="1.5" fill="#FFF" className="animate-pulse" />
              <line
                x1="41"
                y1="32"
                x2="47"
                y2="32"
                stroke="#FFAB00"
                strokeWidth="2"
                strokeLinecap="round"
                className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />

              {/* Alloy Wheels with Rotation Effect */}
              <g className="transition-transform duration-700 group-hover:rotate-[360deg] origin-[14px_37px]">
                <circle cx="14" cy="37" r="3.5" fill="#0A0A0A" stroke="url(#logoGrad)" strokeWidth="2" />
                <circle cx="14" cy="37" r="1" fill="#FFC107" />
              </g>

              <g className="transition-transform duration-700 group-hover:rotate-[360deg] origin-[34px_37px]">
                <circle cx="34" cy="37" r="3.5" fill="#0A0A0A" stroke="url(#logoGrad)" strokeWidth="2" />
                <circle cx="34" cy="37" r="1" fill="#FFC107" />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-display ${textSizes[size]} font-extrabold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-white group-hover:via-amber-200 group-hover:to-orange-400 transition-all duration-300`}>
            Torque<span className="text-orange-500 group-hover:text-amber-400">Motors</span>
          </span>
          <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-neutral-400 -mt-1 group-hover:text-orange-400 transition-colors">
            Performance Inventory
          </span>
        </div>
      )}
    </div>
  );
}
