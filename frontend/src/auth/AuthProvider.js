import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { keycloak } from "./keycloak";
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [initialized, setInitialized] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [token, setToken] = useState(undefined);
    useEffect(() => {
        const boot = async () => {
            const result = await keycloak.init({
                onLoad: "check-sso",
                pkceMethod: "S256",
                checkLoginIframe: false
            });
            setAuthenticated(result);
            setToken(keycloak.token);
            setInitialized(true);
        };
        void boot();
    }, []);
    const value = useMemo(() => ({
        initialized,
        authenticated,
        token,
        login: () => {
            void keycloak.login();
        },
        logout: () => {
            void keycloak.logout();
        }
    }), [authenticated, initialized, token]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export const useAuth = () => {
    const value = useContext(AuthContext);
    if (!value) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return value;
};
