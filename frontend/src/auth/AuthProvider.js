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
