import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import { setBearerToken } from "../api/http";
import { keycloak } from "./keycloak";

export type UserRole = "CUSTOMER" | "AGENT" | "MANAGER";

type AuthContextValue = {
  initialized: boolean;
  authenticated: boolean;
  token?: string;
  roles: UserRole[];
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [roles, setRoles] = useState<UserRole[]>([]);

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

      const realmRoles = (keycloak.realmAccess?.roles ?? []) as string[];
      const known: UserRole[] = ["CUSTOMER", "AGENT", "MANAGER"];
      setRoles(
        realmRoles
          .map((r) => r.toUpperCase())
          .filter((r): r is UserRole => known.includes(r as UserRole))
      );

      setInitialized(true);
    };

    void boot();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
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
    }),
    [authenticated, initialized, token, roles]
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
