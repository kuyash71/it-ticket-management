import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import { keycloak } from "./keycloak";

type AuthContextValue = {
  initialized: boolean;
  authenticated: boolean;
  token?: string;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      authenticated,
      token,
      login: () => {
        void keycloak.login();
      },
      logout: () => {
        void keycloak.logout();
      }
    }),
    [authenticated, initialized, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
};
