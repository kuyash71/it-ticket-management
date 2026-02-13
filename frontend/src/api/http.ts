import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"
});

export const setBearerToken = (token?: string) => {
  if (!token) {
    delete http.defaults.headers.common.Authorization;
    return;
  }

  http.defaults.headers.common.Authorization = `Bearer ${token}`;
};
