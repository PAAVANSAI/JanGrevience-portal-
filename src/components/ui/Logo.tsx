import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  variant?: "light" | "dark";
}

export default function Logo({
  size = 32,
  className = "",
  variant = "dark",
}: LogoProps) {
  const fillColor = variant === "light" ? "#FFFFFF" : "#1B2A4A";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Shield shape */}
      <path
        d="M24 4L6 12V22C6 33.1 13.7 43.3 24 46C34.3 43.3 42 33.1 42 22V12L24 4Z"
        fill={fillColor}
        opacity={0.9}
      />
      {/* Inner shield highlight */}
      <path
        d="M24 8L10 14.5V22C10 31.2 16.2 39.7 24 42C31.8 39.7 38 31.2 38 22V14.5L24 8Z"
        fill={fillColor}
        opacity={0.15}
      />
      {/* Checkmark */}
      <path
        d="M20 28L16 24L14.5 25.5L20 31L33.5 17.5L32 16L20 28Z"
        fill={variant === "light" ? "#1B2A4A" : "#FFFFFF"}
      />
    </svg>
  );
}
