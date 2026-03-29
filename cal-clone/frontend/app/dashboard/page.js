"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../services/api";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";

const DAYS = [
  { id: 0, label: "Sunday" },
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
];

function emptyDayState() {
  return DAYS.map((d) => ({
    dayOfWeek: d.id,
    enabled: d.id >= 1 && d.id <= 5,
    startTime: "09:00",
    endTime: "17:00",
  }));
}

function windowsFromApi(rows) {
  const byDay = Object.fromEntries(DAYS.map((d) => [d.id, null]));
  for (const r of rows || []) {
    byDay[r.dayOfWeek] = r;
  }
  return DAYS.map((d) => {
    const r = byDay[d.id];
    return {
      dayOfWeek: d.id,
      enabled: !!r,
      startTime: r?.startTime ?? "09:00",
      endTime: r?.endTime ?? "17:00",
    };
  });
}

function toPayload(dayState) {
  return dayState
    .filter((d) => d.enabled)
    .map((d) => ({
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
    }));
}

export default function DashboardPage() {
  const [userId, setUserId] = useState(null);
  const [userError, setUserError] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState("");
  const [bufferTime, setBufferTime] = useState(0);
  const [customQuestions, setCustomQuestions] = useState("");
  const [formError, setFormError] = useState(null);

  const [expandedId, setExpandedId] = useState(null);
  const [dayState, setDayState] = useState(emptyDayState);
  const [availLoading, setAvailLoading] = useState(false);
  const [availMessage, setAvailMessage] = useState(null);

  const loadEvents = useCallback(async (uid) => {
    const list = await api.getEvents(uid);
    setEvents(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await api.getDemoUser();
        if (cancelled) return;
        setUserId(user.id);
        await loadEvents(user.id);
      } catch (e) {
        if (!cancelled) setUserError(e.message || "Could not load demo user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadEvents]);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError(null);
    if (!userId || !title.trim()) {
      setFormError("Title is required.");
      return;
    }
    try {
      await api.createEvent({
        userId,
        title: title.trim(),
        duration: Number(duration) || 30,
        description: description.trim() || undefined,
        bufferTime: Number(bufferTime) || 0,
        customQuestions: customQuestions
          .split(",")
          .map((q) => q.trim())
          .filter(Boolean),
      });
      setTitle("");
      setDescription("");
      setDuration(30);
      setBufferTime(0);
      setCustomQuestions("");
      await loadEvents(userId);
    } catch (err) {
      setFormError(err.message || "Failed to create");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this event type?")) return;
    try {
      await api.deleteEvent(id);
      if (userId) await loadEvents(userId);
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  async function openAvailability(id) {
    setExpandedId(id);
    setAvailMessage(null);
    setAvailLoading(true);
    try {
      const rows = await api.getAvailability(id);
      setDayState(windowsFromApi(rows));
    } catch (err) {
      setAvailMessage(err.message || "Failed to load availability");
      setDayState(emptyDayState());
    } finally {
      setAvailLoading(false);
    }
  }

  async function saveAvailability(eventTypeId) {
    setAvailMessage(null);
    setAvailLoading(true);
    try {
      await api.saveAvailability(eventTypeId, toPayload(dayState));
      setAvailMessage("Availability saved.");
    } catch (err) {
      setAvailMessage(err.message || "Save failed");
    } finally {
      setAvailLoading(false);
    }
  }

  function updateDay(i, patch) {
    setDayState((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  if (loading) {
    return <p className="text-neutral-600">Loading dashboard…</p>;
  }

  if (userError) {
    return (
      <Card title="Setup required">
        <p className="text-neutral-700">{userError}</p>
        <p className="mt-2 text-sm text-neutral-600">
          From the <code className="rounded bg-neutral-100 px-1">backend</code> folder run{" "}
          <code className="rounded bg-neutral-100 px-1">npm run db:push</code> and{" "}
          <code className="rounded bg-neutral-100 px-1">npm run db:seed</code>, then refresh.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <aside className="w-64 flex-shrink-0 border-r border-neutral-200 bg-white px-4 py-8">
        <div className="mb-8 px-2 font-display text-xl font-semibold tracking-tight text-neutral-900">
          Cal.com Clone
        </div>
        <nav className="space-y-1">
          <button className="flex w-full items-center rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900">
            Event Types
          </button>
          <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900">
            Bookings
          </button>
          <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900">
            Availability
          </button>
        </nav>
      </aside>

      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-neutral-900">Event Types</h1>
            <p className="mt-1 text-neutral-600">Create and manage your public booking pages.</p>
          </div>

      <Card title="New event type" subtitle="Creates a public booking link and default Mon–Fri hours.">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Input
              label="Duration (minutes)"
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Buffer Time (minutes)"
              type="number"
              min={0}
              step={5}
              value={bufferTime}
              onChange={(e) => setBufferTime(e.target.value)}
            />
            <Input
              label="Custom Questions (comma separated)"
              value={customQuestions}
              placeholder="e.g. Phone number, Company name"
              onChange={(e) => setCustomQuestions(e.target.value)}
            />
          </div>
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit">Create event type</Button>
        </form>
      </Card>

      <Card title="Your event types">
        {events.length === 0 ? (
          <p className="text-neutral-600">No events yet. Create one above.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {events.map((ev) => (
              <li key={ev.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">{ev.title}</p>
                    <p className="text-sm text-neutral-500">
                      {ev.duration} min · /booking/{ev.slug} · {ev._count?.bookings ?? 0} bookings
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/booking/${ev.slug}`}
                      className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                    >
                      Open booking page
                    </Link>
                    <Button variant="ghost" onClick={() => openAvailability(ev.id)}>
                      {expandedId === ev.id ? "Refresh hours" : "Edit hours"}
                    </Button>
                    <Button variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => handleDelete(ev.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                {expandedId === ev.id && (
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    {availLoading && <p className="text-sm text-neutral-500">Loading…</p>}
                    <div className="space-y-3">
                      {dayState.map((d, i) => (
                        <div
                          key={d.dayOfWeek}
                          className="flex flex-wrap items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2"
                        >
                          <label className="flex min-w-[140px] items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={d.enabled}
                              onChange={(e) => updateDay(i, { enabled: e.target.checked })}
                            />
                            {DAYS.find((x) => x.id === d.dayOfWeek)?.label}
                          </label>
                          <input
                            type="time"
                            disabled={!d.enabled}
                            value={d.startTime}
                            onChange={(e) => updateDay(i, { startTime: e.target.value })}
                            className="rounded border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50"
                          />
                          <span className="text-neutral-400">–</span>
                          <input
                            type="time"
                            disabled={!d.enabled}
                            value={d.endTime}
                            onChange={(e) => updateDay(i, { endTime: e.target.value })}
                            className="rounded border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Button type="button" onClick={() => saveAvailability(ev.id)} disabled={availLoading}>
                        Save availability
                      </Button>
                      {availMessage && <span className="text-sm text-neutral-600">{availMessage}</span>}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
        </div>
      </main>
    </div>
  );
}
