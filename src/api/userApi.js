import axios from "./axiosInstance";

export const getUsers = () => axios.get("/users");
export const getUserProfile = (id) => axios.get(`/users/${id}`);
export const updateUser = (id, data) => axios.put(`/users/${id}`, data);

// Favorites API
export const addToFavorites = (eventId) => axios.post(`/users/favorites`, { eventId });
export const removeFromFavorites = (eventId) => axios.delete(`/users/favorites/${eventId}`);
export const getFavorites = () => axios.get(`/users/favorites`);


