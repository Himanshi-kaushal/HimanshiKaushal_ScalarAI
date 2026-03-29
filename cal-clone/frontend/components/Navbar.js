import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-semibold text-neutral-900">
          cal-clone
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-neutral-600 hover:text-neutral-900">
            Home
          </Link>
          <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-900">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
