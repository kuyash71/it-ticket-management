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

/**
 * Singleton refresh promise — paralel 401'lerde Keycloak'a yalnızca tek bir updateToken
 * çağrısı gider. Eskisinde her başarısız istek kendi refresh'ini tetikliyordu (thundering herd).
 */
let inflightRefresh: Promise<string | undefined> | null = null;

function refreshOnce(): Promise<string | undefined> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = keycloak
    .updateToken(30) // 30 saniye min-validity: az çok yeni token'larda no-op döner
    .then(() => keycloak.token)
    .catch((err) => {
      // Refresh fail → login flow başlasın.
      void keycloak.login();
      throw err;
    })
    .finally(() => {
      inflightRefresh = null;
    });
  return inflightRefresh;
}

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !(error.config as RetryConfig)?._retry
    ) {
      try {
        const fresh = await refreshOnce();
        if (!fresh) return Promise.reject(error);
        setBearerToken(fresh);
        const config = error.config as RetryConfig;
        config._retry = true;
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${fresh}`;
        return http(config);
      } catch {
        // refreshOnce already called keycloak.login()
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
