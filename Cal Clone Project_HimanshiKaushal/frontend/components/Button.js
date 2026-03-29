export default function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  disabled,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";
  const variants = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500",
    secondary:
      "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus:ring-brand-500",
    ghost: "text-brand-700 hover:bg-brand-50 focus:ring-brand-500",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
