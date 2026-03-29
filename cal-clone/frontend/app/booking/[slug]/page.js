"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../services/api";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Input from "../../../components/Input";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatDayLabel(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function BookingPage() {
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [slots, setSlots] = useState([]);
  const [duration, setDuration] = useState(30);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [bookError, setBookError] = useState(null);

  const questions = event?.customQuestions ? (typeof event.customQuestions === "string" ? JSON.parse(event.customQuestions) : event.customQuestions) : [];

  const dayOptions = useMemo(() => {
    const out = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 21; i++) {
      out.push(addDays(today, i));
    }
    return out;
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const ev = await api.getPublicEvent(slug);
        if (cancelled) return;
        setEvent(ev);
        setDuration(ev.duration);
      } catch (e) {
        if (!cancelled) setError(e.message || "Event not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!event?.id) return;
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const from = startOfDay(selectedDate).toISOString();
        const to = endOfDay(selectedDate).toISOString();
        const data = await api.getSlots(event.id, from, to);
        if (cancelled) return;
        setDuration(data.duration);
        setSlots(data.slots || []);
      } catch (e) {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event?.id, selectedDate]);

  async function handleBook(e) {
    e.preventDefault();
    setBookError(null);
    if (!event || !selectedSlot || !guestName.trim() || !guestEmail.trim()) {
      setBookError("Pick a time and enter your details.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createBooking({
        eventTypeId: event.id,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        startTime: selectedSlot,
        responses,
      });
      setSuccess({
        title: event.title,
        when: formatTime(selectedSlot),
        day: formatDayLabel(new Date(selectedSlot)),
      });
      setGuestName("");
      setGuestEmail("");
      setResponses({});
      setSelectedSlot(null);
      const from = startOfDay(selectedDate).toISOString();
      const to = endOfDay(selectedDate).toISOString();
      const data = await api.getSlots(event.id, from, to);
      setSlots(data.slots || []);
    } catch (err) {
      setBookError(err.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-neutral-600">Loading event…</p>;
  }

  if (error || !event) {
    return (
      <Card title="Not found">
        <p className="text-neutral-700">{error || "This scheduling link is invalid."}</p>
      </Card>
    );
  }

  if (success) {
    return (
      <Card title="You are booked" subtitle={`${success.title} · ${success.day} at ${success.when}`}>
        <p className="text-neutral-600">A confirmation has been recorded. The host may follow up by email.</p>
        <Button className="mt-4" onClick={() => setSuccess(null)}>
          Book another time
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm sm:flex">
      <div className="w-full border-b border-neutral-200 p-8 sm:w-1/3 sm:border-b-0 sm:border-r bg-neutral-50/50">
        <p className="font-medium text-neutral-500">{event.user?.name || event.user?.email || "Host"}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-neutral-900">{event.title}</h1>
        <p className="mt-4 flex items-center gap-2 font-medium text-neutral-600">
          <span className="text-xl">⏱</span> {duration} min
        </p>
        {event.description && <p className="mt-4 text-sm leading-relaxed text-neutral-600">{event.description}</p>}
      </div>

      <div className="w-full p-8 sm:w-2/3">
        {!selectedSlot ? (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-lg font-semibold text-neutral-900">Select a Date & Time</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {dayOptions.map((d) => {
                  const active = startOfDay(d).getTime() === startOfDay(selectedDate).getTime();
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(startOfDay(d))}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                        active
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                      }`}
                    >
                      {formatDayLabel(d)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {slotsLoading && <p className="text-sm text-neutral-500">Loading slots…</p>}
              {!slotsLoading && slots.length === 0 && (
                <p className="text-sm text-neutral-600">No openings on this day. Try another date.</p>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedSlot(iso)}
                    className="rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm font-medium text-neutral-700 transition-all hover:border-neutral-400 hover:bg-neutral-50 focus:border-neutral-900 focus:bg-neutral-900 focus:text-white"
                  >
                    {formatTime(iso)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-neutral-900">Confirm Booking</h2>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
              >
                Back
              </button>
            </div>
            <div className="rounded-lg bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-800">
              {formatDayLabel(new Date(selectedSlot))} at {formatTime(selectedSlot)}
            </div>
            <form onSubmit={handleBook} className="space-y-4">
              <Input label="Your Name" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
              <Input
                label="Email Address"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
              {questions.map((q, i) => (
                <Input
                  key={i}
                  label={q}
                  value={responses[q] || ""}
                  onChange={(e) => setResponses({ ...responses, [q]: e.target.value })}
                  required
                />
              ))}
              {bookError && <p className="text-sm text-red-600">{bookError}</p>}
              <div className="pt-2">
                <Button type="submit" disabled={submitting || !selectedSlot} className="w-full bg-neutral-900 text-white hover:bg-neutral-800">
                  {submitting ? "Booking…" : "Confirm Booking"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
