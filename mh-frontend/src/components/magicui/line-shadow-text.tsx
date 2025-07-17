import React from "react";

interface LineShadowTextProps {
  children: React.ReactNode;
  shadowColor?: string;
  className?: string;
}

export function LineShadowText({
  children,
  shadowColor = "black",
  className = "",
}: LineShadowTextProps) {
  return (
    <span
      className={className}
      style={{
        textShadow: `2px 2px 0 ${shadowColor}, -2px -2px 0 ${shadowColor}, 2px -2px 0 ${shadowColor}, -2px 2px 0 ${shadowColor}`,
      }}
    >
      {children}
    </span>
  );
}
