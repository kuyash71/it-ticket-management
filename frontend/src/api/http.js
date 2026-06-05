import axios from "axios";
import { keycloak } from "../auth/keycloak";
export const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "/",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
});
export const setBearerToken = (token) => {
    if (!token) {
        delete http.defaults.headers.common.Authorization;
        return;
    }
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
};
// 401 gelince token'ı yenile ve isteği tekrar at; başarısız olursa login'e yönlendir.
http.interceptors.response.use((response) => response, async (error) => {
    if (axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        !error.config?._retry) {
        try {
            await keycloak.updateToken(0);
            setBearerToken(keycloak.token);
            const config = error.config;
            config._retry = true;
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${keycloak.token}`;
            return http(config);
        }
        catch {
            void keycloak.login();
        }
    }
    return Promise.reject(error);
});
