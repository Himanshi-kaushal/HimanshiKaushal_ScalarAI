const BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  getDemoUser: () => request("/api/users/demo"),

  getEvents: (userId) =>
    request(`/api/events?userId=${encodeURIComponent(userId)}`),

  getPublicEvent: (slug) => request(`/api/events/public/${encodeURIComponent(slug)}`),

  createEvent: (body) =>
    request("/api/events", { method: "POST", body: JSON.stringify(body) }),

  updateEvent: (id, body) =>
    request(`/api/events/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deleteEvent: (id) => request(`/api/events/${id}`, { method: "DELETE" }),

  getAvailability: (eventTypeId) =>
    request(`/api/events/${encodeURIComponent(eventTypeId)}/availability`),

  saveAvailability: (eventTypeId, windows) =>
    request(`/api/events/${encodeURIComponent(eventTypeId)}/availability`, {
      method: "PUT",
      body: JSON.stringify({ windows }),
    }),

  getSlots: (eventTypeId, fromIso, toIso) =>
    request(
      `/api/bookings/slots?eventTypeId=${encodeURIComponent(eventTypeId)}&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
    ),

  createBooking: (body) =>
    request("/api/bookings", { method: "POST", body: JSON.stringify(body) }),

  getBookings: (eventTypeId) =>
    request(`/api/bookings?eventTypeId=${encodeURIComponent(eventTypeId)}`),
};
