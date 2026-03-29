import Link from "next/link";

const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2";
const btnSecondary =
  "inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center">
        <p className="font-display text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
          Scheduling without the noise
        </p>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
          Share a link, let guests pick a time that respects your availability, and confirm
          bookings in one place.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard" className={btnPrimary}>
            Open dashboard
          </Link>
          <Link href="/booking/30min" className={btnSecondary}>
            Try demo booking
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Event types",
            body: "Create meeting types with duration and a public URL slug.",
          },
          {
            title: "Weekly hours",
            body: "Set when you are bookable — weekdays, custom windows, per event.",
          },
          {
            title: "Instant slots",
            body: "Guests see real openings; conflicts are blocked automatically.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-display text-lg font-semibold text-neutral-900">{item.title}</h3>
            <p className="mt-2 text-sm text-neutral-600">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
