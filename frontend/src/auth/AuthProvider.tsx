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
    // Dev bypass: VITE_AUTH_BYPASS=true ise Keycloak init atla, fake user ile başla.
    // Backend de dev profile'da DevAuthFilter ile aynı şekilde fake auth kullanır.
    if (import.meta.env.VITE_AUTH_BYPASS === "true") {
      const fakeRoles = (import.meta.env.VITE_AUTH_FAKE_ROLES ?? "MANAGER")
        .split(",")
        .map((r: string) => r.trim().toUpperCase())
        .filter((r: string): r is UserRole => ["CUSTOMER", "AGENT", "MANAGER"].includes(r));
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
        // Logout çağrısı redirect başlatır; redirect race'inde stale token'la
        // request gitmesin diye bearer'ı ve local state'i hemen temizle.
        setBearerToken(undefined);
        setToken(undefined);
        setAuthenticated(false);
        setRoles([]);
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
