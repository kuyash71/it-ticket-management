import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setBearerToken } from "../api/http";
import { keycloak } from "./keycloak";
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [initialized, setInitialized] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [token, setToken] = useState(undefined);
    const [roles, setRoles] = useState([]);
    useEffect(() => {
        // Dev bypass: VITE_AUTH_BYPASS=true ise Keycloak init atla, fake user ile başla.
        // Backend de dev profile'da DevAuthFilter ile aynı şekilde fake auth kullanır.
        if (import.meta.env.VITE_AUTH_BYPASS === "true") {
            const fakeRoles = (import.meta.env.VITE_AUTH_FAKE_ROLES ?? "MANAGER")
                .split(",")
                .map((r) => r.trim().toUpperCase())
                .filter((r) => ["CUSTOMER", "AGENT", "MANAGER"].includes(r));
            setAuthenticated(true);
            setToken("dev-bypass-token");
            setRoles(fakeRoles);
            setInitialized(true);
            // eslint-disable-next-line no-console
            console.warn("⚠ DEV AUTH BYPASS ACTIVE — DO NOT USE IN PRODUCTION", { roles: fakeRoles });
            return;
        }
        const boot = async () => {
            const result = await keycloak.init({
                onLoad: "login-required",
                pkceMethod: "S256",
                checkLoginIframe: false
            });
            setAuthenticated(result);
            setToken(keycloak.token);
            setBearerToken(keycloak.token);
            keycloak.onAuthRefreshSuccess = () => {
                setToken(keycloak.token);
                setBearerToken(keycloak.token);
            };
            // Proactive refresh — token süresi dolduğunda 401'i beklemeden tazele.
            // Aksi takdirde her isteğin 401 alıp interceptor üzerinden retry etmesi gerekirdi.
            keycloak.onTokenExpired = () => {
                keycloak.updateToken(30).catch(() => {
                    void keycloak.login();
                });
            };
            const realmRoles = (keycloak.realmAccess?.roles ?? []);
            const known = ["CUSTOMER", "AGENT", "MANAGER"];
            setRoles(realmRoles
                .map((r) => r.toUpperCase())
                .filter((r) => known.includes(r)));
            setInitialized(true);
        };
        void boot();
    }, []);
    const value = useMemo(() => ({
        initialized,
        authenticated,
        token,
        roles,
        login: () => {
            void keycloak.login();
        },
        logout: () => {
            // Logout çağrısı redirect başlatır; redirect race'inde stale token'la
            // request gitmesin diye bearer'ı ve local state'i hemen temizle.
            setBearerToken(undefined);
            setToken(undefined);
            setAuthenticated(false);
            setRoles([]);
            void keycloak.logout();
        }
    }), [authenticated, initialized, token, roles]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export const useAuth = () => {
    const value = useContext(AuthContext);
    if (!value) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return value;
};
