import axios from "axios";
import axiosInstance from "./axiosInstance";

export const bookTicket = async (eventId, seatNumber) => {
  const res = await axiosInstance.post("/tickets/book", { eventId, seatNumber });
  return res.data;
};

export const getUserTickets = (userId) =>
  axiosInstance.get(`/tickets/user/${userId}`);

export const getAllTickets = () =>
  axiosInstance.get("/tickets/admin/all");

export const getBookedSeatsForEvent = (eventId) =>
  axiosInstance.get(`/tickets/event/${eventId}/booked-seats`);

export const getMyTickets = () =>
  axiosInstance.get("/tickets/my-tickets");

export const getMostBookedEvents = () =>
  axiosInstance.get("/tickets/analytics/most-booked");
