// services/auth.api.ts
import { api } from "./api";
import axios from "axios";
export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
}) => api.post("/auth/register", data);

export const loginUser = (data: {
  email: string;
  password: string;
}) => api.post("/auth/login", data);

export const logoutUser = () => api.post("/auth/logout");

export const getMe = () => axios.get("/auth/me",
  {
    withCredentials: true,
  }
);

export const refreshToken = () => api.post("/auth/refresh");