import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  
});
api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("API ERROR:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);