export default function Card({ children, className = "", title, subtitle }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h2 className="font-display text-xl font-semibold tracking-tight text-neutral-900">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
