import axios from "./axiosInstance";

export const getEvents = () => axios.get("/events");
export const getEventById = (id) => axios.get(`/events/${id}`);
export const createEvent = (data) => axios.post("/events", data);
export const addEvent = (data) => createEvent(data);
export const updateEvent = (id, data) => axios.put(`/events/${id}`, data);
export const deleteEvent = (id) => axios.delete(`/events/${id}`);


