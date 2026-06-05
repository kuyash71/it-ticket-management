import axios, { type InternalAxiosRequestConfig } from "axios";
import { keycloak } from "../auth/keycloak";

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

export const setBearerToken = (token?: string) => {
  if (!token) {
    delete http.defaults.headers.common.Authorization;
    return;
  }
  http.defaults.headers.common.Authorization = `Bearer ${token}`;
};

// 401 gelince token'ı yenile ve isteği tekrar at; başarısız olursa login'e yönlendir.
http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !(error.config as RetryConfig)?._retry
    ) {
      try {
        await keycloak.updateToken(0);
        setBearerToken(keycloak.token);
        const config = error.config as RetryConfig;
        config._retry = true;
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${keycloak.token}`;
        return http(config);
      } catch {
        void keycloak.login();
      }
    }
    return Promise.reject(error);
  }
);
