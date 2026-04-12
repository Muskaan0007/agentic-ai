import axios from "axios";

const API = axios.create({ baseURL: "/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (data) => API.post("/register/", data);
export const login = (data) => API.post("/login/", data);
export const logout = () => API.post("/logout/");
export const askAgent = (query) => API.post("/agent/", { query });
export const uploadDoc = (formData) =>
  API.post("/upload/", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const getUsers = () => API.get("/users/");

export default API;
