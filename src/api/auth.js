import axios from "./axiosInstance";

// Login
export const login = async (email, password) => {
  console.log("Login request data:", { email, password });
  try {
    const response = await axios.post("/auth/login", { email, password });
    console.log("Login response:", response.data);
    return response;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};

// Register
export const register = async (name, email, password) => {
  return await axios.post("/auth/register", { name, email, password });
};
