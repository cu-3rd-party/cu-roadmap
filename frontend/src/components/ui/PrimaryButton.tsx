interface PrimaryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  label: string;
  className?: string;
}

export function PrimaryButton({
  onClick,
  disabled,
  loading,
  loadingLabel,
  label,
  className = "",
}: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`bg-primary text-white border-none px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer disabled:opacity-50 h-10 ${className}`}
    >
      {loading ? (loadingLabel || label) : label}
    </button>
  );
}
