const EVENTS_URL =  import.meta.env.VITE_API_BASE_URL + "/api/v1/event";

export const es = new EventSource(EVENTS_URL, {
  withCredentials: true,
});