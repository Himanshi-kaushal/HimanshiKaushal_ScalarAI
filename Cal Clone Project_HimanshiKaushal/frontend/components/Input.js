export default function Input({ label, id, className = "", error, ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block w-full">
      {label && (
        <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}
