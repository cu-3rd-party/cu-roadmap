import React from "react";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function PrimaryButton({ children, ...props }: PrimaryButtonProps) {
  return (
    <button
      className="text-white border-none px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      style={{ backgroundColor: "var(--color-primary)" }}
      {...props}
    >
      {children}
    </button>
  );
}