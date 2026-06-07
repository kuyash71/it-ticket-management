/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KEYCLOAK_URL?: string;
  readonly VITE_KEYCLOAK_REALM?: string;
  readonly VITE_KEYCLOAK_CLIENT_ID?: string;
  /** Dev-only: bypass Keycloak login and use a fake user. */
  readonly VITE_AUTH_BYPASS?: string;
  /** Dev-only: comma-separated roles assigned to the fake user (e.g. "MANAGER" or "AGENT,MANAGER"). */
  readonly VITE_AUTH_FAKE_ROLES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
